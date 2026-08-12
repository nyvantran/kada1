import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Building Scalable Backend with NestJS', description: 'Post title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Deep dive into NestJS, Prisma, and Redis caching strategies.', description: 'Post content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: false, default: false, description: 'Post publication status' })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Author User UUID' })
  @IsUUID('4', { message: 'authorId must be a valid UUID' })
  @IsNotEmpty()
  authorId: string;
}
