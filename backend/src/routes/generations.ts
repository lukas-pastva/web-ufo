import { Router } from 'express';
import { getLatestGeneration, getGenerations, getStats, getChartData } from '../services/generator';

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
    const anomalyOnly = req.query.anomalyOnly === 'true';
    const result = await getGenerations(limit, offset, anomalyOnly);
    res.json(result);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/chart', async (_req, res) => {
  try {
    const data = await getChartData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
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
