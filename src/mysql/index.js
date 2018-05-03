import getConnection from './get-mysql-connection'
import * as sql from './sql-query-str'

const moment = require('moment')

const formatDate = str => moment(str).format('YYYY-MM-DD HH:mm:ss')
const createDate = () => moment().format('YYYY-MM-DD HH:mm:ss')
const prepareLimit = limit => (limit > 0 ? ` Limit ${limit}` : '')
const prepareOrder = order => (order ? ` Order by ${order}` : '')
const formatBool = bool => (bool ? '1' : '0')

const quoteIfStrOrDate = str =>
  (typeof (str) === 'boolean' ? formatBool(str) : typeof (str) === 'object' ? formatDate(str) : str)

const whereStr = where => (where.indexOf('where') > -1 ? where : ` WHERE ${where}`)

const whereObj = where => Object.keys(where).map(key => `${key} = ? `).join(' AND ')

const whereValues = where => (!where || typeof (where) === 'string' ? [] : Object.keys(where).map(key => quoteIfStrOrDate(where[key])))

const ensureWhere = where => (where.trim().length > 0 ? where.trim().toLowerCase().indexOf('where') > -1 ? where : ` WHERE ${where}` : '')
const prepareWhere = (where) => {
  if (where) {
    return ensureWhere(typeof (where) === 'string' ? whereStr(where) : ` WHERE ${whereObj(where)}`)
  }
  return ensureWhere()
}

const sqlFields = obj => Object.keys(obj).join()
const sqlValues = obj => Object.values(obj).map(quoteIfStrOrDate)
const sqlValuesPrepared = obj => Object.values(obj).map(_ => '?').join()

const objectToCreateQuery = (table, obj) => sql.insert(table, sqlFields(obj), sqlValuesPrepared(obj))

const printQuery = (query, vals) => {
  return  query
}

const runQuery = (query, values) => conn => conn.execute(printQuery(query, values), values)
  .then((r) => {
    return r
  })

const queryCreate = (table, obj) => conn =>
  runQuery(objectToCreateQuery(table, obj), sqlValues(obj))(conn)

const takeFirst = queryResult =>
  (queryResult[0].length > 0 ? queryResult[0][0] : null)

const prepareUpdate = updates => Object.keys(updates).map(key => `${key} = ? `).join(' , ')

const prepareUpdateValues = updates => Object.keys(updates).map(key => quoteIfStrOrDate(updates[key]))


const removeEmpty = where =>
  Object.keys(where).reduce((res, cur) => {
    if (where[cur]) { res[cur] = where[cur] }
    return res
  }, {})

const defaultFunc = config => ({
  insert: (table, obj) => create(table, obj),
  create: (table, obj) => getConnection(config)
    .then(queryCreate(table, obj))
    .then(r => r[0].insertId),
  find: (table, where) => getConnection(config)
    .then(runQuery(
      sql.select(table, prepareWhere(removeEmpty(where) || {})),
      whereValues(removeEmpty(where) || {})
    ))
    .then(takeFirst),
  update: (table, updates, where) => {
    return getConnection(config)
      .then(runQuery(
        sql.update(table, prepareUpdate(updates), prepareWhere(where)),
        prepareUpdateValues(updates).concat(whereValues(where))
      ))
      .then(r => r[0])
  },
  _delete: (table, where) => getConnection(config)
    .then(runQuery(sql._delete(table, prepareWhere(where)), whereValues(where))),
  selectCols: (table, fields, where, orderBy, limit = 0) => getConnection(config)
    .then(runQuery(sql.selectFields(fields, table, prepareWhere(where) + prepareOrder(orderBy) + prepareLimit(limit)), whereValues(where)))
    .then(r => r[0]),
  selectFields: (table, fields, where, orderBy, limit = 0) => getConnection(config)
    .then(runQuery(sql.selectFields(fields, table, prepareWhere(where) + prepareOrder(orderBy) + prepareLimit(limit)), whereValues(where)))
    .then(r => r[0]),
  select: (table, where, orderBy, limit = 0) => getConnection(config)
    .then(runQuery(sql.select(table, prepareWhere(where) + prepareOrder(orderBy) + prepareLimit(limit)), whereValues(where)))
    .then(r => r[0]),
  raw: (sqlQuery, values) => getConnection(config)
    .then(runQuery(sqlQuery, values))
    .then(r => r[0]),
  truncate: table => getConnection(config)
    .then(runQuery(`TRUNCATE TABLE ${table}`))
    .then(r => r[0]),
})

const store = config => Object.assign( {} , defaultFunc(config),({
  table: table => ({
    delete: where => defaultFunc(config)._delete(table, where),
    find: where => defaultFunc(config).find(table, where),
    select: (where, order = '', limit = 0) => defaultFunc(config).select(table, where, order, limit),
    selectFields: (fields, where, order = '', limit = 0) => defaultFunc(config).selectFields(table, fields, where, order, limit),
    selectCols: (fields, where, order = '', limit = 0) => defaultFunc(config).selectFields(table, fields, where, order, limit),
    update: (updates, where) => defaultFunc(config).update(table, updates, where),
    create: obj => defaultFunc(config).create(table, obj),
    truncate: _ => defaultFunc(config).truncate(table)
  }),
  now: () => createDate(),
  filterObject: (obj, allowedKeys) => {
    const newObj = {}
    Object.keys(obj).forEach((key) => {
      if (allowedKeys.indexOf(key) > -1) {
        newObj[key] = obj[key]
      }
    })
    return newObj
  }
}))

export default store
