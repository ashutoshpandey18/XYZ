import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * POST /admin/email-issue/:requestId
   * Issue college email for approved request
   */
  @Post('email-issue/:requestId')
  @HttpCode(HttpStatus.OK)
  async issueCollegeEmail(@Param('requestId') requestId: string) {
    return this.adminService.issueCollegeEmail(requestId);
  }

  /**
   * GET /admin/issued-emails
   * Get all issued emails history
   */
  @Get('issued-emails')
  async getIssuedEmails() {
    return this.adminService.getIssuedEmailsHistory();
  }

  /**
   * GET /admin/pending-issuances
   * Get approved requests pending email issuance
   */
  @Get('pending-issuances')
  async getPendingIssuances() {
    return this.adminService.getPendingIssuances();
  }
}
