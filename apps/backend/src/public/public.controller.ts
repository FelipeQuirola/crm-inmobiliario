import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PublicService } from './public.service';
import { ListPublicPropertiesDto } from './dto/list-public-properties.dto';
import { ContactFormDto } from './dto/contact-form.dto';
import { ContactRateLimitGuard } from './guards/contact-rate-limit.guard';

@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // GET /api/public/properties?slug=homematch&type=CASA&city=Quito&skip=0&take=12
  @Get('properties')
  listProperties(@Query() dto: ListPublicPropertiesDto) {
    return this.publicService.listProperties(dto);
  }

  // GET /api/public/properties/search?slug=homematch&q=casa norte quito
  // MUST come before :id route
  @Get('properties/search')
  searchProperties(@Query('slug') slug: string, @Query('q') query: string) {
    return this.publicService.searchProperties(slug, query ?? '');
  }

  // GET /api/public/properties/:id?slug=homematch
  @Get('properties/:id')
  getProperty(@Param('id') id: string, @Query('slug') slug: string) {
    return this.publicService.getProperty(slug, id);
  }

  // GET /api/public/agents?slug=homematch
  @Get('agents')
  listAgents(@Query('slug') slug: string) {
    return this.publicService.listAgents(slug);
  }

  // POST /api/public/contact
  @Post('contact')
  @UseGuards(ContactRateLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  contact(@Body() dto: ContactFormDto) {
    return this.publicService.contact(dto);
  }
}
