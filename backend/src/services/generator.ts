import crypto from 'crypto';
import { AppDataSource } from '../config/database';
import { Generation } from '../models/Generation';

const HEX_CHARS = '0123456789abcdef';

function calculateEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const ch in freq) {
    const p = freq[ch] / len;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

function calculateChiSquared(str: string): number {
  const freq: Record<string, number> = {};
  for (const ch of HEX_CHARS) {
    freq[ch] = 0;
  }
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  const expected = str.length / HEX_CHARS.length;
  let chiSq = 0;
  for (const ch of HEX_CHARS) {
    const diff = freq[ch] - expected;
    chiSq += (diff * diff) / expected;
  }
  return chiSq;
}

export async function generateRandomString(): Promise<Generation> {
  const now = new Date();
  now.setSeconds(0, 0);

  const bytes = crypto.randomBytes(16);
  const randomString = bytes.toString('hex');

  const entropy = calculateEntropy(randomString);
  const chiSquared = calculateChiSquared(randomString);

  // Chi-squared critical value for 15 degrees of freedom at p=0.05 is 24.996
  // and at p=0.01 is 30.578. Flag as anomaly if significantly outside normal range.
  const anomaly = chiSquared > 30 || chiSquared < 5;

  const repo = AppDataSource.getRepository(Generation);
  const generation = repo.create({
    randomString,
    generatedAt: now,
    entropy,
    chiSquared,
    anomaly,
  });

  await repo.save(generation);
  console.log(
    `[${now.toISOString()}] Generated: ${randomString} | Entropy: ${entropy.toFixed(3)} | Chi²: ${chiSquared.toFixed(3)} | Anomaly: ${anomaly}`
  );

  return generation;
}

export async function getLatestGeneration(): Promise<Generation | null> {
  const repo = AppDataSource.getRepository(Generation);
  return repo.findOne({ order: { generatedAt: 'DESC' } });
}

export async function getGenerations(limit: number = 100, offset: number = 0) {
  const repo = AppDataSource.getRepository(Generation);
  const [items, total] = await repo.findAndCount({
    order: { generatedAt: 'DESC' },
    take: limit,
    skip: offset,
  });
  return { items, total };
}

export async function getStats() {
  const repo = AppDataSource.getRepository(Generation);
  const total = await repo.count();
  const anomalies = await repo.count({ where: { anomaly: true } });
  const result = await repo
    .createQueryBuilder('g')
    .select('AVG(g.entropy)', 'avgEntropy')
    .addSelect('AVG(g.chiSquared)', 'avgChiSquared')
    .addSelect('MIN(g.entropy)', 'minEntropy')
    .addSelect('MAX(g.entropy)', 'maxEntropy')
    .addSelect('MIN(g.chiSquared)', 'minChiSquared')
    .addSelect('MAX(g.chiSquared)', 'maxChiSquared')
    .getRawOne();

  return {
    totalGenerations: total,
    totalAnomalies: anomalies,
    anomalyRate: total > 0 ? (anomalies / total) * 100 : 0,
    avgEntropy: result?.avgEntropy ? parseFloat(result.avgEntropy) : null,
    avgChiSquared: result?.avgChiSquared ? parseFloat(result.avgChiSquared) : null,
    minEntropy: result?.minEntropy ? parseFloat(result.minEntropy) : null,
    maxEntropy: result?.maxEntropy ? parseFloat(result.maxEntropy) : null,
    minChiSquared: result?.minChiSquared ? parseFloat(result.minChiSquared) : null,
    maxChiSquared: result?.maxChiSquared ? parseFloat(result.maxChiSquared) : null,
  };
}
