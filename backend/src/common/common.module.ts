import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorLog } from './entities/error-log.entity.js';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';

@Module({
  imports: [TypeOrmModule.forFeature([ErrorLog])],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class CommonModule {}
