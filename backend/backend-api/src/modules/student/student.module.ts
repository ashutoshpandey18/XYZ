import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { PrismaService } from '../../prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  controllers: [StudentController],
  providers: [PrismaService],
})
export class StudentModule {}
