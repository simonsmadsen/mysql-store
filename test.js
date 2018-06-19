import store from './src/mysql/index'
import migration from './src/migration/index.js'

const config = {
  mac: false,
  debug: true,
  password: 'Klydevej12',
  database: 'fix_sql'
}

const mysql = store(config)
const arr = []
for (let index = 0; index < 5000000; index++) {
  arr.push(index)
}

Promise.all(
  arr.map(x => mysql.raw('select * from user'))).then((x) => {
  console.log(x.length)
  console.log(x[0], 'first')
  console.log(x[x.length - 1], 'last')
})

