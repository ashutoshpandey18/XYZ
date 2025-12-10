import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  GetRequestsQueryDto,
  ApproveRequestDto,
  RejectRequestDto,
  IssueEmailDto,
} from './dto/admin-requests.dto';
import { EmailSettingsDto } from './dto/email-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * DAY-7: GET /admin/requests
   * Get all requests with filtering, searching, sorting
   */
  @Get('requests')
  async getAllRequests(@Query() query: GetRequestsQueryDto, @Request() req) {
    // getAllRequests already returns PaginatedRequestsDto with flat structure
    return this.adminService.getAllRequests(query, req.user.userId);
  }

  /**
   * DAY-7: GET /admin/requests/:id
   * Get single request details with audit logs
   */
  @Get('requests/:id')
  async getRequestDetails(@Param('id') id: string) {
    return this.adminService.getRequestDetails(id);
  }

  /**
   * DAY-7: PATCH /admin/requests/:id/approve
   * Approve a pending request
   */
  @Patch('requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveRequest(
    @Param('id') id: string,
    @Body() dto: ApproveRequestDto,
    @Request() req,
  ) {
    return this.adminService.approveRequest(id, req.user.userId, dto.adminNotes);
  }

  /**
   * DAY-7: PATCH /admin/requests/:id/reject
   * Reject a pending request
   */
  @Patch('requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Patch('requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectRequest(
    @Param('id') id: string,
    @Body() dto: RejectRequestDto,
    @Request() req,
  ) {
    // adminNotes is required in RejectRequestDto
    return this.adminService.rejectRequest(id, req.user.userId, dto.adminNotes);
  }

  /**
   * DAY-7: POST /admin/requests/:id/issue-email
   * Issue college email with real delivery via Nodemailer
   */
  @Post('requests/:id/issue-email')
  @HttpCode(HttpStatus.OK)
  async issueCollegeEmail(
    @Param('id') id: string,
    @Body() dto: IssueEmailDto,
    @Request() req,
  ) {
    return this.adminService.issueCollegeEmailWithDelivery(
      id,
      req.user.userId,
      dto.adminNotes,
    );
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
   * GET /admin/stats
   * Get dashboard statistics
   */
  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /**
   * GET /admin/email-settings
   * Get current email settings
   */
  @Get('email-settings')
  async getEmailSettings() {
    return this.adminService.getEmailSettings();
  }

  /**
   * PUT /admin/email-settings
   * Update email settings
   */
  @Put('email-settings')
  @HttpCode(HttpStatus.OK)
  async updateEmailSettings(@Body() dto: EmailSettingsDto) {
    return this.adminService.updateEmailSettings(dto);
  }

  /**
   * POST /admin/email-settings/test
   * Send test email
   */
  @Post('email-settings/test')
  @HttpCode(HttpStatus.OK)
  async sendTestEmail(@Body() body: { toEmail: string }) {
    return this.adminService.sendTestEmail(body.toEmail);
  }

  /**
   * PUT /admin/change-password
   * Change admin password (ADMIN ONLY)
   * Requires: oldPassword + newPassword
   */
  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req,
  ) {
    return this.adminService.changeAdminPassword(
      req.user.userId,
      dto.oldPassword,
      dto.newPassword,
    );
  }
}
