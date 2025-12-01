import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    // Use uploads directory in backend-api
    this.uploadDir = path.join(process.cwd(), 'uploads');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    console.log('📤 S3Service.uploadFile called');
    console.log('📂 Upload directory:', this.uploadDir);
    console.log('📄 File details:', { originalname: file.originalname, mimetype: file.mimetype, size: file.size });

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      console.error('❌ File size exceeds limit:', file.size);
      throw new BadRequestException('File size exceeds 2MB limit');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      console.error('❌ Invalid file type:', file.mimetype);
      throw new BadRequestException('Only PDF, PNG, and JPG files are allowed');
    }

    // Validate buffer exists
    if (!file.buffer) {
      console.error('❌ File buffer is undefined');
      throw new BadRequestException('File data is missing');
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    console.log('💾 Writing file to:', filePath);

    try {
      // Ensure directory exists
      if (!fs.existsSync(this.uploadDir)) {
        console.log('📁 Creating upload directory:', this.uploadDir);
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }

      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);
      console.log('✅ File written successfully:', fileName);

      // Verify file was written
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log('✅ File verified on disk:', { size: stats.size, path: filePath });
      }

      // Return URL that will be served by static module
      const baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';
      const fileUrl = `${baseUrl}/uploads/${fileName}`;
      console.log('🔗 File URL:', fileUrl);
      return fileUrl;
    } catch (error) {
      console.error('❌ Failed to write file:', error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }
}
