import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { IoMdPaper } from 'react-icons/io';
import Login from './Login';
import Materials from './Materials';
import Products from './Products';
import Expenses from './Expenses';
import './App.css';

// Навигационна лента
const Header = ({ onLogout }) => (
  <nav className="navbar">
    <div className="logo">
      <IoMdPaper style={{fontSize: '45px'}}/>
    </div>
    <div className="nav-links">
      <Link to="/products">Изделия</Link>
      <Link to="/materials">Материали</Link>
      <Link to="/expenses">Разходи</Link>
    </div>
    <Link class="logout" to="/" onClick={onLogout}>Изход...</Link>
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
        <Route path="/" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/products" />} />
        <Route path="/products" element={isAuthenticated ? <Products /> : <Navigate to="/" />} />
        <Route path="/materials" element={isAuthenticated ? <Materials /> : <Navigate to="/" />} />
        <Route path="/expenses" element={isAuthenticated ? <Expenses /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;