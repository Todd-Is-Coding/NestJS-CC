import { IsString } from "class-validator"

export class createMessageDTO{
@IsString()
content! : string;

}