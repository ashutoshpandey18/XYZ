import { Controller, Get, Delete } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Controller()
export class AppController {
  private prisma = new PrismaClient();

  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'College Email SaaS API is running',
      timestamp: new Date().toISOString(),
      version: '2.0-nuclear-cors',
      endpoints: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
      },
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
    };
  }

  @Get('cors-test')
  corsTest() {
    return {
      message: 'If you can see this, CORS is working!',
      origin: 'allowed',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('users/delete-all')
  async deleteAllUsers(): Promise<{ message: string }> {
    await this.prisma.user.deleteMany();
    return { message: 'All users have been deleted successfully.' };
  }
}

