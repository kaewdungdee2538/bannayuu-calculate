import { Body, Controller, Post } from '@nestjs/common';
import { CalculateService } from './calculate.service';

@Controller('api/bannayuu/calculate')
export class CalculateController {
    constructor(private readonly calculateService:CalculateService){}
    @Post('cal-all')
    async calculateParking(@Body() body){
        return await this.calculateService.calculateParking(body);
    }
}
