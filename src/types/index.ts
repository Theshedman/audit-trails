import type { NextFunction, Request, Response } from 'express';

export type Options = {
  connection: DbConnection
}

export type DbConnection = {
  host: string
  user: string
  password: string
  database: string
  table_name?: string
  schema_name?: string
  ssl?: boolean | DbSSL
  port?: number | string
}

export type DbSSL = {
  rejectUnauthorized: boolean
}

export type Pool = {
  min: number
  max: number
}

export type ConfigObject = {
  searchPath: string
  client: string
  connection: DbConnection
  pool: Pool
  debug?: boolean
  seeds?: FileMetaData
  migrations?: FileMetaData
}

type FileMetaData = {
  directory: string
  tableName?: string
  extension: FileExtension
}

type FileExtension = 'ts' | '.ts' | 'js' | '.js';

export type AuditTrailProps = {
  id?: string
  role?: string
  status: string
  action?: string
  endpoint: string
  created_at?: Date
  updated_at?: Date
  resource?: string
  request_data?: any
  description: string
  status_code: string
  resource_id?: string
  performed_by: string
  response_msg?: string
  performed_for?: string
}

export type PathParams = string | RegExp | Array<string | RegExp>;

export type MiddlewarePathParams = (req: Request, res: Response, next: NextFunction) => void

export type AuditHeader = Pick<AuditTrailProps, 'description' | 'status' | 'resource_id' | 'resource' | 'performed_for'>

export type AuditEventName = Readonly<'save' | 'intercept' | 'save-success' | 'end' | 'error'>

export type EventRecord<T extends AuditEventName = AuditEventName> = Readonly<Record<Uppercase<T>, T>>

export type AuditQueryFilter = {
  status?: string
  role?: string
  resource?: string
  date_range?: DateFilter
}

type DateFilter = {
  start_date: string
  end_date: string
}

export type Pagination = {
  page: number
  size: number
}
