import type { ErrorRequestHandler } from 'express'

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next
  const statusCode = error instanceof AppError ? error.statusCode : 500
  const message = statusCode >= 500 ? 'Internal server error' : String(error?.message || 'Request failed')

  if (statusCode >= 500) {
    console.error('Unhandled server error:', error)
  }

  res.status(statusCode).json({
    error: {
      message,
    },
  })
}
