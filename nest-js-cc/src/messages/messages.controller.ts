import { Controller , Get, Post , Body , Param } from '@nestjs/common';

@Controller('messages')
export class MessagesController {

    @Get()
    listMessageS(){

    }

    @Post()
    createMessage(){

    }

    @Get('/:id')
    getMessage(){

    }

}
