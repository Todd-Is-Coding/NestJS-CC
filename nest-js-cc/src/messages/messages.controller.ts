import { Controller , Get, Post , Body , Param } from '@nestjs/common';
import { createMessageDTO } from './dtos/create-message.dto';
import { MessagesService } from './messages.service';
@Controller('messages')
export class MessagesController {

    messageServices : MessagesService();
    @Get()
    listMessageS(){
        return this.messageServices.findAll()
    }

    @Post()
    createMessage(@Body() body : createMessageDTO){
        return this.messageServices.create(body.content);
    }

    @Get('/:id')
    getMessage(@Param('id') id : string){
        return this.messageServices.findOne(id);
    }

}
