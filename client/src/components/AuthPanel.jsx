import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { HeartPulse, RadioTower, ShieldCheck, Siren } from 'lucide-react';
import { useState } from 'react';
import { auth } from '../firebase';
import { api } from '../services/api';

export default function AuthPanel() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'volunteer' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await credential.user.getIdToken(true);
        await api.saveProfile({
          name: form.name,
          role: form.role,
          skills: [],
          location: null
        });
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-visuals" aria-hidden="true">
        <span><Siren size={26} /></span>
        <span><RadioTower size={28} /></span>
        <span><HeartPulse size={25} /></span>
      </div>
      <section className="auth-card">
        <div className="brand-lockup">
          <ShieldCheck size={34} />
          <div>
            <h1>Disaster Volunteer Coordination</h1>
            <p>Coordinate skilled responders, tasks, zones, and stock in real time.</p>
          </div>
        </div>

        <div className="segmented">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <form onSubmit={submit} className="stack">
          {mode === 'register' && (
            <>
              <label>
                Name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label>
                Role
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Authority/Admin</option>
                </select>
              </label>
            </>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label>
            Password
            <input
              type="password"
              minLength="6"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  );
}
