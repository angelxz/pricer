import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { IoMdPaper } from 'react-icons/io';
import Login from './Login';
import Materials from './Materials';
import Products from './Products';
import Expenses from './Expenses';
import './App.css';

// Header Component
const Header = ({ onLogout }) => (
  <nav className="navbar">
    <div className="logo">
      <IoMdPaper style={{fontSize: '45px'}}/>
      {/* <strong>Спецификация на изделия</strong> */}
    </div>
    <div className="nav-links">
      <span class="divider" />
      <Link to="/products">Изделия</Link>
      <span class="divider" />
      <Link to="/materials">Материали</Link>
      <span class="divider" />
      <Link to="/expenses">Разходи</Link>
      <span class="divider" />
    </div>
    <Link class="logout" to="/" onClick={onLogout}>Изход...</Link>


    {/* <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '24px' }}><IoMdPaper/></span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong>Спецификация на изделия</strong>
      </div>
    </div>
    <div className="nav-links">
      <Link to="/products">Изделия</Link>
      <Link to="/materials">Материали</Link>
      <Link to="/expenses">Разходи</Link>
      <Link to="/" onClick={onLogout}>Изход...</Link>
    </div> */}
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