import { useState } from 'react';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Is auth-service running?');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h2 className="text-center">Bem-vindo</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Usuário</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="admin"
          />
        </div>
        <div className="form-group">
          <label>Senha</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="password123"
          />
        </div>
        {error && <p className="text-error mb-4">{error}</p>}
        <button type="submit" style={{ width: '100%' }}>Entrar</button>
      </form>
    </div>
  );
}
