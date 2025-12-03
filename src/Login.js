import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation as per project scope
    if(username && password) onLogin(); 
  };

  return (
    <div className="card-container" style={{ alignItems: 'center', height: '80vh' }}>
      <div className="form-card" style={{ textAlign: 'center' }}>
        <h2>Вход</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>Име</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label>Парола</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-login">Влизане</button>
        </form>
      </div>
    </div>
  );
};

export default Login;