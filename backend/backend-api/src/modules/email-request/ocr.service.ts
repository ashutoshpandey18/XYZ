import { Injectable, BadRequestException } from '@nestjs/common';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

export interface OcrResult {
  extractedName?: string;
  extractedRoll?: string;
  extractedCollegeId?: string;
  rawText: string;
}

export interface AiDecision {
  aiDecision: 'LIKELY_APPROVE' | 'REVIEW_MANUALLY' | 'FLAG_SUSPICIOUS';
  confidenceScore: number;
  nameMatch: number;
  rollMatch: number;
}

@Injectable()
export class OcrService {
  /**
   * Preprocess image for better OCR accuracy
   */
  private async preprocessImage(imagePath: string): Promise<Buffer> {
    console.log('🖼️ Preprocessing image:', imagePath);

    try {
      const processedBuffer = await sharp(imagePath)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .grayscale()
        .normalize()
        .linear(1.5, -(128 * 1.5) + 128) // Increase contrast
        .sharpen()
        .threshold(128) // Binary threshold for better text detection
        .toBuffer();

      console.log('✅ Image preprocessed successfully');
      return processedBuffer;
    } catch (error) {
      console.error('❌ Image preprocessing failed:', error.message);
      throw new BadRequestException('Failed to preprocess image for OCR');
    }
  }

  /**
   * Extract text from image using Tesseract OCR
   */
  async extractTextFromImage(documentURL: string): Promise<OcrResult> {
    console.log('🔍 Starting OCR extraction for:', documentURL);

    // Extract local file path from URL
    const fileName = documentURL.split('/uploads/').pop();
    if (!fileName) {
      throw new BadRequestException('Invalid document URL');
    }

    const uploadDir = path.join(process.cwd(), 'uploads');
    const imagePath = path.join(uploadDir, fileName);

    // Verify file exists
    if (!fs.existsSync(imagePath)) {
      throw new BadRequestException('Document file not found');
    }

    // Validate file type
    const ext = path.extname(imagePath).toLowerCase();
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
    if (!allowedTypes.includes(ext)) {
      throw new BadRequestException('Only JPG, PNG, and PDF files are supported for OCR');
    }

    try {
      // Preprocess image
      const processedImage = await this.preprocessImage(imagePath);

      // Create Tesseract worker
      console.log('🤖 Initializing Tesseract worker...');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`📝 OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Set timeout for OCR (10 seconds)
      const ocrPromise = worker.recognize(processedImage);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OCR timeout after 10 seconds')), 10000),
      );

      const { data } = await Promise.race([ocrPromise, timeoutPromise]) as any;
      await worker.terminate();

      console.log('✅ OCR completed successfully');
      console.log('📄 Raw text length:', data.text.length);

      // Extract structured fields
      const result = this.extractFields(data.text);
      console.log('📊 Extracted fields:', {
        name: result.extractedName || 'Not found',
        roll: result.extractedRoll || 'Not found',
        collegeId: result.extractedCollegeId || 'Not found',
      });

      return result;
    } catch (error) {
      console.error('❌ OCR extraction failed:', error.message);
      throw new BadRequestException(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract structured fields from OCR text using regex patterns
   */
  private extractFields(text: string): OcrResult {
    const result: OcrResult = {
      rawText: text,
    };

    // Clean up text - remove extra whitespace and newlines
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const rawText = text.replace(/\n/g, ' ');

    // Pattern for Name (multiple variations)
    const namePatterns = [
      /Name[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /Student\s+Name[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /Full\s+Name[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    ];

    for (const pattern of namePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        result.extractedName = match[1].trim();
        break;
      }
    }

    // Pattern for Roll Number - IMPROVED FOR 15-DIGIT FORMAT
    // First try precise 15-digit pattern starting with 20
    const preciseRollPattern = /\b(20\d{13})\b/;
    const preciseMatch = rawText.match(preciseRollPattern);

    if (preciseMatch && preciseMatch[1]) {
      result.extractedRoll = preciseMatch[1].trim();
      console.log('✅ Roll number found using precise pattern:', result.extractedRoll);
    } else {
      // Fallback to traditional patterns
      const rollPatterns = [
        /(?:Roll|Roll\s+No|Roll\s+Number)[:\s-]+(\d{10,15})/i,
        /Registration\s+No[:\s-]+(\d{10,15})/i,
        /Enrollment\s+No[:\s-]+(\d{10,15})/i,
      ];

      for (const pattern of rollPatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
          result.extractedRoll = match[1].trim();
          console.log('⚠️ Roll number found using fallback pattern:', result.extractedRoll);
          break;
        }
      }

      if (!result.extractedRoll) {
        console.log('❌ Roll number not detected in OCR text');
      }
    }

    // Pattern for College/Student ID (multiple variations)
    const idPatterns = [
      /(?:ID|College\s+ID|Student\s+ID)[:\s-]+([A-Z0-9]+)/i,
      /ID\s+Number[:\s-]+([A-Z0-9]+)/i,
      /Card\s+No[:\s-]+([A-Z0-9]+)/i,
    ];

    for (const pattern of idPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        result.extractedCollegeId = match[1].trim().toUpperCase();
        break;
      }
    }

    return result;
  }

  /**
   * Calculate similarity between two strings (0-1 scale)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    // Levenshtein distance based similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * AI Decision Engine - Compare extracted fields with student data
   */
  calculateAiDecision(
    extractedName?: string,
    extractedRoll?: string,
    studentName?: string,
    studentEmail?: string,
  ): AiDecision {
    console.log('\n🧠 ===== AI DECISION CALCULATION ===== ');
    console.log('📋 Extracted Data:', { extractedName, extractedRoll });
    console.log('👤 Student Data:', { studentName, studentEmail });

    let nameMatch = 0;
    let rollMatch = 0.5; // Neutral score if roll not detected (no penalty)

    // Name matching (60% weight)
    if (extractedName && studentName) {
      nameMatch = this.calculateSimilarity(extractedName, studentName);
      console.log(`👤 Name match: ${(nameMatch * 100).toFixed(0)}% ("${extractedName}" vs "${studentName}")`);
    } else {
      console.log('⚠️ Name not available for matching');
    }

    // Roll matching (40% weight) - IMPROVED LOGIC
    if (extractedRoll) {
      if (studentEmail) {
        // Try to extract roll from email (e.g., student202310101110069@college.edu)
        const emailPrefix = studentEmail.split('@')[0];
        const emailRollMatch = emailPrefix.match(/20\d{13}/);

        if (emailRollMatch) {
          const emailRoll = emailRollMatch[0];
          rollMatch = extractedRoll === emailRoll ? 1.0 : 0.0;
          console.log(`🎯 Roll match: ${(rollMatch * 100).toFixed(0)}% ("${extractedRoll}" vs "${emailRoll}")`);
        } else {
          // Partial match fallback
          const partialMatch = extractedRoll.includes(emailPrefix) || emailPrefix.includes(extractedRoll);
          rollMatch = partialMatch ? 0.7 : 0.3;
          console.log(`🔍 Partial roll match: ${(rollMatch * 100).toFixed(0)}%`);
        }
      } else {
        console.log('⚠️ Student email not available for roll matching - using neutral score');
        rollMatch = 0.5; // Neutral
      }
    } else {
      console.log('⚠️ Roll number not extracted - using neutral score (no penalty)');
      rollMatch = 0.5; // Neutral score - not a failure, just undetected
    }

    // Calculate weighted confidence score
    const confidenceScore = nameMatch * 0.6 + rollMatch * 0.4;
    console.log(`📊 Final Score: ${(confidenceScore * 100).toFixed(0)}% (Name: ${(nameMatch * 100).toFixed(0)}% × 0.6 + Roll: ${(rollMatch * 100).toFixed(0)}% × 0.4)`);

    // Determine AI decision with UPDATED THRESHOLDS
    let aiDecision: 'LIKELY_APPROVE' | 'REVIEW_MANUALLY' | 'FLAG_SUSPICIOUS';
    if (confidenceScore >= 0.90) {
      aiDecision = 'LIKELY_APPROVE';
    } else if (confidenceScore >= 0.70) {
      aiDecision = 'REVIEW_MANUALLY';
    } else {
      aiDecision = 'FLAG_SUSPICIOUS';
    }

    console.log(`🎯 AI Decision: ${aiDecision}`);
    console.log('===== END AI DECISION =====\n');

    return {
      aiDecision,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      nameMatch: Math.round(nameMatch * 100) / 100,
      rollMatch: Math.round(rollMatch * 100) / 100,
    };
  }
}
