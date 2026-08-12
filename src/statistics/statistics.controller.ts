import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RecentPostsQueryDto } from './dto/recent-posts-query.dto.js';
import { StatisticsService } from './statistics.service.js';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get an application overview',
    description:
      'Returns user and post totals, including active users and publication status.',
  })
  @ApiResponse({ status: 200, description: 'Overview returned successfully.' })
  getOverview() {
    return this.statisticsService.getOverview();
  }

  @Get('users-by-role')
  @ApiOperation({
    summary: 'Get user counts grouped by role',
    description: 'Returns the number of users assigned to each role.',
  })
  @ApiResponse({
    status: 200,
    description: 'User role distribution returned successfully.',
  })
  getUsersByRole() {
    return this.statisticsService.getUsersByRole();
  }

  @Get('recent-posts')
  @ApiOperation({
    summary: 'Get recent posts',
    description:
      'Returns the most recently created posts with basic author information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent posts returned successfully.',
  })
  getRecentPosts(@Query() query: RecentPostsQueryDto) {
    return this.statisticsService.getRecentPosts(query.limit);
  }
}
