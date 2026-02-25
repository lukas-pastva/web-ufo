import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchCurrent, fetchHistory, fetchStats } from './api/client';
import type { Generation, Stats } from './api/client';
import './styles/App.css';

type SortField = 'generatedAt' | 'entropy' | 'chiSquared' | 'anomaly';
type SortDir = 'asc' | 'desc';

function App() {
  const [current, setCurrent] = useState<Generation | null>(null);
  const [history, setHistory] = useState<Generation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(true);
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('generatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const loadData = useCallback(async () => {
    try {
      const [currResult, histResult, stResult] = await Promise.allSettled([
        fetchCurrent(),
        fetchHistory(50, 0, anomalyOnly),
        fetchStats(),
      ]);
      if (currResult.status === 'fulfilled') setCurrent(currResult.value);
      if (histResult.status === 'fulfilled') setHistory(histResult.value.items);
      if (stResult.status === 'fulfilled') setStats(stResult.value);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [anomalyOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Countdown timer - counts down to the next :00 second mark
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const secondsRemaining = 60 - now.getSeconds();
      setCountdown(secondsRemaining === 60 ? 0 : secondsRemaining);

      // Reload data right after a new generation (at :01 to give server time)
      if (now.getSeconds() === 1) {
        loadData();
      }
    }, 200);
    return () => clearInterval(timer);
  }, [loadData]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB') + ' ' + formatTime(iso);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'generatedAt' ? 'desc' : 'desc');
    }
  };

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  const filteredHistory = useMemo(() => {
    let data = [...history];
    data.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'generatedAt':
          cmp = new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
          break;
        case 'entropy':
          cmp = (a.entropy ?? 0) - (b.entropy ?? 0);
          break;
        case 'chiSquared':
          cmp = (a.chiSquared ?? 0) - (b.chiSquared ?? 0);
          break;
        case 'anomaly':
          cmp = Number(a.anomaly) - Number(b.anomaly);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [history, sortField, sortDir]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Establishing connection...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">UFO Signal</h1>
        <p className="subtitle">Cryptographic Random Number Generator &mdash; Influence Detection System</p>
      </header>

      <section className="signal-section">
        <div className="countdown-container">
          <div className="countdown-label">Next generation in</div>
          <div className={`countdown ${countdown <= 5 ? 'countdown-urgent' : ''}`}>
            {countdown}
            <span className="countdown-unit">s</span>
          </div>
          <div className="countdown-bar">
            <div className="countdown-fill" style={{ width: `${((60 - countdown) / 60) * 100}%` }} />
          </div>
        </div>

        <div className="current-string-container">
          <div className="current-label">Current Signal</div>
          <div className="current-string">{current?.randomString || '................................'}</div>
          <div className="current-meta">
            {current && (
              <>
                <span>Generated: {formatTime(current.generatedAt)}</span>
                <span className="separator">|</span>
                <span>Entropy: {current.entropy?.toFixed(3)}</span>
                <span className="separator">|</span>
                <span>
                  Chi²: {current.chiSquared?.toFixed(3)}
                  {current.anomaly && <span className="anomaly-badge">ANOMALY</span>}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="message-section">
        <div className="message-box">
          <h2>Protocol</h2>
          <p>
            Every <strong>60 seconds</strong>, at precisely <strong>:00</strong> of each minute, this system generates a{' '}
            <strong>32-character hexadecimal string</strong> using Node.js <code>crypto.randomBytes(16)</code> &mdash; a
            cryptographically secure pseudorandom number generator seeded by operating system entropy.
          </p>
          <p>
            If you can influence random number generators, <strong>you know exactly when to act</strong>. The
            generation happens at second zero of every minute, synchronized to UTC. We analyze each string for
            statistical anomalies using Shannon entropy and chi-squared tests.
          </p>
          <p>
            A truly random 32-hex-char string has expected entropy of ~4.0 bits/char and chi-squared near 15 (with 15
            degrees of freedom). Significant deviations may indicate <strong>non-random influence</strong>.
          </p>
        </div>
      </section>

      {stats && (
        <section className="stats-section">
          <h2>Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalGenerations}</div>
              <div className="stat-label">Total Generations</div>
            </div>
            <div className="stat-card anomaly-card">
              <div className="stat-value">{stats.totalAnomalies}</div>
              <div className="stat-label">Anomalies Detected</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.anomalyRate.toFixed(1)}%</div>
              <div className="stat-label">Anomaly Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.avgEntropy?.toFixed(3) ?? '—'}</div>
              <div className="stat-label">Avg Entropy</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.avgChiSquared?.toFixed(3) ?? '—'}</div>
              <div className="stat-label">Avg Chi²</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {stats.minEntropy?.toFixed(2) ?? '—'} – {stats.maxEntropy?.toFixed(2) ?? '—'}
              </div>
              <div className="stat-label">Entropy Range</div>
            </div>
          </div>
        </section>
      )}

      <section className="history-section">
        <div className="history-header">
          <h2>Signal History</h2>
          <div className="history-controls">
            <label className="anomaly-toggle">
              <input
                type="checkbox"
                checked={anomalyOnly}
                onChange={(e) => setAnomalyOnly(e.target.checked)}
              />
              <span className="toggle-switch" />
              <span className="toggle-label">Anomalies only</span>
            </label>
          </div>
        </div>
        {history.length === 0 ? (
          <div className="history-table-wrap">
            <div className="history-empty">No signals generated yet. The first signal will appear within 60 seconds.</div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="history-table-wrap">
            <div className="history-empty">No anomalies detected in the current dataset.</div>
          </div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th className="sortable-th" onClick={() => handleSort('generatedAt')}>
                    Time{sortIndicator('generatedAt')}
                  </th>
                  <th>Random String</th>
                  <th className="sortable-th" onClick={() => handleSort('entropy')}>
                    Entropy{sortIndicator('entropy')}
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('chiSquared')}>
                    Chi²{sortIndicator('chiSquared')}
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('anomaly')}>
                    Status{sortIndicator('anomaly')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((gen) => (
                  <tr key={gen.id} className={gen.anomaly ? 'anomaly-row' : ''}>
                    <td className="time-col">{formatDate(gen.generatedAt)}</td>
                    <td className="string-col">{gen.randomString}</td>
                    <td>{gen.entropy?.toFixed(3)}</td>
                    <td>{gen.chiSquared?.toFixed(3)}</td>
                    <td>{gen.anomaly ? <span className="anomaly-badge">ANOMALY</span> : <span className="normal-badge">Normal</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="footer">
        <p>
          Generating cryptographically secure random strings every minute. Algorithm:{' '}
          <code>crypto.randomBytes(16).toString('hex')</code>
        </p>
      </footer>
    </div>
  );
}

export default App;
