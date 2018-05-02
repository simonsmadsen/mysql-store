import store from './mysql/index.js'
import migration from './migration/index.js'

const mysqlStore = config => ({
  migration: migration(config),
  mysql: store(config)
})

export default mysqlStore
