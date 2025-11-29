import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'College Email SaaS API is running',
      timestamp: new Date().toISOString(),
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
}
