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
    console.log('🔄 EmailRequestService.createRequest called for student:', studentId);

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

    // Upload file to S3
    const documentURL = await this.s3Service.uploadFile(file);
    console.log('✅ File uploaded, URL:', documentURL);

    // Create email request
    console.log('💾 Creating email request in database');
    const emailRequest = await this.prisma.emailRequest.create({
      data: {
        studentId,
        documentURL,
        status: 'PENDING',
      },
      include: {
        student: true,
      },
    });

    console.log('✅ Email request created in DB:', emailRequest.id);

    // Trigger OCR extraction asynchronously (don't await - non-blocking)
    this.extractOcrData(emailRequest.id).catch((error) => {
      console.error('⚠️ OCR extraction failed (non-blocking):', error.message);
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

    // Return requests with stored AI decision (no recalculation)
    return requests.map((request) => {
      if (request.aiDecision && request.confidenceScore !== null) {
        return {
          ...request,
          aiDecision: {
            aiDecision: request.aiDecision as any,
            confidenceScore: request.confidenceScore,
            nameMatch: 0,
            rollMatch: 0,
          },
        };
      }
      return request;
    });
  }

  async approveRequest(requestId: string) {
    const request = await this.prisma.emailRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Email request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only pending requests can be approved');
    }

    const updatedRequest = await this.prisma.emailRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
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

    return updatedRequest;
  }

  async rejectRequest(requestId: string) {
    const request = await this.prisma.emailRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Email request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const updatedRequest = await this.prisma.emailRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
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

    return updatedRequest;
  }

  async extractOcrData(requestId: string) {
    console.log('🔍 Starting OCR extraction for request:', requestId);

    // Find the request
    const request = await this.prisma.emailRequest.findUnique({
      where: { id: requestId },
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

    if (!request) {
      throw new NotFoundException('Email request not found');
    }

    // Check if already extracted (avoid duplicate processing)
    if (request.aiDecision && request.confidenceScore !== null) {
      console.log('⚠️ OCR and AI evaluation already completed, returning cached result');
      return {
        ...request,
        aiDecision: {
          aiDecision: request.aiDecision as any,
          confidenceScore: request.confidenceScore,
          nameMatch: 0,
          rollMatch: 0,
        },
      };
    }

    // Extract OCR data
    const ocrResult = await this.ocrService.extractTextFromImage(request.documentURL);

    // Update request with extracted data
    const updateData: any = {};
    if (ocrResult.extractedName) {
      updateData.extractedName = ocrResult.extractedName;
    }
    if (ocrResult.extractedRoll) {
      updateData.extractedRoll = ocrResult.extractedRoll;
    }
    if (ocrResult.extractedCollegeId) {
      updateData.extractedCollegeId = ocrResult.extractedCollegeId;
    }

    // Calculate AI decision ONCE
    const aiDecisionResult = this.ocrService.calculateAiDecision(
      ocrResult.extractedName || undefined,
      ocrResult.extractedRoll || undefined,
      request.student.name,
      request.student.email,
    );

    // Store AI decision in database
    updateData.aiDecision = aiDecisionResult.aiDecision;
    updateData.confidenceScore = aiDecisionResult.confidenceScore;

    console.log('💾 Updating request with OCR data and AI decision');
    const updatedRequest = await this.prisma.emailRequest.update({
      where: { id: requestId },
      data: updateData,
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

    console.log('✅ OCR extraction and AI evaluation completed');

    return {
      ...updatedRequest,
      aiDecision: aiDecisionResult,
    };
  }
}
