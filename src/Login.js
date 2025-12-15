import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const adminCredentials = { username: 'admin', password: 'pass' };

  // Използва се примерен потребител с име "admin" и парола "pass"

  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (username === adminCredentials.username && password === adminCredentials.password) {
        onLogin(); 
    }
  };

  return (
    <div className="login-card-container">
      <div className="login-card">
        <h2>Вход</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>Потребителско име</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>Парола</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-form">Вход</button>
        </form>
      </div>
    </div>
  );
};

export default Login;