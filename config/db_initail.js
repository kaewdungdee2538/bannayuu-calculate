const { Pool } = require('pg')
const config = require("./config");


 const pool = new Pool({
   user: config.db_config.USER_DB,
   host: config.db_config.HOST_DB,
   database: config.db_config.DATABASE_DB,
   password:config.db_config.PASSWORD_DB,
   port: config.db_config.PORT_DB,
   max: config.db_config.max,
   idleTimeoutMillis: config.db_config.idleTimeoutMillis,
   connectionTimeoutMillis: config.db_config.connectionTimeoutMillis,
 })


 module.exports = pool;