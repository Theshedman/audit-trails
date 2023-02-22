import type { NextFunction, Request, Response } from 'express';

export interface Options {
  connection: DbConnection
}

export interface DbConnection {
  host: string
  user: string
  password: string
  database: string
  table_name?: string
  schema_name?: string
  ssl?: boolean | DbSSL
  port?: number | string
}

export interface DbSSL {
  rejectUnauthorized: boolean
}

export interface Pool {
  min: number
  max: number
}

export interface ConfigObject {
  searchPath: string
  client: string
  connection: DbConnection
  pool: Pool
  debug?: boolean
}

export interface AuditTrailProps {
  id?: string
  performed_by: string
  performed_for?: string
  role?: string
  endpoint: string
  action?: string
  action_type: string
  status: string
  status_code: string
  resource_id?: string
  resource?: string
  request_data?: any
  response_msg?: string
  created_at?: Date
  updated_at?: Date
}

export type PathParams = string | RegExp | Array<string | RegExp>;
export type MiddlewarePathParams = (req: Request, res: Response, next: NextFunction) => void

export type AuditHeader = Pick<AuditTrailProps, 'action' | 'status' | 'resource_id' | 'resource' | 'performed_for'>

export type AuditEventName = Readonly<'save' | 'intercept' | 'save-success' | 'end' | 'error'>

export type EventRecord<T extends AuditEventName = AuditEventName> = Readonly<Record<Uppercase<T>, T>>

export interface AuditQueryFilter {
  status?: string
  role?: string
  resource?: string
  date_range?: DateFilter
}

interface DateFilter {
  start_date: string
  end_date: string
}

export interface Pagination {
  page: number
  size: number
}
