import * as pool from './get-mysql-pool'

export default function getConnection(config){
  return pool.connectionPool(config).getConnection()
}
