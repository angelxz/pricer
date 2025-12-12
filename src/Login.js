import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const adminCredentials = { username: 'admin', password: 'pass' };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation as per project scope
    if (username === adminCredentials.username && password === adminCredentials.password) {
        onLogin(); 
    }
  };

  return (
    <div className="login-card-container">
      <div className="form-card">
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