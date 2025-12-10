import { IsString, IsInt, IsNotEmpty, IsEmail, Min, Max } from 'class-validator';

export class EmailSettingsDto {
  @IsString()
  @IsNotEmpty()
  smtpHost: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort: number;

  @IsEmail()
  @IsNotEmpty()
  smtpUser: string;

  @IsString()
  @IsNotEmpty()
  smtpPass: string;

  @IsEmail()
  @IsNotEmpty()
  fromEmail: string;

  @IsString()
  @IsNotEmpty()
  fromName: string;
}
