import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:5000';

function UrlShortener({ onNewUrl }) {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleShorten = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API}/shorten`, { url });
      setResult(response.data);
      setUrl('');
      onNewUrl(); // tell dashboard to refresh
    } catch (err) {
      if (err.response?.status === 429) {
        const seconds = err.response.data.retry_after_seconds;
        setCountdown(seconds);
        setError(`Rate limit exceeded. Please wait:`);
      } else if (err.response?.status === 400) {
        setError(err.response.data.error);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Shorten a URL</h2>
      <br />
      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleShorten()}
        disabled={countdown > 0}
      />
      <button
        onClick={handleShorten}
        disabled={loading || countdown > 0}
      >
        {loading ? 'Shortening...' : 'Shorten'}
      </button>

      {error && (
        <div className="error">
          {error}
          {countdown > 0 && (
            <span className="countdown"> {countdown}s</span>
          )}
        </div>
      )}

      {result && (
        <div className="result">
          ✅ Short URL:{' '}
          <a href={result.short_url} target="_blank" rel="noreferrer">
            {result.short_url}
          </a>
        </div>
      )}
    </div>
  );
}

export default UrlShortener;