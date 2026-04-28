import { Body, Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/hello')
  sendHellotoUser(@Body('name') name: string, @Req() req, @Res() res): string {
    return this.appService.sendHelloToUser(name);
  }
}
