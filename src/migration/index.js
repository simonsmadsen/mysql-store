import mysql from './../mysql'
import * as sql from './sql-query'
import {createTableQuery} from './create-table-query'
import {createFieldsQuery} from './create-fields-query'
import {createFieldUpdateQuery} from './create-field-update-query'
import {createFieldDeleteQuery} from './create-field-delete-query'

const rawQuertIfNotEmpty = config => (query ) => query.trim().length > 0 ?  mysql(config).raww(query) : 'empty query!'
const createTable = (table,fields, config) => mysql(config).raww(createTableQuery(table, fields))
const arrNotEmpty = arr => arr.length > 0
const tableExists = (table, config) => mysql(config).raww(sql.tableExists(table)).then(arrNotEmpty)
const mapDatabaseFields = databaseFields => databaseFields.map(field => field.Field)
const findNewFields = fields => databaseFields => Object.keys(fields).filter(f => databaseFields.indexOf(f) === -1)
const createNewFields = (table,fields,config) => newFields =>
  createFieldsQuery(table,fields,newFields).split(';').forEach(rawQuertIfNotEmpty(config))

const handleNewFields = (table,fields, config) => mysql(config).raww(sql.tableFields(table))
  .then(mapDatabaseFields)
  .then(findNewFields(fields))
  .then(createNewFields(table,fields, config))

const fieldUpdateQuery = (table,fields) => databaseFields => createFieldUpdateQuery(table,fields,databaseFields)

const runQueries = config => queries => queries.split(';').forEach(rawQuertIfNotEmpty(config))

const handleChangedFields = (table,fields, config) => oldResult => mysql(config).raww(sql.tableFields(table))
  .then(fieldUpdateQuery(table,fields))
  .then(runQueries(config))

const fieldDeleteQuery = (table,fields) => databaseFields => createFieldDeleteQuery(table,fields,databaseFields)
const handleRemovedFields = (table,fields, config) => old => mysql(config).raww(sql.tableFields(table))
  .then(fieldDeleteQuery(table,fields))
  .then(runQueries(config))

const validateFields = (table,fields, config) =>
   handleNewFields(table,fields, config)
  .then(handleChangedFields(table,fields, config))
  .then(handleRemovedFields(table,fields, config))

const createOrUpdate = (table,fields, config) => exists =>
  ! exists ? createTable(table,fields, config) : validateFields(table,fields, config)

const table = config => (table, fields) => {
  return tableExists(table,config)
  .then(createOrUpdate(table,fields,config))
}
export default table
