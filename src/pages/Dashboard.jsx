import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Icon, Badge, Panel, Empty } from '../components/UI';
import { money, date } from '../mockData/logic';
export default function Dashboard() {
  const { data, user } = useData();
  const [period, setPeriod] = useState('6');
  const role = user.role;
  const root = '/' + role;
  const requirements = data.requirements.filter((r) =>
    role === 'company' ? r.company === user.id : true,
  );
  const orders = data.orders.filter((o) => role === 'admin' || o[role] === user.id);
  const ownBids = data.bids.filter((b) => b.manufacturer === user.id);
  const pending = data.manufacturers.filter((m) => m.status === 'PENDING').length;
  const stats =
    role === 'company'
      ? [
          [
            'Active requirements',
            requirements.filter((r) => r.status === 'OPEN').length,
            'file',
            'Open for bidding',
          ],
          [
            'Bids received',
            data.bids.filter((b) => requirements.some((r) => r.id === b.requirement)).length,
            'box',
            'Across your requirements',
          ],
          [
            'Active orders',
            orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length,
            'box',
            'Moving toward delivery',
          ],
          [
            'Procurement value',
            money(orders.reduce((s, o) => s + o.price, 0)),
            'wallet',
            'Total demo order value',
          ],
        ]
      : role === 'manufacturer'
        ? [
            [
              'Open opportunities',
              requirements.filter((r) => r.status === 'OPEN').length,
              'file',
              'Find your next partnership',
            ],
            ['My bids', ownBids.length, 'box', 'Offers submitted'],
            [
              'Active orders',
              orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length,
              'box',
              'Your production pipeline',
            ],
            [
              'Average rating',
              data.manufacturers.find((m) => m.id === user.id)?.rating?.toFixed(1) || 'New',
              'star',
              'Based on buyer feedback',
            ],
          ]
        : [
            ['Verification queue', pending, 'shield', 'Manufacturers awaiting review'],
            [
              'Verified partners',
              data.manufacturers.filter((m) => m.status === 'VERIFIED').length,
              'user',
              'Trusted network',
            ],
            [
              'Open disputes',
              data.disputes.filter((d) => d.status !== 'RESOLVED').length,
              'chat',
              'Cases requiring attention',
            ],
            ['Platform orders', orders.length, 'box', 'Connected procurement'],
          ];
  const months = Array.from({ length: Number(period) }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (Number(period) - 1 - i));
    return {
      label: d.toLocaleDateString('en', { month: 'short' }),
      key: d.toISOString().slice(0, 7),
    };
  });
  const values = months.map((m) =>
    orders.filter((o) => o.history[0].at.slice(0, 7) === m.key).reduce((s, o) => s + o.price, 0),
  );
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => `${55 + i * (605 / Math.max(1, values.length - 1))},${180 - (v / max) * 140}`)
    .join(' ');
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">YOUR WORKSPACE, AT A GLANCE</span>
          <h1>
            Welcome back, {user.name.split(' ')[0]} <span className="wave">✦</span>
          </h1>
          <p>
            Here’s what’s happening with your{' '}
            {role === 'admin' ? 'PharmaLink network' : 'procurement'} today.
          </p>
        </div>
        <div className="title-actions">
          <span className="date-chip">
            <Icon name="clock" size={16} />
            {date(new Date())}
          </span>
          <Link
            className="button primary"
            to={
              root +
              (role === 'company'
                ? '/post-requirement'
                : role === 'manufacturer'
                  ? '/requirements'
                  : '/verification')
            }
          >
            <Icon name={role === 'company' ? 'plus' : 'arrow'} size={18} />
            {role === 'company'
              ? 'Post requirement'
              : role === 'manufacturer'
                ? 'Explore requirements'
                : 'Review manufacturers'}
          </Link>
        </div>
      </div>
      <section className="welcome-banner">
        <div>
          <span className="banner-kicker">
            <i /> YOUR NEXT GREAT PARTNERSHIP STARTS HERE
          </span>
          <h2>Better sourcing. Smarter choices.</h2>
          <p>Connect with verified manufacturers and turn requirements into results.</p>
          <Link to={root + (role === 'admin' ? '/verification' : '/requirements')}>
            Explore your workspace <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="banner-illustration" aria-hidden="true">
          <div className="illustration-ring" />
          <div className="medicine-card">
            <span>✚</span>
            <div />
            <div />
            <small>VERIFIED QUALITY</small>
            <b>✓</b>
          </div>
          <div className="floating-label">
            <Icon name="shield" size={16} /> Trusted connections
          </div>
          <div className="capsule" />
          <div className="little-cross">+</div>
        </div>
      </section>
      <div className="stat-grid">
        {stats.map(([label, value, icon, note], i) => (
          <section className="stat-card" key={label}>
            <div>
              <span>{label}</span>
              <span className={'stat-icon tone-' + i}>
                <Icon name={icon} />
              </span>
            </div>
            <strong>{value}</strong>
            <small>
              <span className="stat-indicator">↗</span>
              {note}
            </small>
          </section>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel
          title={role === 'admin' ? 'Platform procurement' : 'Procurement overview'}
          subtitle="Order value across your workspace"
          action={
            <select
              aria-label="Chart period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="6">Last 6 months</option>
              <option value="3">Last 3 months</option>
            </select>
          }
        >
          <div className="chart-legend">
            <i /> Order value (PKR)
          </div>
          <svg
            className="line-chart"
            viewBox="0 0 700 230"
            role="img"
            aria-label={
              'Monthly procurement: ' +
              months.map((m, i) => m.label + ' ' + money(values[i])).join(', ')
            }
          >
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#376cf4" stopOpacity=".2" />
                <stop offset="100%" stopColor="#376cf4" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <line
                  x1="55"
                  x2="670"
                  y1={40 + i * 47}
                  y2={40 + i * 47}
                  stroke="#eef1f6"
                  strokeDasharray="4 4"
                />
                <text x="4" y={45 + i * 47} fill="#9aa4b4" fontSize="10">
                  {Math.round((max * (1 - i / 3)) / 1000)}k
                </text>
              </g>
            ))}
            <polygon points={'55,180 ' + points + ' 660,180'} fill="url(#chartFill)" />
            <polyline
              points={points}
              fill="none"
              stroke="#3468ee"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {months.map((m, i) => (
              <g key={m.key}>
                <circle
                  cx={55 + (i * 605) / Math.max(1, values.length - 1)}
                  cy={180 - (values[i] / max) * 140}
                  r="4"
                  fill="white"
                  stroke="#3468ee"
                  strokeWidth="2"
                />
                <text
                  x={55 + (i * 605) / Math.max(1, values.length - 1)}
                  y="216"
                  textAnchor="middle"
                  fill="#8994a6"
                  fontSize="11"
                >
                  {m.label}
                </text>
              </g>
            ))}
          </svg>
        </Panel>
        <Panel title="Requirement status" subtitle="A clear view of your pipeline">
          <div className="donut-wrap">
            <div
              className="donut"
              style={{
                background: `conic-gradient(#376cf4 0 ${(requirements.filter((r) => r.status === 'OPEN').length / Math.max(1, requirements.length)) * 100}%,#6da5fa 0 ${(requirements.filter((r) => r.status !== 'CLOSED').length / Math.max(1, requirements.length)) * 100}%,#d9e5ff 0)`,
              }}
            >
              <div>
                <strong>{requirements.length}</strong>
                <span>Total requirements</span>
              </div>
            </div>
          </div>
          <div className="donut-legend">
            {[
              ['OPEN', 'Open for bids', '#376cf4'],
              ['AWARDED', 'Awarded', '#6da5fa'],
              ['CLOSED', 'Closed', '#d9e5ff'],
            ].map(([s, l, c]) => (
              <div key={s}>
                <span>
                  <i style={{ background: c }} />
                  {l}
                </span>
                <strong>
                  {requirements
                    .filter((r) => r.status === s)
                    .length.toString()
                    .padStart(2, '0')}
                </strong>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="dashboard-bottom">
        <Panel
          title={role === 'admin' ? 'Verification queue' : 'Recent requirements'}
          subtitle={
            role === 'admin'
              ? 'Help qualified partners get started'
              : 'Your latest sourcing activity, all in one place'
          }
          action={
            <Link
              className="text-link"
              to={root + (role === 'admin' ? '/verification' : '/requirements')}
            >
              View all <Icon name="arrow" size={15} />
            </Link>
          }
        >
          {role === 'admin' ? (
            <div className="compact-list">
              {data.manufacturers
                .filter((m) => m.status === 'PENDING')
                .map((m) => (
                  <Link key={m.id} to={root + '/verification/' + m.id}>
                    <span className="product-icon">
                      <Icon name="shield" />
                    </span>
                    <div>
                      <strong>{m.name}</strong>
                      <small>{m.certificate || 'Awaiting certificate'}</small>
                    </div>
                    <Badge>{m.status}</Badge>
                  </Link>
                ))}
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>PRODUCT / REQUIREMENT</th>
                    <th>QUANTITY</th>
                    <th>STATUS</th>
                    <th>BIDS</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {requirements.slice(0, 4).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link className="product-cell" to={root + '/requirements/' + r.id}>
                          <span className="product-icon">
                            <Icon name="box" />
                          </span>
                          <span>
                            <strong>{r.product}</strong>
                            <small>
                              #
                              {r.id
                                .slice(0, 8)
                                .toUpperCase()
                                .replace(/^R(\d)/, 'REQ-00$1')}{' '}
                              · {r.category}
                            </small>
                          </span>
                        </Link>
                      </td>
                      <td>
                        {r.quantity.toLocaleString()} <small>units</small>
                      </td>
                      <td>
                        <Badge>{r.status}</Badge>
                      </td>
                      <td>
                        {data.bids
                          .filter((b) => b.requirement === r.id)
                          .length.toString()
                          .padStart(2, '0')}
                      </td>
                      <td>
                        <Link
                          className="row-arrow"
                          to={root + '/requirements/' + r.id}
                          aria-label={'View ' + r.product}
                        >
                          <Icon name="arrow" size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!requirements.length && <Empty />}
            </div>
          )}
        </Panel>
        <Panel title="Quick actions" subtitle="Keep things moving">
          <div className="quick-actions">
            {(role === 'company'
              ? [
                  [
                    'Post a requirement',
                    'Find the right manufacturing partner',
                    'plus',
                    '/post-requirement',
                  ],
                  ['Compare bids', 'Make an informed sourcing decision', 'chart', '/comparison'],
                  ['Track your orders', 'Follow every milestone', 'box', '/orders'],
                ]
              : role === 'manufacturer'
                ? [
                    [
                      'Find requirements',
                      'Discover your next opportunity',
                      'search',
                      '/requirements',
                    ],
                    [
                      'Manage certificates',
                      'Keep your credentials current',
                      'shield',
                      '/certificates',
                    ],
                    ['Track your orders', 'Update production and shipping', 'box', '/orders'],
                  ]
                : [
                    ['Review manufacturers', 'Build a trusted network', 'shield', '/verification'],
                    ['Resolve disputes', 'Review SLA and order evidence', 'chat', '/disputes'],
                    ['Manage chatbot', 'Keep assistance up to date', 'box', '/rules'],
                  ]
            ).map(([t, s, icon, path]) => (
              <Link key={t} to={root + path}>
                <span className="quick-icon">
                  <Icon name={icon} />
                </span>
                <div>
                  <strong>{t}</strong>
                  <small>{s}</small>
                </div>
                <Icon name="arrow" size={16} />
              </Link>
            ))}
          </div>
          <div className="help-note">
            <Icon name="chat" />
            <p>
              <strong>A little help goes a long way.</strong>
              <small>Ask our assistant about your next step.</small>
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
