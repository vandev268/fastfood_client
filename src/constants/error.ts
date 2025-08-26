import type { HttpStatus } from './http'

type EntityErrorPayload = {
  message: string
  errors: {
    field: string
    message: string
  }[]
}

export class HttpError extends Error {
  status: number
  payload: {
    message: string
    [key: string]: any
  }
  constructor({ status, payload, message = 'Http Error' }: { status: number; payload: any; message?: string }) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export class EntityError extends HttpError {
  status: typeof HttpStatus.Entity
  payload: EntityErrorPayload
  constructor({ status, payload }: { status: typeof HttpStatus.Entity; payload: EntityErrorPayload }) {
    super({ status, payload, message: 'Entity Error' })
    this.status = status
    this.payload = payload
  }
}
