// production
// export const configfile = {
//     "port_api": 4060,
//     "host_name": "local.uat.bannayuu.com",
//     "database_port":5432,
//     "database_name": "cit_bannayuu_db",
//     "image_path":"C:\\Bannayuu\\Calculate\\Image\\files",
//     "URL_CALCULATE_LONGTIME":"http://localhost:4095/api/v1/bannayuu/calculate/master/cal"
// }

// demo
// export const configfile = {
//     "port_api": 36006,
//     "host_name": "192.168.81.135",
//     "database_port":50005,
//     "database_name": "demo_bannayuu_db",
//     "image_path":"/home/ubuntu/banayuu_images/visitor",
//     "URL_CALCULATE_LONGTIME":"http://localhost:36008/api/v1/bannayuu/calculate/master/cal"
// }

export const configfile = {
    app_port: process.env.APP_PORT,
    db_host: process.env.DB_HOST,
    db_port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    db_name: process.env.DB_NAME,
    db_username: process.env.DB_USERNAME,
    db_password: process.env.DB_PASSWORD,
    URL_CALCULATE_LONGTIME: process.env.URL_CALCULATE_LONGTIME || "http://localhost:36008/api/v1/bannayuu/calculate/master/cal"
}