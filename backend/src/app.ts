import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { AppConfig } from './common/config.js';
import { PlatformStore } from './db/store.js';
import { createAuthRouter } from './modules/authRouter.js';
import { createMarketplaceRouter } from './modules/marketplaceRouter.js';
import { createPaymentsAdminRouter } from './modules/paymentsAdminRouter.js';
import { createProjectsRouter } from './modules/projectsRouter.js';
import { createServicesRouter } from './modules/servicesRouter.js';
import { buildOpenApiSpec } from './openapi.js';

export function createApp(store: PlatformStore, config: AppConfig) {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'haus-co-modular-monolith',
      demoMode: config.demoMode,
      otpProvider: config.otpProvider,
      payhereMode: config.payhereMode,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/openapi.json', (_req, res) => {
    res.json(buildOpenApiSpec());
  });

  app.use('/api/v1/auth', createAuthRouter(store, config));
  app.use('/api/v1', createProjectsRouter(store, config));
  app.use('/api/v1', createServicesRouter(store, config));
  app.use('/api/v1', createMarketplaceRouter(store, config));
  app.use('/api/v1', createPaymentsAdminRouter(store, config));

  app.use((_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  return app;
}
