import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface NormalizedError {
  status: number;
  code: string;
  message: string;
  errors?: string[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const normalized = this.normalizeException(exception);

    if (normalized.status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(normalized.status).json({
      statusCode: normalized.status,
      code: normalized.code,
      message: normalized.message,
      ...(normalized.errors ? { errors: normalized.errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private normalizeException(exception: unknown): NormalizedError {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.normalizePrismaError(exception);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          status,
          code: this.httpCode(status),
          message: response,
        };
      }

      const details = response as {
        message?: string | string[];
        error?: string;
      };
      const errors = Array.isArray(details.message)
        ? details.message
        : undefined;
      const message =
        typeof details.message === 'string'
          ? details.message
          : (details.error ?? exception.message);

      return {
        status,
        code: this.httpCode(status),
        message:
          errors?.length
            ? 'Los datos enviados no son válidos'
            : message,
        ...(errors ? { errors } : {}),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    };
  }

  private normalizePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): NormalizedError {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: 'RESOURCE_CONFLICT',
          message: 'Ya existe un registro con esos datos',
        };
      case 'P2003':
        return {
          status: HttpStatus.CONFLICT,
          code: 'RESOURCE_IN_USE',
          message: 'El registro está relacionado con otros datos',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'RESOURCE_NOT_FOUND',
          message: 'El registro solicitado no existe',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR',
          message: 'Error al procesar la operación en la base de datos',
        };
    }
  }

  private httpCode(status: number): string {
    const codes: Partial<Record<number, string>> = {
      [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
      [HttpStatus.CONFLICT]: 'RESOURCE_CONFLICT',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    };

    return codes[status] ?? `HTTP_${status}`;
  }
}
