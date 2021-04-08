const config = {
    db_config: {

        // //UAT  OFFICE
        HOST_DB: "cit.bannayuu.com",
        PORT_DB: 5432,
        DATABASE_DB: "b_nayuu_db",
        USER_DB: "cit",
        PASSWORD_DB: "db13apr",
        max: 1,
        idleTimeoutMillis: 0,
        connectionTimeoutMillis: 2000,
    },port:{
        SERVER_PORT:"4060"
    }
}

module.exports = config;