import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Logo, Field, Icon } from '../components/UI';
export default function Auth({ register = false }) {
  const { data, user, login, update, notify } = useData();
  const navigate = useNavigate();
  const [role, setRole] = useState('company');
  const [error, setError] = useState('');
  if (user) return <Navigate to={'/' + user.role + '/dashboard'} replace />;
  // This is intentionally demo authentication: records stay in this browser only.
  function submit(e) {
    e.preventDefault();
    setError('');
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (!register) {
      const found = data.users.find(
        (u) => u.email.toLowerCase() === form.email.toLowerCase() && u.password === form.password,
      );
      if (!found) return setError('Email or password is incorrect. Try a demo account below.');
      login(found.id);
      navigate('/' + found.role + '/dashboard');
      return;
    }
    if (data.users.some((u) => u.email.toLowerCase() === form.email.toLowerCase()))
      return setError('An account with this email already exists.');
    if (form.password.length < 8)
      return setError('Use at least 8 characters for your demo password.');
    const id = crypto.randomUUID();
    const newUser = { ...form, id, role };
    const next = {
      ...data,
      users: [...data.users, newUser],
      manufacturers:
        role === 'manufacturer'
          ? [
              ...data.manufacturers,
              {
                id,
                name: form.organization,
                status: 'PENDING',
                rating: null,
                ratingCount: 0,
                certificate: '',
                reason: '',
              },
            ]
          : data.manufacturers,
    };
    if (update(next)) {
      login(id);
      notify('Account created. Welcome to PharmaLink!');
      navigate('/' + role + '/dashboard');
    }
  }
  function demo(role) {
    login(data.users.find((u) => u.role === role).id);
    navigate('/' + role + '/dashboard');
  }
  return (
    <main className="auth">
      <section className="auth-story">
        <Logo />
        <div>
          <span className="eyebrow light">THE FUTURE OF PHARMA PROCUREMENT</span>
          <h1>
            Better partners.
            <br />
            Smarter decisions.
            <br />
            <span>Healthier outcomes.</span>
          </h1>
          <p>One connected workspace for pharmaceutical companies and trusted manufacturers.</p>
          <div className="auth-orbit">
            <span>✚</span>
            <i className="orbit-one">✓ Verified manufacturers</i>
            <i className="orbit-two">↗ Intelligent bidding</i>
            <i className="orbit-three">◇ Transparent procurement</i>
          </div>
        </div>
        <small>Built for trust. Designed for progress.</small>
      </section>
      <section className="auth-form">
        <div className="auth-box">
          <span className="eyebrow">YOUR PROCUREMENT WORKSPACE</span>
          <h1>{register ? 'Start your next chapter.' : 'Welcome back.'}</h1>
          <p>
            {register
              ? 'Connect with the right pharmaceutical partners.'
              : 'Sign in to move your business forward.'}
          </p>
          <form onSubmit={submit}>
            {register && (
              <>
                <div className="segmented">
                  {['company', 'manufacturer'].map((r) => (
                    <button
                      type="button"
                      key={r}
                      className={role === r ? 'selected' : ''}
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Field label="Full name" name="name" required maxLength={80} />
                <Field label="Organization" name="organization" required maxLength={100} />
              </>
            )}
            <Field
              label="Email address"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
            />
            <Field
              label="Password"
              name="password"
              type="password"
              minLength={register ? 8 : 1}
              placeholder={register ? 'At least 8 characters' : 'Enter your password'}
              required
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" type="submit">
              {register ? 'Create account' : 'Sign in'} <Icon name="arrow" size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? 'Already connected?' : 'New to PharmaLink?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          {!register && (
            <div className="demo-area">
              <span>EXPLORE WITH A DEMO ACCOUNT</span>
              <div>
                {['company', 'manufacturer', 'admin'].map((r) => (
                  <button key={r} onClick={() => demo(r)}>
                    {r === 'admin' ? 'Administrator' : r}
                    <Icon name="arrow" size={15} />
                  </button>
                ))}
              </div>
              <small>Demo password: Demo123! · Data stays in this browser.</small>
            </div>
          )}
          <p className="local-note">
            <Icon name="shield" size={15} /> Frontend demonstration · Use sample credentials only
          </p>
        </div>
      </section>
    </main>
  );
}
