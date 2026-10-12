import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.ts';
import { initDatabase } from './db/database.ts';
import { seedDatabase } from './db/seed.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure database and initial demo seed
initDatabase();
seedDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure uploads folder exists
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Mount REST API
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'Education Sansar CRM Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Production: serve built frontend static files
const clientDist = path.resolve(__dirname, '../dist');
app.use(express.static(clientDist));
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('Frontend not built. Run npm run build:client');
});

// User-friendly error handler (Avoid technical stack traces in UI)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'An unexpected error occurred. Please try again.',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// Periodic Background Google Sheets sync (Every 15 minutes)
setInterval(async () => {
  try {
    const { syncAllActiveGoogleSheets } = await import('./services/integrationService.ts');
    await syncAllActiveGoogleSheets('System Background Sync');
  } catch (err: any) {
    console.log('Background sync check completed with note:', err.message);
  }
}, 15 * 60 * 1000);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Education Sansar CRM Server is LIVE on port ${PORT}:`);
  console.log(`   ➜ Local:   http://localhost:${PORT} / http://127.0.0.1:${PORT}`);
  console.log(`📍 Office: Sector 94, Noida, Uttar Pradesh 201313`);
});
