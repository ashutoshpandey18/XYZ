import {
  Controller,
  Post,
  Get,
  Patch,
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
    return this.adminService.getAllRequests(query, req.user.id);
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
    return this.adminService.approveRequest(id, req.user.id, dto.adminNotes);
  }

  /**
   * DAY-7: PATCH /admin/requests/:id/reject
   * Reject a pending request
   */
  @Patch('requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectRequest(
    @Param('id') id: string,
    @Body() dto: RejectRequestDto,
    @Request() req,
  ) {
    return this.adminService.rejectRequest(id, req.user.id, dto.adminNotes);
  }

  /**
   * DAY-7: POST /admin/requests/:id/issue-email
   * Issue college email (DB only, no actual email sending)
   */
  @Post('requests/:id/issue-email')
  @HttpCode(HttpStatus.OK)
  async issueCollegeEmail(
    @Param('id') id: string,
    @Body() dto: IssueEmailDto,
    @Request() req,
  ) {
    return this.adminService.issueCollegeEmailDbOnly(
      id,
      req.user.id,
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
}
