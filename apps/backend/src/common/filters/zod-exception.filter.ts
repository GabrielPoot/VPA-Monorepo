import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorResponse } from '@vpa/shared';

@Catch(ZodValidationException)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = HttpStatus.UNPROCESSABLE_ENTITY;

    // We transform the nestjs-zod validation errors into a key-value format
    // for easy frontend consumption
    const zodError = exception.getZodError() as ZodError;
    const details = zodError.errors.reduce((acc: Record<string, string>, currentError) => {
      const path = currentError.path.join('.');
      acc[path] = currentError.message;
      return acc;
    }, {} as Record<string, string>);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: 'Validation failed',
      error: 'Unprocessable Entity',
      timestamp: new Date().toISOString(),
      path: request.url,
      details, // The key thing: mapped errors
    };

    response.status(status).send(errorResponse);
  }
}
