/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { getActiveAnprProvider, getAnprProvidersSummary } from './server/anpr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_BASE64_CHARS = 7_500_000; // ~5.5MB decoded image guard

async function createServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(express.json({ limit: '8mb' }));

  // ------------------------------------------------------------------
  // 1. ANPR HEALTH & PROVIDER CONFIGURATION CHECK (NO KEYS EXPOSED)
  // ------------------------------------------------------------------
  app.get('/api/anpr/health', (_req: Request, res: Response) => {
    const summary = getAnprProvidersSummary();
    res.json({
      ok: true,
      service: 'happiiz-anpr-engine',
      timestamp: new Date().toISOString(),
      ...summary,
      minConfidenceDefault: Number(process.env.ANPR_MIN_CONFIDENCE || 72),
    });
  });

  // ------------------------------------------------------------------
  // 2. TRUSTED SERVER-SIDE AI VEHICLE PLATE RECOGNITION
  // ------------------------------------------------------------------
  app.post('/api/anpr/recognize', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType, minConfidence, preferredProvider } = req.body || {};

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({
          success: false,
          errorCode: 'MISSING_IMAGE',
          errorMessage: 'A base64-encoded vehicle photograph is required.',
        });
        return;
      }

      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      if (!cleanBase64 || cleanBase64.length < 100) {
        res.status(400).json({
          success: false,
          errorCode: 'INVALID_IMAGE_DATA',
          errorMessage: 'Captured image payload is empty or corrupted.',
        });
        return;
      }

      if (cleanBase64.length > MAX_BASE64_CHARS) {
        res.status(413).json({
          success: false,
          errorCode: 'IMAGE_TOO_LARGE',
          errorMessage: 'Compressed vehicle image exceeds 5MB limit. Please retake photo.',
        });
        return;
      }

      const normalizedMime = String(mimeType || 'image/jpeg').toLowerCase().trim();
      if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
        res.status(400).json({
          success: false,
          errorCode: 'UNSUPPORTED_MIME_TYPE',
          errorMessage: 'Only JPEG, PNG, and WEBP vehicle photographs are supported.',
        });
        return;
      }

      const provider = getActiveAnprProvider(
        typeof preferredProvider === 'string' ? preferredProvider : undefined
      );

      const result = await provider.recognizePlate({
        imageBase64: cleanBase64,
        mimeType: normalizedMime === 'image/jpg' ? 'image/jpeg' : normalizedMime,
        minConfidence: typeof minConfidence === 'number' ? minConfidence : undefined,
      });

      const statusCode = !result.success && result.errorCode === 'ANPR_PROVIDER_NOT_CONFIGURED' ? 503 : 200;
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('[ANPR Server] Unhandled error in /api/anpr/recognize:', err);
      res.status(500).json({
        success: false,
        errorCode: 'INTERNAL_ANPR_ERROR',
        errorMessage: err?.message || 'Unexpected server error while scanning vehicle plate.',
      });
    }
  });

  // ------------------------------------------------------------------
  // 3. FUTURE-READY AUTOMATIC BOOM BARRIER WEBHOOK (DISABLED BY DEFAULT)
  // ------------------------------------------------------------------
  app.post('/api/anpr/barrier/trigger', (req: Request, res: Response) => {
    const { societyId, gateId, registrationNumber, autoOpenBarrierEnabled, hardwareRelayEndpoint } =
      req.body || {};

    if (autoOpenBarrierEnabled !== true) {
      res.status(403).json({
        opened: false,
        code: 'BARRIER_AUTOMATION_DISABLED',
        message:
          'Automatic barrier opening is disabled by default policy. Physical guard confirmation is required.',
      });
      return;
    }

    if (!hardwareRelayEndpoint) {
      res.status(501).json({
        opened: false,
        code: 'BARRIER_HARDWARE_NOT_CONNECTED',
        message: `Barrier automation enabled for ${societyId || 'society'} / ${
          gateId || 'gate'
        }, awaiting local IP relay hardware endpoint for ${registrationNumber || 'vehicle'}.`,
      });
      return;
    }

    res.status(202).json({
      opened: false,
      code: 'BARRIER_DISPATCH_STAGED',
      message: 'Hardware relay adapter staged; deploy on-premise gate controller to actuate relay.',
    });
  });

  // ------------------------------------------------------------------
  // 4. VITE DEV MIDDLEWARE OR PRODUCTION STATIC BUNDLE
  // ------------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get(/^(?!\/api\/).*/, (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Happiiz Gate Server] Running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('[Happiiz Gate Server] Failed to boot:', err);
  process.exit(1);
});
