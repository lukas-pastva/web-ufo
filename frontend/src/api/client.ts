import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface Generation {
  id: number;
  randomString: string;
  generatedAt: string;
  entropy: number;
  chiSquared: number;
  anomaly: boolean;
  createdAt: string;
}

export interface GenerationHistory {
  items: Generation[];
  total: number;
}

export interface Stats {
  totalGenerations: number;
  totalAnomalies: number;
  anomalyRate: number;
  avgEntropy: number | null;
  avgChiSquared: number | null;
  minEntropy: number | null;
  maxEntropy: number | null;
  minChiSquared: number | null;
  maxChiSquared: number | null;
}

export const fetchCurrent = () => api.get<Generation>('/generations/current').then((r) => r.data);

export const fetchHistory = (limit = 100, offset = 0, anomalyOnly = false) =>
  api.get<GenerationHistory>('/generations/history', { params: { limit, offset, anomalyOnly } }).then((r) => r.data);

export interface ChartDaily {
  date: string;
  total: number;
  anomalies: number;
  avgChiSquared: number;
  avgEntropy: number;
}

export interface ChartAnomaly {
  generatedAt: string;
  chiSquared: number;
  entropy: number;
}

export interface ChartData {
  daily: ChartDaily[];
  anomalies: ChartAnomaly[];
}

export const fetchStats = () => api.get<Stats>('/generations/stats').then((r) => r.data);

export const fetchChartData = () => api.get<ChartData>('/generations/chart').then((r) => r.data);
