import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { S3Service } from './s3.service';

@Injectable()
export class EmailRequestService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
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
}
