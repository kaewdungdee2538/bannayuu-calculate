import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import {configfile} from './conf/config.json';
import { dbConnection } from './pg.database/pg.database';
const connect = new dbConnection;
console.log(JSON.stringify(configfile))
const port = configfile.port_api || 9046;
async function bootstrap() {
  const app = await NestFactory.create(AppModule,{ bodyParser:true, cors: true });
  
  app.use(bodyParser.urlencoded({extended:true}))
  app.use(bodyParser.json());
  app.use(bodyParser.raw());

  await app.listen(port);
  console.log(`API Bannayuu Calculate running on port : ${port}`)
  await connect.createPgConnect();
}
bootstrap();
