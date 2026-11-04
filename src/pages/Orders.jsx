import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Panel, Badge, Field, SimulationBanner, Empty, Icon } from '../components/UI';
import { Heading } from './Requirements';
import { money, date, penalty, nextStatus, canTransition } from '../mockData/logic';
export function OrderEvidence({ order }) {
  const sla = penalty(order);
  const steps = ['AWARDED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
  return (
    <>
      <div className="detail-grid">
        <Panel title="Service level agreement">
          <div className="detail-pairs">
            <div>
              <small>Agreed delivery</small>
              <strong>{date(order.due)}</strong>
            </div>
            <div>
              <small>Delivery performance</small>
              <Badge>{sla.late ? sla.late + ' DAYS LATE' : 'ON_TRACK'}</Badge>
            </div>
            <div>
              <small>SLA penalty</small>
              <strong>{money(sla.amount)}</strong>
            </div>
          </div>
          <p className="muted">
            2% per started late week, capped at 10%. Penalty freezes at delivery.
          </p>
        </Panel>
        <Panel title="Simulated escrow">
          <SimulationBanner />
          <div className="detail-pairs">
            <div>
              <small>Held order value</small>
              <strong>{money(order.price)}</strong>
            </div>
            <div>
              <small>Status</small>
              <Badge>{order.escrow}</Badge>
            </div>
            <div>
              <small>
                {order.escrow === 'REFUNDED' ? 'Buyer refund' : 'Manufacturer settlement'}
              </small>
              <strong>
                {money(
                  order.settlementAmount ??
                    (order.escrow === 'REFUNDED' ? order.price : order.price - sla.amount),
                )}
              </strong>
            </div>
          </div>
        </Panel>
      </div>
      <Panel title="Order activity" subtitle="A timestamped history of every milestone">
        <ol className="timeline">
          {order.history.map((h, i) => (
            <li key={i}>
              <span className="timeline-dot">
                <Icon name="check" size={13} />
              </span>
              <div>
                <strong>{h.status.replaceAll('_', ' ')}</strong>
                <small>
                  {date(h.at)} ·{' '}
                  {new Date(h.at).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </small>
              </div>
            </li>
          ))}
          {order.status !== 'CANCELLED' &&
            steps.slice(steps.indexOf(order.status) + 1).map((s) => (
              <li key={s} className="upcoming">
                <span className="timeline-dot" />
                <div>
                  <strong>{s.replaceAll('_', ' ')}</strong>
                  <small>Upcoming milestone</small>
                </div>
              </li>
            ))}
        </ol>
      </Panel>
    </>
  );
}
export default function Orders({ ratingsOnly = false }) {
  const { data, user, update, notify } = useData();
  const id = useLocation().pathname.split('/')[3];
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [cancel, setCancel] = useState(false);
  const [error, setError] = useState('');
  const root = '/' + user.role;
  const orders = data.orders.filter((o) => user.role === 'admin' || o[user.role] === user.id);
  const order = orders.find((o) => o.id === id);
  const activeDispute =
    order && data.disputes.some((d) => d.order === id && d.status !== 'RESOLVED');
  // Each allowed milestone appends a history entry used as dispute evidence.
  function transition(status) {
    if (!canTransition(user.role, order.status) || nextStatus[order.status] !== status) return;
    const next = {
      ...order,
      status,
      history: [...order.history, { status, at: new Date().toISOString() }],
    };
    if (update({ ...data, orders: data.orders.map((o) => (o.id === id ? next : o)) }))
      notify('Order updated: ' + status.replaceAll('_', ' ').toLowerCase());
  }
  // Seeded historical reviews are represented by ratingCount and the cached mean.
  // Add this score to that history, then complete and settle the order together.
  function rate(e, selectedOrder = order) {
    e.preventDefault();
    if (
      selectedOrder.status !== 'DELIVERED' ||
      data.ratings.some((r) => r.order === selectedOrder.id)
    )
      return;
    if (data.disputes.some((d) => d.order === selectedOrder.id && d.status !== 'RESOLVED'))
      return setError('Resolve the active dispute before completing the order.');
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const score = Number(values.score);
    const m = data.manufacturers.find((m) => m.id === selectedOrder.manufacturer);
    const average = ((m.rating || 0) * m.ratingCount + score) / (m.ratingCount + 1);
    const next = {
      ...data,
      ratings: [
        ...data.ratings,
        {
          id: crypto.randomUUID(),
          order: selectedOrder.id,
          manufacturer: m.id,
          score,
          comment: values.comment,
          created: new Date().toISOString(),
        },
      ],
      manufacturers: data.manufacturers.map((x) =>
        x.id === m.id ? { ...x, rating: average, ratingCount: x.ratingCount + 1 } : x,
      ),
      orders: data.orders.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: 'COMPLETED',
              escrow: o.escrow === 'HELD' ? 'RELEASED' : o.escrow,
              settlementAmount:
                o.settlementAmount ?? Math.round((o.price - penalty(o).amount) * 100) / 100,
              history: [...o.history, { status: 'COMPLETED', at: new Date().toISOString() }],
            }
          : o,
      ),
    };
    if (update(next)) notify('Review saved. Order completed and simulated escrow settled.');
  }
  function ratingForm(o) {
    return (
      <Panel
        key={o.id}
        title={'Review ' + o.product}
        subtitle={o.id + ' · ' + data.manufacturers.find((m) => m.id === o.manufacturer)?.name}
      >
        <form onSubmit={(e) => rate(e, o)} className="form-grid">
          <Field label="Your rating">
            <select name="score" required defaultValue="">
              <option value="" disabled>
                Select a rating
              </option>
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>
                  {'★'.repeat(s)} · {s}/5
                </option>
              ))}
            </select>
          </Field>
          <Field label="Review (optional)">
            <textarea
              name="comment"
              rows="3"
              maxLength={1000}
              placeholder="Share your experience with quality, communication and delivery."
            />
          </Field>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button
              className="button primary"
              disabled={data.disputes.some((d) => d.order === o.id && d.status !== 'RESOLVED')}
            >
              Submit review & complete order
            </button>
          </div>
        </form>
      </Panel>
    );
  }
  if (id && !order) return <Empty text="Order not found or not available to this account." />;
  if (order)
    return (
      <>
        <Link className="back-link" to={root + '/orders'}>
          ← Back to orders
        </Link>
        <Heading
          title={'Order ' + order.id}
          text={order.product + ' · ' + order.quantity.toLocaleString() + ' units'}
          action={<Badge>{order.status}</Badge>}
        />
        <Panel title="Order summary">
          <div className="detail-pairs">
            <div>
              <small>Manufacturer</small>
              <strong>{data.manufacturers.find((m) => m.id === order.manufacturer)?.name}</strong>
            </div>
            <div>
              <small>Company</small>
              <strong>{data.users.find((u) => u.id === order.company)?.organization}</strong>
            </div>
            <div>
              <small>Contract value</small>
              <strong>{money(order.price)}</strong>
            </div>
          </div>
          <div className="form-actions">
            {canTransition(user.role, order.status) && (
              <button
                className="button primary"
                onClick={() => transition(nextStatus[order.status])}
              >
                {
                  {
                    AWARDED: 'Start production',
                    IN_PRODUCTION: 'Mark shipped',
                    SHIPPED: 'Confirm receipt',
                  }[order.status]
                }{' '}
                <Icon name="arrow" size={17} />
              </button>
            )}
            {user.role !== 'admin' && order.escrow === 'HELD' && !activeDispute && (
              <Link className="button" to={root + '/disputes?order=' + order.id}>
                Raise a dispute
              </Link>
            )}
            {user.role === 'company' &&
              ['AWARDED', 'IN_PRODUCTION'].includes(order.status) &&
              !activeDispute &&
              (cancel ? (
                <>
                  <span>Cancel this order?</span>
                  <button
                    className="button danger"
                    onClick={() => {
                      update({
                        ...data,
                        orders: data.orders.map((o) =>
                          o.id === id
                            ? {
                                ...o,
                                status: 'CANCELLED',
                                escrow: 'REFUNDED',
                                history: [
                                  ...o.history,
                                  { status: 'CANCELLED', at: new Date().toISOString() },
                                ],
                              }
                            : o,
                        ),
                      });
                      setCancel(false);
                      notify('Order cancelled. Simulated escrow refunded.');
                    }}
                  >
                    Confirm cancellation
                  </button>
                  <button className="button" onClick={() => setCancel(false)}>
                    Keep order
                  </button>
                </>
              ) : (
                <button className="button danger-text" onClick={() => setCancel(true)}>
                  Cancel order
                </button>
              ))}
          </div>
          {activeDispute && (
            <div className="notice">
              An active dispute is under review. Completion and escrow release are paused.
            </div>
          )}
        </Panel>
        <OrderEvidence order={order} />
        {user.role === 'company' && order.status === 'DELIVERED' && ratingForm(order)}
        {data.ratings
          .filter((r) => r.order === id)
          .map((r) => (
            <Panel key={r.id} title="Your review">
              <strong className="stars">
                {'★'.repeat(r.score)}
                {'☆'.repeat(5 - r.score)}
              </strong>
              <p>{r.comment || 'No written comment.'}</p>
              <small className="muted">Submitted {date(r.created)}</small>
            </Panel>
          ))}
      </>
    );
  const list = orders.filter(
    (o) =>
      (filter === 'ALL' || o.status === filter) &&
      (o.product + ' ' + o.id).toLowerCase().includes(query.toLowerCase()),
  );
  if (ratingsOnly)
    return (
      <>
        <Heading
          title="Ratings & reviews"
          text="Your feedback builds a more reliable manufacturing network."
        />
        {orders.filter((o) => o.status === 'DELIVERED').map(ratingForm)}
        <Panel title="Submitted reviews">
          {data.ratings
            .filter((r) => orders.some((o) => o.id === r.order))
            .map((r) => (
              <div className="review" key={r.id}>
                <strong>{orders.find((o) => o.id === r.order)?.product}</strong>
                <span className="stars">{'★'.repeat(r.score)}</span>
                <p>{r.comment || 'No written comment.'}</p>
                <small>{date(r.created)}</small>
              </div>
            ))}
          {!data.ratings.some((r) => orders.some((o) => o.id === r.order)) && (
            <Empty text="Your submitted reviews will appear here. Delivered orders are ready to review above." />
          )}
        </Panel>
      </>
    );
  return (
    <>
      <Heading
        title="Orders"
        text="From awarded bid to successful delivery. Every milestone, connected."
      />
      <Panel>
        <div className="toolbar">
          <div className="search-input">
            <Icon name="search" size={17} />
            <input
              aria-label="Search orders"
              placeholder="Search orders…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Order status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              'ALL',
              'AWARDED',
              'IN_PRODUCTION',
              'SHIPPED',
              'DELIVERED',
              'COMPLETED',
              'CANCELLED',
            ].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <SimulationBanner />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ORDER / PRODUCT</th>
                <th>VALUE</th>
                <th>DUE DATE</th>
                <th>STATUS</th>
                <th>ESCROW</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.product}</strong>
                    <small>{o.id}</small>
                  </td>
                  <td>{money(o.price)}</td>
                  <td>
                    {date(o.due)}
                    {penalty(o).late > 0 && (
                      <small className="error">{penalty(o).late} days late</small>
                    )}
                  </td>
                  <td>
                    <Badge>{o.status}</Badge>
                  </td>
                  <td>
                    <Badge>{o.escrow}</Badge>
                  </td>
                  <td>
                    <Link className="text-link" to={root + '/orders/' + o.id}>
                      View order <Icon name="arrow" size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && (
            <Empty text="No orders match this view. Award a bid to create an order." />
          )}
        </div>
      </Panel>
    </>
  );
}
