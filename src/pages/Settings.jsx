import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Panel, Field, Icon, Empty } from '../components/UI';
import { Heading } from './Requirements';
export default function Settings({ rules = false }) {
  const { data, user, update, notify } = useData();
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [remove, setRemove] = useState(null);
  const [error, setError] = useState('');
  function saveProfile(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (
      data.users.some(
        (u) => u.id !== user.id && u.email.toLowerCase() === values.email.toLowerCase(),
      )
    )
      return setError('This email is already used by another account.');
    const next = {
      ...data,
      users: data.users.map((u) => (u.id === user.id ? { ...u, ...values } : u)),
      manufacturers: data.manufacturers.map((m) =>
        m.id === user.id
          ? { ...m, name: values.organization, phone: values.phone, address: values.address }
          : m,
      ),
    };
    if (update(next)) {
      setError('');
      notify('Your profile has been updated.');
    }
  }
  function saveRule(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (!values.keywords.split(',').some((k) => k.trim()))
      return setError('Enter at least one keyword.');
    const r = { ...values, id: editing?.id || crypto.randomUUID() };
    if (
      update({
        ...data,
        rules: editing ? data.rules.map((x) => (x.id === editing.id ? r : x)) : [...data.rules, r],
      })
    ) {
      setEditing(null);
      e.currentTarget.reset();
      setError('');
      notify('Chatbot rule saved. Try it in the assistant.');
    }
  }
  if (rules) {
    if (user.role !== 'admin') return <Empty text="Administrator access required." />;
    return (
      <>
        <Heading
          title="Chatbot rules"
          text="Helpful answers, maintained by your team. Changes apply immediately."
        />
        <Panel title={editing ? 'Edit response rule' : 'Create a response rule'}>
          <form key={editing?.id || 'new'} onSubmit={saveRule} className="form-grid">
            <Field
              label="Keywords (comma separated)"
              name="keywords"
              defaultValue={editing?.keywords || ''}
              maxLength={300}
              placeholder="shipping, shipment, delivery"
              required
            />
            <Field label="Response">
              <textarea
                name="response"
                defaultValue={editing?.response || ''}
                required
                rows="3"
                maxLength={2000}
              />
            </Field>
            {error && <p className="error">{error}</p>}
            <div className="form-actions">
              {editing && (
                <button type="button" className="button" onClick={() => setEditing(null)}>
                  Cancel edit
                </button>
              )}
              <button className="button primary">
                {editing ? 'Save changes' : 'Add rule'} <Icon name="plus" size={16} />
              </button>
            </div>
          </form>
        </Panel>
        <Panel title={'Response library · ' + data.rules.length + ' rules'}>
          <div className="toolbar">
            <div className="search-input">
              <Icon name="search" size={17} />
              <input
                aria-label="Search chatbot rules"
                placeholder="Search rules…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="rules-list">
            {data.rules
              .filter((r) =>
                (r.keywords + ' ' + r.response).toLowerCase().includes(query.toLowerCase()),
              )
              .map((r) => (
                <article className="rule-card" key={r.id}>
                  <div>
                    <strong>{r.keywords}</strong>
                    <p>{r.response}</p>
                  </div>
                  <div className="rule-actions">
                    <button
                      className="button small"
                      onClick={() => {
                        setEditing(r);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Edit
                    </button>
                    {remove === r.id ? (
                      <>
                        <button
                          className="button danger small"
                          onClick={() => {
                            update({ ...data, rules: data.rules.filter((x) => x.id !== r.id) });
                            if (editing?.id === r.id) setEditing(null);
                            setRemove(null);
                            notify('Rule deleted.');
                          }}
                        >
                          Confirm delete
                        </button>
                        <button className="button small" onClick={() => setRemove(null)}>
                          Keep
                        </button>
                      </>
                    ) : (
                      <button className="button small danger-text" onClick={() => setRemove(r.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              ))}
          </div>
        </Panel>
      </>
    );
  }
  return (
    <>
      <Heading title="My profile" text="Keep your details current. Make every connection count." />
      <div className="detail-grid">
        <Panel title="Personal & organization details">
          <form onSubmit={saveProfile} className="form-grid">
            <Field label="Full name" name="name" defaultValue={user.name} required maxLength={80} />
            <Field
              label="Organization"
              name="organization"
              defaultValue={user.organization}
              required
              maxLength={100}
            />
            <Field
              label="Email address"
              name="email"
              type="email"
              defaultValue={user.email}
              required
            />
            <Field
              label="Phone number"
              name="phone"
              type="tel"
              defaultValue={user.phone || ''}
              maxLength={30}
            />
            <Field label="Address">
              <textarea name="address" defaultValue={user.address || ''} rows="3" maxLength={500} />
            </Field>
            {error && <p className="error">{error}</p>}
            <div className="form-actions">
              <button className="button primary">
                Save profile <Icon name="check" size={16} />
              </button>
            </div>
          </form>
        </Panel>
        <Panel title="Your workspace">
          <div className="profile-summary">
            <div className="large-avatar">
              {user.name
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </div>
            <h2>{user.name}</h2>
            <p>{user.organization}</p>
            <span className="role-label">
              {user.role === 'admin' ? 'Administrator' : user.role}
            </span>
          </div>
          <div className="notice">
            This is a frontend demonstration. Accounts and changes are stored in this browser. Use
            sample information for your project presentation.
          </div>
        </Panel>
      </div>
    </>
  );
}
