import type { RequestHandler } from 'express'
import { AppError } from './errorHandler.js'

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError('Not found', 404))
}
