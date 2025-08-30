import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      code: 'NOT_FOUND'
    }
  });
};