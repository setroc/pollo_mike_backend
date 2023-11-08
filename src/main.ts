import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET, PUT, POST, DELETE, PATCH',
    allowedHeaders: 'Content-Type, Authorization',
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    exceptionFactory: (errors) => {
      const result = errors.map((error) => ({
        property: error.property,
        message: error.constraints[Object.keys(error.constraints)[0]],
      }));
      return new BadRequestException(result);
    },
    stopAtFirstError: true,
  }));
  await app.listen(3000);
}
bootstrap();
