import React, { useState } from 'react';
import UrlShortener from './components/UrlShortener';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [refreshDashboard, setRefreshDashboard] = useState(false);

  const handleNewUrl = () => {
    setRefreshDashboard(prev => !prev);
  };

  return (
    <div className="app">
      <h1>URL Shortener</h1>
      <UrlShortener onNewUrl={handleNewUrl} />
      <hr />
      <Dashboard refresh={refreshDashboard} />
    </div>
  );
}

export default App;