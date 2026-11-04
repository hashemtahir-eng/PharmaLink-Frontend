import React, { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useData } from './context/DataContext';
import { Icon, Logo } from './components/UI';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Requirements from './pages/Requirements';
import Orders from './pages/Orders';
import Verification from './pages/Verification';
import Disputes from './pages/Disputes';
import Settings from './pages/Settings';
import ChatWidget from './components/ChatWidget';
const nav = {
  company: [
    ['dashboard', 'Overview', 'dashboard'],
    ['post-requirement', 'Post requirement', 'plus'],
    ['requirements', 'My requirements', 'file'],
    ['bids', 'View bids', 'box'],
    ['comparison', 'Bid comparison', 'chart'],
    ['orders', 'Orders', 'box'],
    ['ratings', 'Ratings & reviews', 'star'],
    ['disputes', 'Disputes', 'shield'],
  ],
  manufacturer: [
    ['dashboard', 'Overview', 'dashboard'],
    ['verification', 'Verification status', 'shield'],
    ['certificates', 'Upload certificates', 'upload'],
    ['requirements', 'Open requirements', 'file'],
    ['bids', 'My bids', 'box'],
    ['results', 'Bid results', 'chart'],
    ['orders', 'Orders', 'box'],
    ['disputes', 'Disputes', 'chat'],
  ],
  admin: [
    ['dashboard', 'Overview', 'dashboard'],
    ['verification', 'Manufacturer verification', 'shield'],
    ['certificates', 'Certificate review', 'file'],
    ['disputes', 'Dispute management', 'chat'],
    ['rules', 'Chatbot rules', 'box'],
  ],
};
function Workspace() {
  const { data, user, logout } = useData();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/login" replace />;
  const role = location.pathname.split('/')[1];
  if (role !== user.role) return <Navigate to={'/' + user.role + '/dashboard'} replace />;
  const section = location.pathname.split('/')[2];
  const current = [...nav[role], ['profile', 'Profile', 'user']].find((n) => n[0] === section);
  return (
    <div className="workspace">
      <aside className={'sidebar ' + (mobile ? 'mobile-open' : '')}>
        <Logo />
        <div className="workspace-label">
          <span className="workspace-avatar">{user.organization.slice(0, 1)}</span>
          <div>
            <strong>{user.organization}</strong>
            <small>{role === 'admin' ? 'Administration' : role + ' workspace'}</small>
          </div>
          <span className="workspace-dot">⌄</span>
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav>
          {nav[role].map(([path, label, icon]) => (
            <NavLink onClick={() => setMobile(false)} key={path} to={'/' + role + '/' + path}>
              <Icon name={icon} />
              <span>{label}</span>
              {path === 'requirements' && (
                <i>
                  {data.requirements
                    .filter((r) =>
                      role === 'company' ? r.company === user.id : r.status === 'OPEN',
                    )
                    .length.toString()
                    .padStart(2, '0')}
                </i>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="trust-card">
            <Icon name="shield" />
            <strong>Built on trust.</strong>
            <p>Verified partners. Transparent decisions.</p>
            <NavLink to={'/' + role + '/verification'} onClick={() => setMobile(false)}>
              {role === 'company' ? 'Explore verification' : 'Verification center'}{' '}
              <Icon name="arrow" size={15} />
            </NavLink>
          </div>
          <NavLink to={'/' + role + '/profile'} onClick={() => setMobile(false)}>
            <Icon name="user" /> My profile
          </NavLink>
          <button onClick={logout}>
            <Icon name="logout" /> Sign out
          </button>
          <small>PharmaLink © 2026</small>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-shade"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Open navigation"
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{current?.[1] || 'Details'}</strong>
          </div>
          <div className="topbar-actions">
            <form
              className="global-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate('/' + role + '/requirements?q=' + encodeURIComponent(search));
              }}
            >
              <Icon name="search" size={17} />
              <input
                aria-label="Search requirements"
                placeholder="Search requirements…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>↵</kbd>
            </form>
            <span className="demo-pill">
              <i /> Demo workspace
            </span>
            <button
              className="avatar"
              onClick={() => navigate('/' + role + '/profile')}
              aria-label="Open profile"
            >
              {user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </button>
          </div>
        </header>
        <main className="page-content">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="requirements/*" element={<Requirements />} />
            <Route path="post-requirement" element={<Requirements mode="post" />} />
            <Route path="bids/*" element={<Requirements mode="bids" />} />
            <Route path="comparison/*" element={<Requirements mode="comparison" />} />
            <Route path="results/*" element={<Requirements mode="results" />} />
            <Route path="orders/*" element={<Orders />} />
            <Route path="ratings" element={<Orders ratingsOnly />} />
            <Route path="verification/*" element={<Verification />} />
            <Route path="certificates/*" element={<Verification certificates />} />
            <Route path="disputes/*" element={<Disputes />} />
            <Route path="profile" element={<Settings />} />
            <Route path="rules" element={<Settings rules />} />
            <Route
              path="*"
              element={
                <div className="panel empty">
                  <h1>Page not found</h1>
                  <NavLink to={'/' + role + '/dashboard'}>Return to overview</NavLink>
                </div>
              }
            />
          </Routes>
          <footer className="page-footer">
            <span>PharmaLink · Smarter procurement. Stronger partnerships.</span>
            <span>
              Frontend demo <i /> All systems local
            </span>
          </footer>
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
export default function App() {
  const { user } = useData();
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth register />} />
      <Route
        path="/"
        element={<Navigate to={user ? '/' + user.role + '/dashboard' : '/login'} replace />}
      />
      <Route path="/:role/*" element={<Workspace />} />
    </Routes>
  );
}
