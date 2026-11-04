import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Panel, Badge, Field, Empty, Icon } from '../components/UI';
import { Heading } from './Requirements';
import { OrderEvidence } from './Orders';
import { date, penalty } from '../mockData/logic';
export default function Disputes() {
  const { data, user, update, notify } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.pathname.split('/')[3];
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');
  const root = '/' + user.role;
  const orders = data.orders.filter((o) => user.role === 'admin' || o[user.role] === user.id);
  const disputes = data.disputes.filter((d) => orders.some((o) => o.id === d.order));
  const dispute = disputes.find((d) => d.id === id);
  const eligible = orders.filter(
    (o) =>
      o.escrow === 'HELD' &&
      !data.disputes.some((d) => d.order === o.id && d.status !== 'RESOLVED'),
  );
  function submit(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (!eligible.some((o) => o.id === values.order)) return setError('Choose an eligible order.');
    const next = {
      ...values,
      id: 'DSP-' + Date.now().toString().slice(-7),
      raisedBy: user.id,
      status: 'OPEN',
      created: new Date().toISOString(),
    };
    if (update({ ...data, disputes: [next, ...data.disputes] })) {
      notify('Dispute submitted. Simulated escrow remains held for review.');
      navigate(root + '/disputes/' + next.id);
    }
  }
  // Save the settlement amount now so later SLA changes cannot alter a paid balance.
  function resolve(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (dispute.status === 'RESOLVED') return;
    const order = orders.find((o) => o.id === dispute.order);
    const newStatus = values.inFavour === 'company' ? 'CANCELLED' : order.status;
    const next = {
      ...data,
      disputes: data.disputes.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'RESOLVED',
              resolution: values.resolution,
              inFavour: values.inFavour,
              resolvedAt: new Date().toISOString(),
            }
          : d,
      ),
      orders: data.orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              escrow: values.inFavour === 'company' ? 'REFUNDED' : 'RELEASED',
              settlementAmount:
                values.inFavour === 'company'
                  ? o.price
                  : Math.round((o.price - penalty(o).amount) * 100) / 100,
              settlementPenalty: penalty(o),
              status: newStatus,
              history:
                newStatus !== o.status
                  ? [...o.history, { status: newStatus, at: new Date().toISOString() }]
                  : o.history,
            }
          : o,
      ),
    };
    if (update(next)) notify('Resolution recorded and simulated escrow settled.');
  }
  if (id && !dispute) return <Empty text="Dispute not found or not available to this account." />;
  if (dispute) {
    const order = orders.find((o) => o.id === dispute.order);
    return (
      <>
        <Link className="back-link" to={root + '/disputes'}>
          ← Back to disputes
        </Link>
        <Heading
          title={dispute.id}
          text={order.product + ' · ' + order.id}
          action={<Badge>{dispute.status}</Badge>}
        />
        <Panel title={dispute.category}>
          <div className="detail-pairs">
            <div>
              <small>Raised by</small>
              <strong>
                {data.users.find((u) => u.id === dispute.raisedBy)?.organization || 'Demo company'}
              </strong>
            </div>
            <div>
              <small>Submitted</small>
              <strong>{date(dispute.created)}</strong>
            </div>
          </div>
          <p className="specification">{dispute.description}</p>
          {dispute.status === 'RESOLVED' && (
            <div className="resolution">
              <strong>
                Resolved in favour of{' '}
                {dispute.inFavour === 'company' ? 'the company' : 'the manufacturer'}
              </strong>
              <p>{dispute.resolution}</p>
              <small>{date(dispute.resolvedAt)}</small>
            </div>
          )}
          {user.role === 'admin' && dispute.status === 'OPEN' && (
            <button
              className="button"
              onClick={() => {
                update({
                  ...data,
                  disputes: data.disputes.map((d) =>
                    d.id === id ? { ...d, status: 'UNDER_REVIEW' } : d,
                  ),
                });
                notify('Case marked under review.');
              }}
            >
              Begin review
            </button>
          )}
        </Panel>
        <OrderEvidence order={order} />
        {user.role === 'admin' && dispute.status !== 'RESOLVED' && (
          <Panel
            title="Record a resolution"
            subtitle="Review the SLA and timestamped history before settling the simulated escrow."
          >
            <form onSubmit={resolve} className="form-grid">
              <Field label="Resolve in favour of">
                <select name="inFavour" required>
                  <option value="company">Company · Refund full simulated escrow</option>
                  <option value="manufacturer">Manufacturer · Release after SLA penalty</option>
                </select>
              </Field>
              <Field label="Resolution and justification">
                <textarea name="resolution" required minLength={10} maxLength={2000} rows="4" />
              </Field>
              <div className="form-actions">
                <button className="button primary">Resolve dispute & settle simulation</button>
              </div>
            </form>
          </Panel>
        )}
      </>
    );
  }
  return (
    <>
      <Heading
        title={user.role === 'admin' ? 'Dispute management' : 'Disputes'}
        text="Clear evidence. Fair decisions. Stronger partnerships."
      />
      <Panel title="Case history">
        <div className="toolbar">
          <div className="tabs">
            {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'].map((s) => (
              <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
                {s.replaceAll('_', ' ').toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>CASE / ORDER</th>
                <th>CATEGORY</th>
                <th>SUBMITTED</th>
                <th>STATUS</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {disputes
                .filter((d) => filter === 'ALL' || d.status === filter)
                .map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.id}</strong>
                      <small>{d.order}</small>
                    </td>
                    <td>{d.category}</td>
                    <td>{date(d.created)}</td>
                    <td>
                      <Badge>{d.status}</Badge>
                    </td>
                    <td>
                      <Link className="text-link" to={root + '/disputes/' + d.id}>
                        View case <Icon name="arrow" size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!disputes.some((d) => filter === 'ALL' || d.status === filter) && (
            <Empty text="No disputes in this view." />
          )}
        </div>
      </Panel>
      {user.role !== 'admin' && (
        <Panel
          title="Raise a dispute"
          subtitle="Choose an order with held simulated escrow. One active case per order."
          className="form-panel"
        >
          {eligible.length ? (
            <form onSubmit={submit} className="form-grid">
              <Field label="Order">
                <select
                  name="order"
                  required
                  defaultValue={new URLSearchParams(location.search).get('order') || ''}
                >
                  <option value="" disabled>
                    Select an order
                  </option>
                  {eligible.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} · {o.product}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select name="category" required>
                  {[
                    'Late delivery',
                    'Quality issue',
                    'Quantity mismatch',
                    'Payment dispute',
                    'Other',
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Describe the issue">
                <textarea
                  name="description"
                  minLength={10}
                  maxLength={2000}
                  rows="4"
                  required
                  placeholder="Explain what happened and the outcome you are seeking…"
                />
              </Field>
              {error && <p className="error">{error}</p>}
              <div className="form-actions">
                <button className="button primary">Submit dispute</button>
              </div>
            </form>
          ) : (
            <Empty text="No eligible orders. Existing active disputes must be resolved before opening another case for the same order." />
          )}
        </Panel>
      )}
    </>
  );
}
