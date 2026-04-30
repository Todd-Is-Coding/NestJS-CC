import { Controller , Get, Post , Body , Param } from '@nestjs/common';
import { createMessageDTO } from './dtos/create-message.dto';
@Controller('messages')
export class MessagesController {

    @Get()
    listMessageS(){

    }

    @Post()
    createMessage(@Body() body : createMessageDTO){
        console.log(body);
        return body;
    }

    @Get('/:id')
    getMessage(@Param('id') id : string){
        console.log(id);
    }

}
