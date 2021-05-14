import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  count:number = 0;
  getHello(): string {
    this.count++;
    return 'Hello World!2222'+this.count;
  }
}
