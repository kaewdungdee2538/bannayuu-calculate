import { Body, Controller, Get, Post } from '@nestjs/common';
import { SplitDateService } from './split-date.service';

@Controller('api/bannayuu/calculate')
export class SplitDateController {
    constructor (private readonly splitDateService:SplitDateService){}
    
    @Post('')
    async splitDate(@Body() body){
        return this.splitDateService.splitDate(body.start_date,body.end_date);
    }

    @Get()
    get(){
        return 'awd;law;dlaw;dl;awd'
    }
}
