import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEmailRequestDto {
  @IsString()
  @IsNotEmpty()
  documentURL: string;
}
