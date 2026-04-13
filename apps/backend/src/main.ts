import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // __dirname in compiled = dist/src → ../../uploads = apps/backend/uploads
  const uploadsPath = process.env.UPLOADS_PATH ?? join(__dirname, '..', '..', 'uploads');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4000',
      'https://homematchinmobiliaria.com',
      'https://www.homematchinmobiliaria.com',
      'https://crm.homematchinmobiliaria.com',
    ],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CRM Inmobiliario API')
    .setDescription('API del CRM especializado en ventas inmobiliarias')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend en http://localhost:${port}/api`);
  console.log(`📖 Swagger en http://localhost:${port}/api/docs`);
}

bootstrap();
