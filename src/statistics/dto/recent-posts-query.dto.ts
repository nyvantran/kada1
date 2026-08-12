import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RecentPostsQueryDto {
  @ApiPropertyOptional({
    default: 5,
    minimum: 1,
    maximum: 20,
    description: 'Maximum number of recent posts to return',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number = 5;
}
