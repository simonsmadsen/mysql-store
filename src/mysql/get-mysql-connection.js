import * as pool from './get-mysql-pool'

const connection = null
let mysqlPool = null

export default async function getConnection(config) {

  if (!mysqlPool) {
    mysqlPool = pool.connectionPool(config)
    mysqlPool.on('acquire', (connection) => {
      // console.log('Connection %d acquired', connection.threadId)
    })
    mysqlPool.on('connection', (connection) => {
      connection.query('SET SESSION auto_increment_increment=1')
    })
    mysqlPool.on('enqueue', () => {
      // console.log('Waiting for available connection slot')
    })
    mysqlPool.on('release', (connection) => {
      // console.log('Connection %d released', connection.threadId)
    })
  }

  return mysqlPool.getConnection()
}
