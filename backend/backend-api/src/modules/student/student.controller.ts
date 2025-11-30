import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma.service';

@Controller('student')
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }
}
