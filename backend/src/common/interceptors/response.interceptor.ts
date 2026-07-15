import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 统一响应格式拦截器
 * 所有成功响应统一包装为: { code: 'SUCCESS', message: 'ok', data: ... }
 * 前端（小程序 + H5）统一按此格式解析
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        code: 'SUCCESS',
        message: 'ok',
        data: data ?? null,
      })),
    );
  }
}
