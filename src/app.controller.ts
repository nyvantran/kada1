import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API Root Information', description: 'Returns base API metadata and links to docs.' })
  @ApiResponse({ status: 200, description: 'API info returned successfully.' })
  getInfo() {
    return this.appService.getInfo();
  }
}
