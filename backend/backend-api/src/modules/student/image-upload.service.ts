import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageUploadService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'profile-photos');

  constructor(private prisma: PrismaService) {
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }
  }

  async uploadProfilePhoto(userId: string, file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG and PNG images are allowed');
    }

    // Generate unique filename
    const filename = `${uuidv4()}-${Date.now()}.jpg`;
    const filepath = path.join(this.uploadsDir, filename);

    try {
      // Process image: resize to 256x256 and convert to JPEG
      await sharp(file.buffer)
        .resize(256, 256, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(filepath);

      // Get old profile photo if exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profilePhotoUrl: true },
      });

      // Delete old photo if exists
      if (user?.profilePhotoUrl) {
        const oldFilename = path.basename(user.profilePhotoUrl);
        const oldFilepath = path.join(this.uploadsDir, oldFilename);
        try {
          await fs.unlink(oldFilepath);
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }

      // Update database with new photo URL
      const photoUrl = `/uploads/profile-photos/${filename}`;
      await this.prisma.user.update({
        where: { id: userId },
        data: { profilePhotoUrl: photoUrl },
      });

      return photoUrl;
    } catch (error) {
      // Clean up file if database update fails
      try {
        await fs.unlink(filepath);
      } catch {}

      throw new BadRequestException('Failed to upload profile photo');
    }
  }
}
