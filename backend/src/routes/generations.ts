import { Router } from 'express';
import { getLatestGeneration, getGenerations, getStats } from '../services/generator';

const router = Router();

router.get('/current', async (_req, res) => {
  try {
    const generation = await getLatestGeneration();
    res.json(generation);
  } catch (error) {
    console.error('Error fetching current generation:', error);
    res.status(500).json({ error: 'Failed to fetch current generation' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await getGenerations(limit, offset);
    res.json(result);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
