import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Badge, Panel, Field, Icon, Empty } from '../components/UI';
import { money, date, closeRequirement } from '../mockData/logic';
export default function Requirements({ mode }) {
  const { data, user, update, notify } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const id = location.pathname.split('/')[3];
  const [query, setQuery] = useState(new URLSearchParams(location.search).get('q') || '');
  const [filter, setFilter] = useState(user.role === 'manufacturer' && !mode ? 'OPEN' : 'ALL');
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const root = '/' + user.role;
  // A navbar search can change the query without unmounting this screen.
  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get('q') || '');
    setFilter(user.role === 'manufacturer' && !mode ? 'OPEN' : 'ALL');
    setError('');
    setConfirmClose(false);
  }, [location.search, location.pathname, mode, user.role]);
  const visible = data.requirements.filter((r) =>
    user.role === 'company' ? r.company === user.id : true,
  );
  const requirement = visible.find((r) => r.id === id);
  const manufacturer = data.manufacturers.find((m) => m.id === user.id);
  // FormData collects the named fields; the context saves the new record locally.
  function post(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (new Date(values.deadline) <= new Date())
      return setError('Select a future bidding deadline.');
    const r = {
      ...values,
      id: crypto.randomUUID(),
      company: user.id,
      quantity: Number(values.quantity),
      status: 'OPEN',
      created: new Date().toISOString(),
    };
    if (update({ ...data, requirements: [r, ...data.requirements] })) {
      notify('Requirement published. Manufacturers can now submit bids.');
      navigate(root + '/requirements/' + r.id);
    }
  }
  // Recheck the gate and deadline at submission, not just when rendering the form.
  function submitBid(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (manufacturer?.status !== 'VERIFIED')
      return setError('Your manufacturer account must be verified.');
    if (requirement.status !== 'OPEN' || new Date(requirement.deadline) <= new Date())
      return setError('Bidding is closed.');
    if (data.bids.some((b) => b.requirement === id && b.manufacturer === user.id))
      return setError('You have already submitted a bid for this requirement.');
    const bid = {
      id: crypto.randomUUID(),
      requirement: id,
      manufacturer: user.id,
      price: Number(values.price),
      days: Number(values.days),
      certifications: values.certifications,
      created: new Date().toISOString(),
    };
    if (update({ ...data, bids: [...data.bids, bid] })) {
      notify('Your sealed bid has been submitted.');
      navigate(root + '/bids');
    }
  }
  // Awarding connects bidding to tracking and creates the simulated held balance.
  function award(bid) {
    if (user.role !== 'company' || requirement.status !== 'CLOSED') return;
    if (data.orders.some((o) => o.bid === bid.id)) return;
    const due = new Date();
    due.setDate(due.getDate() + bid.days);
    const order = {
      id: 'PL-' + Date.now().toString().slice(-7),
      bid: bid.id,
      company: user.id,
      manufacturer: bid.manufacturer,
      product: requirement.product,
      quantity: requirement.quantity,
      price: bid.price,
      status: 'AWARDED',
      escrow: 'HELD',
      due: due.toISOString().slice(0, 10),
      history: [{ status: 'AWARDED', at: new Date().toISOString() }],
    };
    if (
      update({
        ...data,
        requirements: data.requirements.map((r) => (r.id === id ? { ...r, status: 'AWARDED' } : r)),
        bids: data.bids.map((b) => (b.id === bid.id ? { ...b, awarded: true } : b)),
        orders: [order, ...data.orders],
      })
    ) {
      notify('Bid awarded. Your demo order has been created.');
      navigate(root + '/orders/' + order.id);
    }
  }
  if (mode === 'post')
    return user.role === 'company' ? (
      <>
        <Heading
          title="Post a requirement"
          text="Tell manufacturers exactly what you need. Better details lead to better bids."
        />
        <Panel
          title="Requirement details"
          subtitle="All fields are required"
          className="form-panel"
        >
          <form onSubmit={post} className="form-grid">
            <Field
              label="Product name"
              name="product"
              placeholder="e.g. Paracetamol 500mg"
              maxLength={100}
              required
            />
            <Field label="Dosage form">
              <select name="category" required>
                {['Tablets', 'Capsules', 'Softgels', 'Syrup', 'Injection', 'Other'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field
              label="Quantity (units)"
              type="number"
              name="quantity"
              min="1"
              max="100000000"
              step="1"
              required
            />
            <Field label="Bidding deadline" type="datetime-local" name="deadline" required />
            <Field label="Technical specifications">
              <textarea
                name="specifications"
                required
                minLength={10}
                maxLength={3000}
                rows="5"
                placeholder="Strength, packaging, quality standards, certifications and delivery expectations…"
              />
            </Field>
            <div className="form-info">
              Bids stay sealed until the deadline or until you close bidding. Recommendations then
              use price, delivery and rating.
            </div>
            {error && <p className="error">{error}</p>}
            <div className="form-actions">
              <Link className="button" to={root + '/requirements'}>
                Cancel
              </Link>
              <button className="button primary">
                Publish requirement <Icon name="arrow" size={17} />
              </button>
            </div>
          </form>
        </Panel>
      </>
    ) : (
      <Empty text="Only companies can post requirements." />
    );
  if (id && !requirement)
    return <Empty text="Requirement not found or not available to this account." />;
  if (requirement) {
    const bids = data.bids.filter((b) => b.requirement === id);
    const ranked = [...bids].sort(
      (a, b) => (b.score || 0) - (a.score || 0) || a.created.localeCompare(b.created),
    );
    const ownBid = bids.find((b) => b.manufacturer === user.id);
    return (
      <>
        <Link className="back-link" to={root + '/requirements'}>
          ← Back to requirements
        </Link>
        <Heading
          title={requirement.product}
          text={'Requirement #' + id.slice(0, 8).toUpperCase()}
          action={<Badge>{requirement.status}</Badge>}
        />
        <div className="detail-grid">
          <Panel title="Product specifications">
            <div className="detail-pairs">
              <div>
                <small>Quantity</small>
                <strong>{requirement.quantity.toLocaleString()} units</strong>
              </div>
              <div>
                <small>Dosage form</small>
                <strong>{requirement.category}</strong>
              </div>
              <div>
                <small>Bidding deadline</small>
                <strong>{date(requirement.deadline)}</strong>
              </div>
              <div>
                <small>Posted by</small>
                <strong>
                  {data.users.find((u) => u.id === requirement.company)?.organization}
                </strong>
              </div>
            </div>
            <p className="specification">{requirement.specifications}</p>
          </Panel>
          <Panel title="Bidding summary">
            <div className="big-number">
              {bids.length.toString().padStart(2, '0')}
              <small> bids received</small>
            </div>
            <p className="muted">
              {requirement.status === 'OPEN'
                ? 'Offers are sealed until bidding closes.'
                : 'Bidding has closed. Scores are frozen at closure.'}
            </p>
            {user.role === 'company' &&
              requirement.status === 'OPEN' &&
              (confirmClose ? (
                <div className="confirmation">
                  <p>Close bidding now? No further offers will be accepted.</p>
                  <button
                    className="button primary"
                    onClick={() => {
                      update(closeRequirement(data, id));
                      setConfirmClose(false);
                      notify('Bidding closed and recommendations calculated.');
                    }}
                  >
                    Confirm close
                  </button>
                  <button className="button" onClick={() => setConfirmClose(false)}>
                    Keep open
                  </button>
                </div>
              ) : (
                <button className="button" onClick={() => setConfirmClose(true)}>
                  Close bidding & rank
                </button>
              ))}
          </Panel>
        </div>
        {user.role === 'company' &&
          (requirement.status === 'OPEN' ? (
            <Panel title="Sealed bids">
              <div className="sealed">
                <Icon name="shield" size={30} />
                <h3>Your bidding process stays fair.</h3>
                <p>Prices and manufacturer details appear when bidding closes.</p>
              </div>
            </Panel>
          ) : (
            <Panel
              title="Bid comparison & recommendations"
              subtitle="Price 40% · Delivery 35% · Rating 25% · New manufacturer rating: 2.5/5"
            >
              <div className="recommendation-note">
                <Icon name="chart" />{' '}
                {ranked.length === 1
                  ? 'Only bid received. Price and delivery scores are 100 by definition.'
                  : 'The highest score balances value, speed and proven quality. Ties favour the earliest submission.'}
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>RANK / MANUFACTURER</th>
                      <th>TOTAL PRICE</th>
                      <th>DELIVERY</th>
                      <th>PRICE SCORE</th>
                      <th>DELIVERY SCORE</th>
                      <th>RATING SCORE</th>
                      <th>FINAL SCORE</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((b, i) => (
                      <tr key={b.id} className={i === 0 ? 'recommended' : ''}>
                        <td>
                          <strong>
                            #{i + 1} {data.manufacturers.find((m) => m.id === b.manufacturer)?.name}
                          </strong>
                          {i === 0 && (
                            <small className="recommended-label">✦ Recommended partner</small>
                          )}
                          <small>{b.certifications}</small>
                        </td>
                        <td>{money(b.price)}</td>
                        <td>{b.days} days</td>
                        <td>{b.priceScore?.toFixed(1)}</td>
                        <td>{b.deliveryScore?.toFixed(1)}</td>
                        <td>{b.ratingScore?.toFixed(1)}</td>
                        <td>
                          <strong className="score">{b.score?.toFixed(1)}</strong>
                        </td>
                        <td>
                          {requirement.status === 'CLOSED' && i === 0 ? (
                            <button className="button primary small" onClick={() => award(b)}>
                              Award bid
                            </button>
                          ) : b.awarded ? (
                            <Badge>AWARDED</Badge>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!ranked.length && <Empty text="No bids were received for this requirement." />}
              </div>
            </Panel>
          ))}
        {user.role === 'manufacturer' &&
          (ownBid ? (
            <Panel title="Your submitted bid">
              <div className="detail-pairs">
                <div>
                  <small>Price</small>
                  <strong>{money(ownBid.price)}</strong>
                </div>
                <div>
                  <small>Delivery</small>
                  <strong>{ownBid.days} days</strong>
                </div>
                <div>
                  <small>Outcome</small>
                  <Badge>
                    {ownBid.awarded
                      ? 'AWARDED'
                      : requirement.status === 'OPEN'
                        ? 'SEALED'
                        : requirement.status === 'AWARDED'
                          ? 'NOT_SELECTED'
                          : 'UNDER_REVIEW'}
                  </Badge>
                </div>
              </div>
            </Panel>
          ) : requirement.status === 'OPEN' ? (
            <Panel
              title="Submit a structured bid"
              subtitle="One offer per manufacturer. Your bid stays sealed until bidding closes."
              className="form-panel"
            >
              {manufacturer?.status !== 'VERIFIED' ? (
                <div className="notice">
                  Your account must be verified before you can bid.{' '}
                  <Link to={root + '/certificates'}>Upload your certificate →</Link>
                </div>
              ) : (
                <form className="form-grid" onSubmit={submitBid}>
                  <Field
                    label="Total bid price (PKR)"
                    name="price"
                    type="number"
                    min="0.01"
                    max="999999999"
                    step="0.01"
                    required
                  />
                  <Field
                    label="Delivery time (days)"
                    name="days"
                    type="number"
                    min="1"
                    max="365"
                    step="1"
                    required
                  />
                  <Field
                    label="Certifications offered"
                    name="certifications"
                    placeholder="e.g. GMP, DRAP, ISO 9001"
                    required
                    maxLength={200}
                  />
                  {error && <p className="error">{error}</p>}
                  <div className="form-actions">
                    <button className="button primary">
                      Submit sealed bid <Icon name="arrow" size={17} />
                    </button>
                  </div>
                </form>
              )}
            </Panel>
          ) : (
            <div className="notice">This requirement is closed for bidding.</div>
          ))}
      </>
    );
  }
  const bidsMode = ['bids', 'results'].includes(mode) && user.role === 'manufacturer';
  let list = visible
    .filter((r) => {
      if (bidsMode)
        return data.bids.some((b) => b.requirement === r.id && b.manufacturer === user.id);
      if (mode === 'comparison') return r.status !== 'OPEN';
      return true;
    })
    .filter(
      (r) =>
        (filter === 'ALL' || r.status === filter) &&
        [r.product, r.category, r.id].join(' ').toLowerCase().includes(query.toLowerCase()),
    );
  return (
    <>
      <Heading
        title={
          bidsMode
            ? mode === 'results'
              ? 'Bid results'
              : 'My bids'
            : mode === 'comparison'
              ? 'Bid comparison'
              : mode === 'bids'
                ? 'View bids'
                : user.role === 'manufacturer'
                  ? 'Open requirements'
                  : 'My requirements'
        }
        text={
          bidsMode
            ? 'Track your offers, outcomes and next opportunities.'
            : 'A more connected way to source pharmaceutical products.'
        }
        action={
          user.role === 'company' && (
            <Link className="button primary" to={root + '/post-requirement'}>
              <Icon name="plus" size={17} /> Post requirement
            </Link>
          )
        }
      />
      {user.role === 'manufacturer' && manufacturer?.status !== 'VERIFIED' && (
        <div className="notice">
          Verification is required to submit bids.{' '}
          <Link to={root + '/verification'}>View verification status →</Link>
        </div>
      )}
      <Panel>
        <div className="toolbar">
          <div className="tabs">
            {['ALL', 'OPEN', 'CLOSED', 'AWARDED'].map((s) => (
              <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
                {s === 'ALL' ? 'All requirements' : s.toLowerCase()}
              </button>
            ))}
          </div>
          <div className="search-input">
            <Icon name="search" size={17} />
            <input
              aria-label="Filter requirements"
              placeholder="Search product…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>QUANTITY</th>
                <th>DEADLINE</th>
                <th>STATUS</th>
                <th>{bidsMode ? 'MY OFFER' : 'BIDS'}</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const b = data.bids.find(
                  (b) => b.requirement === r.id && b.manufacturer === user.id,
                );
                return (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.product}</strong>
                      <small>
                        {r.category} · #{r.id.slice(0, 8)}
                      </small>
                    </td>
                    <td>{r.quantity.toLocaleString()} units</td>
                    <td>{date(r.deadline)}</td>
                    <td>
                      <Badge>
                        {bidsMode
                          ? b.awarded
                            ? 'AWARDED'
                            : r.status === 'AWARDED'
                              ? 'NOT_SELECTED'
                              : r.status === 'OPEN'
                                ? 'SEALED'
                                : 'UNDER_REVIEW'
                          : r.status}
                      </Badge>
                    </td>
                    <td>
                      {bidsMode
                        ? money(b.price)
                        : data.bids.filter((b) => b.requirement === r.id).length}
                    </td>
                    <td>
                      <Link className="text-link" to={root + '/requirements/' + r.id}>
                        {user.role === 'manufacturer' && !b && r.status === 'OPEN'
                          ? 'View & bid'
                          : 'View details'}{' '}
                        <Icon name="arrow" size={15} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!list.length && <Empty text="No requirements match this view." />}
        </div>
      </Panel>
    </>
  );
}
export function Heading({ title, text, action }) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">PHARMALINK WORKSPACE</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}
