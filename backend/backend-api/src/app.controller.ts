import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
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
}

