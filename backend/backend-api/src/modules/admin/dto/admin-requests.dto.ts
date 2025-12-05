import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRequestsQueryDto {
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'ISSUED'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search by name, email, roll number

  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'confidenceScore', 'status'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ApproveRequestDto {
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class RejectRequestDto {
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class IssueEmailDto {
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
