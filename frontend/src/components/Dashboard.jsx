import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend
);

const API = 'http://127.0.0.1:5000';

function Dashboard({ refresh }) {
  const [urls, setUrls] = useState([]);
  const [selectedAlias, setSelectedAlias] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all URLs when component loads or refresh changes
  useEffect(() => {
    fetchUrls();
  }, [refresh]);

  const fetchUrls = async () => {
    try {
      const response = await axios.get(`${API}/urls`);
      setUrls(response.data);
    } catch (err) {
      console.error('Failed to fetch URLs');
    }
  };

  const fetchAnalytics = async (alias) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analytics/${alias}`);
      setAnalytics(response.data);
      setSelectedAlias(alias);
    } catch (err) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchUrls();
    if (selectedAlias) fetchAnalytics(selectedAlias);
  };

  // Build chart data
  const chartData = analytics ? {
    labels: analytics.clicks_last_7_days.map(d => d.day),
    datasets: [{
      label: 'Clicks',
      data: analytics.clicks_last_7_days.map(d => d.count),
      borderColor: '#4a90e2',
      backgroundColor: 'rgba(74,144,226,0.1)',
      tension: 0.3,
      fill: true,
    }]
  } : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Analytics Dashboard</h2>
        <button onClick={handleRefresh}>🔄 Refresh</button>
      </div>
      <br />

      {urls.length === 0 ? (
        <p>No URLs shortened yet.</p>
      ) : (
        <ul className="url-list">
          {urls.map(u => (
            <li
              key={u.alias}
              onClick={() => fetchAnalytics(u.alias)}
              className={selectedAlias === u.alias ? 'active' : ''}
            >
              <strong>{u.alias}</strong> → {u.original_url}
            </li>
          ))}
        </ul>
      )}

      {loading && <p>Loading chart...</p>}

      {chartData && !loading && (
        <div style={{ marginTop: '20px' }}>
          <h3>Clicks over last 7 days: {selectedAlias}</h3>
          <Line data={chartData} />
        </div>
      )}

      {selectedAlias && !loading && analytics?.clicks_last_7_days.length === 0 && (
        <p style={{ marginTop: '15px', color: '#888' }}>
          No clicks recorded yet for this URL.
        </p>
      )}
    </div>
  );
}

export default Dashboard;