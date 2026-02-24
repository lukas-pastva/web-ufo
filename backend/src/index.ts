import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import { AppDataSource } from './config/database';
import generationsRouter from './routes/generations';
import { generateRandomString } from './services/generator';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/generations', generationsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendPath));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Initialize
AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected');

    // Generate first string immediately on startup
    await generateRandomString();

    // Schedule generation at the start of every minute (:00 seconds)
    cron.schedule('0 * * * * *', async () => {
      try {
        await generateRandomString();
      } catch (error) {
        console.error('Error generating random string:', error);
      }
    });

    console.log('Random string generator scheduled - every minute at :00');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`UFO Signal server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });
