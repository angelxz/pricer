import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Login from './Login';
import Materials from './Materials';
import Products from './Products';
import Expenses from './Expenses';
import './App.css';

// Header Component
const Header = ({ onLogout }) => (
  <nav className="navbar">
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '24px' }}>📄</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong>Bill of Materials</strong>
      </div>
    </div>
    <div className="nav-links">
      <Link to="/materials">Материали</Link>
      <Link to="/products">Изделия</Link>
      <Link to="/expenses">Разходи</Link>
      <Link to="/" onClick={onLogout}>Изход</Link>
      <span>🌐</span>
    </div>
  </nav>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  return (
    <Router>
      {isAuthenticated && <Header onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/materials" />} />
        <Route path="/materials" element={isAuthenticated ? <Materials /> : <Navigate to="/" />} />
        <Route path="/products" element={isAuthenticated ? <Products /> : <Navigate to="/" />} />
        <Route path="/expenses" element={isAuthenticated ? <Expenses /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;