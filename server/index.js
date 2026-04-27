import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { seedSuperAdmin } from './seed.js';
import authRoutes from './routes/auth.js';
import chapterRoutes from './routes/chapters.js';
import userRoutes from './routes/users.js';
import powerTeamRoutes from './routes/powerTeams.js';
import meetingRoutes from './routes/meetings.js';
import dashboardRoutes from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const app = express();
const PORT = parseInt(process.env.PORT || (isProd ? '5000' : process.env.BACKEND_PORT || '3001'), 10);
const HOST = isProd ? '0.0.0.0' : 'localhost';

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/power-teams', powerTeamRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/dashboard', dashboardRoutes);

if (isProd) {
  const distDir = path.resolve(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.warn('[server] dist directory not found; run `npm run build` first');
  }
}

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

(async () => {
  try {
    await connectDB();
    await seedSuperAdmin();
    app.listen(PORT, HOST, () => {
      console.log(`[server] listening on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('[server] failed to start', err);
    process.exit(1);
  }
})();
