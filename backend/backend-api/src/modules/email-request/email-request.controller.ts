import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmailRequestService } from './email-request.service';
import * as multer from 'multer';

@Controller('email-request')
@UseGuards(JwtAuthGuard)
export class EmailRequestController {
  constructor(private readonly emailRequestService: EmailRequestService) {}

  // Student: Create email request with file upload
  @Post()
  @UseInterceptors(
    FileInterceptor('document', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  )
  async createRequest(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('🔍 Upload request received');
    console.log('📄 file:', file ? { originalname: file.originalname, mimetype: file.mimetype, size: file.size, hasBuffer: !!file.buffer } : 'undefined');
    console.log('👤 user:', req.user);

    if (!file) {
      console.error('❌ No file uploaded');
      throw new BadRequestException('Document file is required');
    }

    if (!file.buffer) {
      console.error('❌ File buffer is undefined');
      throw new BadRequestException('File upload failed - no file data received');
    }

    console.log('📁 File upload received:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      studentId: req.user.userId,
    });

    try {
      const studentId = req.user.userId;
      const result = await this.emailRequestService.createRequest(studentId, file);

      console.log('✅ Email request created:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error creating email request:', error.message);
      throw error;
    }
  }

  // Student: Get own requests
  @Get('me')
  async getMyRequests(@Req() req: any) {
    const studentId = req.user.userId;
    return this.emailRequestService.getStudentRequests(studentId);
  }

  // Admin: Get all pending requests
  // Admin: Get all pending requests
  @Get()
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  async getAllPendingRequests() {
    return this.emailRequestService.getAllPendingRequests();
  }

  // Trigger OCR extraction for a request
  @Post(':id/extract')
  async extractOcrData(@Param('id') id: string) {
    return this.emailRequestService.extractOcrData(id);
  }
}
