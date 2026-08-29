import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';

/**
 * Boots the real AppModule (real Postgres via env vars, migrations must
 * already be applied) with the same global pipes/prefix as main.ts, for
 * e2e tests that exercise the HTTP layer end-to-end. The global exception
 * filter is registered by AppModule itself (via APP_FILTER in CommonModule).
 */
export async function bootstrapTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}
