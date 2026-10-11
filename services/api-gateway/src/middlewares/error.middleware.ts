import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found.' },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Each image must be 10 MB or smaller.'
      : 'Upload exactly one image using the image form field.';
    response.status(400).json({ error: { code: 'UPLOAD_VALIDATION_ERROR', message } });
    return;
  }

  console.error('Unexpected gateway error:', error);

  response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
};
