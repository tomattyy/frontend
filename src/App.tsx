import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState<any>(null);

  return (
    <div className="container">
      {user ? (
        <Dashboard user={user} onLogout={() => setUser(null)} />
      ) : (
        <Login onLogin={setUser} />
      )}
    </div>
  );
}

export default App;
