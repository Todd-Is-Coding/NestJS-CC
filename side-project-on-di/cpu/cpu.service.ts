import { Injectable } from '@nestjs/common';
import { PowerService } from '../power/power.service';
@Injectable()
export class CpuService {
    constructor(private powerService : PowerService){}


    compute(a : number , b : number){
        console.log(`Drawing 10 watts if power from Power Service`);
        return a + b ;
    }
}
