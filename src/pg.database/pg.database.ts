import { createConnection } from "typeorm";
import { configfile } from '../conf/config.json'
var connection;
export class dbConnection {
    async createPgConnect() {
        try {
            connection = await createConnection({
                type: 'postgres',
                host: configfile.host_name,
                port: 5432,
                username: 'postgres',
                password: 'db13apr',
                database: configfile.database_name
            });
            console.log('Create PG Connection Success.');
            return true;
        }
        catch (err) {
            console.log('Create PG Connection Error : ' + err);
            return false;
        }
    }

    async getPgData(querys: any) {
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let result = null;
        let error = null;
        try {
            // console.log('get'+JSON.stringify(querys));
            // console.log('getQueryPg');
            const response = await queryRunner.query(querys);
            await queryRunner.commitTransaction();
            result = await response;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.log('getQueryPg err: ' + err);
            error = err.message;
        } finally {
            await queryRunner.release();
            return { result, error };
        }
    }

    async savePgData(querys: any[]) {
        console.log('save : ' + querys.length);
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let result = null;
        let error = null;
        let values_response = [];
        try {
            let response;
            for (let num = 0; num < querys.length; num++) {
                response = await queryRunner.query(querys[num]);
                console.log(`pg save return ${JSON.stringify(response)}`);
            }
            await queryRunner.commitTransaction();
            result = true;
            values_response.push(response[0]);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.log('save err: ' + err);
            error = err.message;
        } finally {
            await queryRunner.release();
            return { result, values_response, error };
        }
    }
}

