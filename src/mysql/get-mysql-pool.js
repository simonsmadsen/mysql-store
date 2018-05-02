const mysql = require('mysql2/promise')

const makeConfig = (config) => {
  const dbConfig = {
    host: config.host || 'localhost',
    user: config.user || 'root',
    password: config.password || '',
    database: config.database || '',
    port: config.port ? config.port : 3306,
  }
  if (config.mac) {
    dbConfig.socketPath = '/tmp/mysql.sock'
  }
  console.log(dbConfig)
  return dbConfig
}

//if (config.mac === 'true') {
//  dbConfig.socketPath = '/tmp/mysql.sock'
//}

export const connectionPool = config => mysql.createPool(makeConfig(config))
