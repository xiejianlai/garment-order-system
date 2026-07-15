import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 全局前缀 — 所有接口统一加 /api
  app.setGlobalPrefix('api');

  // CORS — 允许 H5 跨域访问
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Serve static frontend (prototype HTML) — must be set AFTER NestJS init
  // Using Express middleware directly to bypass global prefix
  // Use process.cwd() for reliable path in both dev and prod mode
  const frontendPath = join(process.cwd(), '..', 'prototype');
  Logger.log(`Frontend path: ${frontendPath}`, 'Bootstrap');
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use('/', express.static(frontendPath));
  // Fallback: serve index.html for any non-API route
  expressApp.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(frontendPath, 'index.html'));
  });

  // 全局管道 — 参数校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 全局过滤器 — 统一异常格式
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局拦截器 — 统一响应格式
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger 接口文档
  const config = new DocumentBuilder()
    .setTitle('外贸服装订单管理系统 API v2')
    .setDescription('Garment Order Management System - Multi-Company + Coordinator/Merchandiser')
    .setVersion('2.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Server running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
  Logger.log(`Frontend: http://localhost:${port}/index.html`, 'Bootstrap');
}
bootstrap();
