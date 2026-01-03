import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { S3Service } from './s3.service';
import { OcrService } from './ocr.service';

@Injectable()
export class EmailRequestService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private ocrService: OcrService,
  ) {}

  async createRequest(studentId: string, file: Express.Multer.File) {
    console.log('\n ===== NEW EMAIL REQUEST =====');
    console.log('📋 Student ID:', studentId);
    console.log('📄 File:', file.originalname, `(${file.size} bytes)`);

    // Check if student already has a pending request
    const existingPendingRequest = await this.prisma.emailRequest.findFirst({
      where: {
        studentId,
        status: 'PENDING',
      },
    });

    if (existingPendingRequest) {
      console.log('⚠️ Student already has pending request:', existingPendingRequest.id);
      throw new BadRequestException('You already have a pending email request. Please wait for it to be processed.');
    }

    console.log('✅ No pending request found, proceeding with upload');

    // Upload file to S3/local storage
    const documentURL = await this.s3Service.uploadFile(file);
    console.log('✅ File uploaded to:', documentURL);

    // Create email request
    console.log('💾 Creating email request in database');
    const emailRequest = await this.prisma.emailRequest.create({
      data: {
        studentId,
        documentURL,
        status: 'PENDING',
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    console.log('✅ Email request created with ID:', emailRequest.id);
    console.log('🔄 Triggering OCR pipeline asynchronously...');

    // Trigger OCR + AI pipeline asynchronously (non-blocking)
    this.processOCRPipeline(emailRequest.id).catch((error) => {
      console.error('❌ OCR/AI pipeline failed:', error.message);
      // Update request with error status
      this.prisma.emailRequest.update({
        where: { id: emailRequest.id },
        data: {
          adminNotes: `OCR failed: ${error.message}`,
        },
      }).catch(console.error);
    });

    return emailRequest;
  }

  async getStudentRequests(studentId: string) {
    const requests = await this.prisma.emailRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return requests;
  }

  async getAllPendingRequests() {
    const requests = await this.prisma.emailRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return requests;
  }

  /**
   * COMPLETE OCR + AI PIPELINE
   * This is the main processing function that handles:
   * 1. OCR extraction
   * 2. Field extraction (name, roll, ID)
   * 3. AI evaluation
   * 4. Database update with results
   */
  async processOCRPipeline(requestId: string) {
    console.log('\n🔬 ===== STARTING OCR+AI PIPELINE =====');
    console.log('📋 Request ID:', requestId);

    try {
      // Step 1: Fetch the request
      const request = await this.prisma.emailRequest.findUnique({
        where: { id: requestId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!request) {
        throw new NotFoundException(`Email request ${requestId} not found`);
      }

      // Check if already processed
      if (request.ocrCompletedAt) {
        console.log('⚠️ OCR already completed at:', request.ocrCompletedAt);
        return request;
      }

      console.log('👤 Student:', request.student.name, `(${request.student.email})`);
      console.log('📄 Document URL:', request.documentURL);

      // Step 2: Extract OCR data
      console.log('\n📝 Step 1/3: Running OCR extraction...');
      const ocrResult = await this.ocrService.extractTextFromImage(request.documentURL);

      console.log('✅ OCR extraction complete');
      console.log('📊 Extracted fields:', {
        name: ocrResult.extractedName || 'Not found',
        roll: ocrResult.extractedRoll || 'Not found',
        collegeId: ocrResult.extractedCollegeId || 'Not found',
        textLength: ocrResult.rawText.length,
      });

      // Step 3: Run AI evaluation
      console.log('\n🧠 Step 2/3: Running AI evaluation...');
      const aiDecision = this.ocrService.calculateAiDecision(
        ocrResult.extractedName,
        ocrResult.extractedRoll,
        request.student.name,
        request.student.email,
      );

      console.log('✅ AI evaluation complete');
      console.log('🎯 AI Decision:', aiDecision.aiDecision);
      console.log('📊 Confidence Score:', `${(aiDecision.confidenceScore * 100).toFixed(0)}%`);

      // Step 4: Update database with all results
      console.log('\n💾 Step 3/3: Updating database...');
      const updatedRequest = await this.prisma.emailRequest.update({
        where: { id: requestId },
        data: {
          // OCR extracted fields
          extractedName: ocrResult.extractedName || null,
          extractedRoll: ocrResult.extractedRoll || null,
          extractedCollegeId: ocrResult.extractedCollegeId || null,

          // AI decision results
          aiDecision: aiDecision.aiDecision,
          confidenceScore: aiDecision.confidenceScore,

          // Mark OCR as completed
          ocrCompletedAt: new Date(),

          // Status remains PENDING for admin review
          status: 'PENDING',
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      console.log('✅ Database updated successfully');
      console.log('✅ ===== PIPELINE COMPLETE =====\n');

      return updatedRequest;

    } catch (error) {
      console.error('❌ ===== PIPELINE FAILED =====');
      console.error('❌ Error:', error.message);
      console.error('❌ Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Legacy method for manual OCR trigger (kept for backwards compatibility)
   */
  async extractOcrData(requestId: string) {
    console.log('🔄 Legacy extractOcrData called, redirecting to processOCRPipeline');
    return this.processOCRPipeline(requestId);
  }
}
