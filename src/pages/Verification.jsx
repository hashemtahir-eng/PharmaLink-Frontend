import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Panel, Badge, Field, Icon, Empty } from '../components/UI';
import { Heading } from './Requirements';
export default function Verification({ certificates = false }) {
  const { data, user, update, notify } = useData();
  const pathId = useLocation().pathname.split('/')[3];
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const root = '/' + user.role;
  const manufacturer = data.manufacturers.find(
    (m) => m.id === (user.role === 'manufacturer' ? user.id : pathId),
  );
  // FileReader keeps a small certificate as a data URL for refresh-safe demo preview.
  async function upload(e) {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const file = form.elements.certificate.files[0];
    const type = form.elements.certificateType.value;
    if (!file) return setError('Select a certificate.');
    if (!/\.(pdf|png|jpe?g)$/i.test(file.name)) return setError('Select a PDF, JPG or PNG file.');
    if (file.size > 2 * 1024 * 1024) return setError('This browser demo accepts files up to 2 MB.');
    setUploading(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setError('The file could not be read.');
      setUploading(false);
    };
    reader.onload = () => {
      if (
        update({
          ...data,
          manufacturers: data.manufacturers.map((m) =>
            m.id === user.id
              ? {
                  ...m,
                  certificate: file.name,
                  certificateData: reader.result,
                  certificateType: type,
                  status: 'PENDING',
                  reason: '',
                }
              : m,
          ),
        })
      ) {
        notify('Certificate uploaded and sent for review.');
        form.reset();
        setSelectedFile('');
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }
  function decide(status) {
    if (manufacturer.status !== 'PENDING') return;
    if (!manufacturer.certificate)
      return setError('A certificate is required before making a decision.');
    if (status === 'REJECTED' && !reason.trim())
      return setError('Please provide a rejection reason.');
    if (
      update({
        ...data,
        manufacturers: data.manufacturers.map((m) =>
          m.id === manufacturer.id
            ? { ...m, status, reason: status === 'REJECTED' ? reason.trim() : '' }
            : m,
        ),
      })
    ) {
      notify(
        status === 'VERIFIED'
          ? 'Manufacturer approved. Bidding is now unlocked.'
          : 'Manufacturer rejected with feedback.',
      );
      navigate(root + '/verification');
    }
  }
  function certificateView(m) {
    return (
      <div className="certificate-preview">
        {m.certificateData ? (
          m.certificateData.startsWith('data:application/pdf') ? (
            <object data={m.certificateData} type="application/pdf" width="100%" height="420">
              <a href={m.certificateData} download={m.certificate}>
                Download certificate
              </a>
            </object>
          ) : (
            <img src={m.certificateData} alt={m.certificate} />
          )
        ) : (
          <div className="sample-certificate">
            <Icon name="shield" size={42} />
            <span>PHARMALINK DEMO DOCUMENT</span>
            <h2>{m.certificateType || 'GMP'} Certification</h2>
            <p>{m.name}</p>
            <strong>{m.certificate || 'No certificate submitted'}</strong>
            <small>Seeded sample record · Upload a file to preview a real document.</small>
          </div>
        )}
        {m.certificateData && (
          <a className="button" href={m.certificateData} download={m.certificate}>
            <Icon name="file" size={16} /> Download {m.certificate}
          </a>
        )}
      </div>
    );
  }
  if (user.role === 'company')
    return (
      <>
        <Heading
          title="A network built on trust"
          text="Only verified manufacturers can submit bids on your requirements."
        />
        <div className="manufacturer-grid">
          {data.manufacturers
            .filter((m) => m.status === 'VERIFIED')
            .map((m) => (
              <Panel key={m.id}>
                <span className="profile-emblem">
                  <Icon name="shield" size={27} />
                </span>
                <h2>{m.name}</h2>
                <Badge>{m.status}</Badge>
                <p className="muted">{m.certificate}</p>
                <strong className="stars">★ {m.rating?.toFixed(1) || 'New'}</strong>
                <small className="muted"> · {m.ratingCount} ratings</small>
              </Panel>
            ))}
        </div>
      </>
    );
  if (manufacturer)
    return (
      <>
        <Link
          className="back-link"
          to={root + (user.role === 'admin' ? '/verification' : '/dashboard')}
        >
          ← Back to {user.role === 'admin' ? 'verification queue' : 'overview'}
        </Link>
        <Heading
          title={
            user.role === 'admin'
              ? manufacturer.name
              : certificates
                ? 'Upload certificates'
                : 'Verification center'
          }
          text="Quality credentials are the foundation of every trusted partnership."
          action={<Badge>{manufacturer.status}</Badge>}
        />
        <div className="detail-grid">
          <Panel title="Verification status">
            <div className="verification-status">
              <span className="profile-emblem">
                <Icon name="shield" size={32} />
              </span>
              <h2>
                {manufacturer.status === 'VERIFIED'
                  ? 'You’re a verified partner'
                  : manufacturer.status === 'PENDING'
                    ? 'Awaiting administrator review'
                    : 'Updated certificate required'}
              </h2>
              <p>
                {manufacturer.status === 'VERIFIED'
                  ? 'This manufacturer can submit bids and participate in procurement.'
                  : 'Bidding stays locked until a valid certificate is approved.'}
              </p>
              {manufacturer.reason && <div className="notice">{manufacturer.reason}</div>}
              <div className="detail-pairs">
                <div>
                  <small>Document type</small>
                  <strong>{manufacturer.certificateType || 'Not submitted'}</strong>
                </div>
                <div>
                  <small>Rating</small>
                  <strong>{manufacturer.rating?.toFixed(1) || '2.5 (new partner)'} / 5</strong>
                </div>
              </div>
            </div>
          </Panel>
          <Panel title="Submitted certificate">{certificateView(manufacturer)}</Panel>
        </div>
        {user.role === 'manufacturer' ? (
          <Panel
            title="Submit a certificate"
            subtitle="PDF, JPG or PNG · Maximum 2 MB for this local browser demo"
            className="form-panel"
          >
            <form onSubmit={upload} className="form-grid">
              <Field label="Certification type">
                <select name="certificateType" required>
                  <option>GMP</option>
                  <option>DRAP</option>
                  <option>ISO</option>
                </select>
              </Field>
              <Field label="Certificate file">
                <input
                  name="certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  onChange={(e) => setSelectedFile(e.target.files[0]?.name || '')}
                />
              </Field>
              {selectedFile && <p className="notice">Selected: {selectedFile}</p>}
              <p className="form-info">
                A new upload resets your status to Pending. An administrator must approve it before
                you can bid again.
              </p>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <button className="button primary" disabled={uploading}>
                  <Icon name="upload" size={17} />
                  {uploading ? 'Saving certificate…' : 'Upload & submit for review'}
                </button>
              </div>
            </form>
          </Panel>
        ) : (
          manufacturer.status === 'PENDING' && (
            <Panel title="Review decision">
              <Field label="Rejection feedback (required when rejecting)">
                <textarea
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={1000}
                  placeholder="Explain what needs to be corrected…"
                />
              </Field>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <button className="button danger" onClick={() => decide('REJECTED')}>
                  Reject manufacturer
                </button>
                <button className="button primary" onClick={() => decide('VERIFIED')}>
                  Approve manufacturer <Icon name="check" size={17} />
                </button>
              </div>
            </Panel>
          )
        )}
      </>
    );
  if (pathId) return <Empty text="Manufacturer not found." />;
  const list = data.manufacturers.filter(
    (m) =>
      (filter === 'ALL' || m.status === filter) &&
      m.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        title={certificates ? 'Certificate review' : 'Manufacturer verification'}
        text="Review credentials, share clear feedback and build a trusted network."
      />
      <Panel>
        <div className="toolbar">
          <div className="tabs">
            {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((s) => (
              <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
                {s.toLowerCase()}
              </button>
            ))}
          </div>
          <div className="search-input">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search manufacturers…"
              aria-label="Search manufacturers"
            />
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>MANUFACTURER</th>
                <th>CERTIFICATE</th>
                <th>RATING</th>
                <th>STATUS</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong>
                  </td>
                  <td>{m.certificate || 'Not submitted'}</td>
                  <td>★ {m.rating?.toFixed(1) || 'New'}</td>
                  <td>
                    <Badge>{m.status}</Badge>
                  </td>
                  <td>
                    <Link className="text-link" to={root + '/verification/' + m.id}>
                      Review <Icon name="arrow" size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <Empty text="No manufacturers match this view." />}
        </div>
      </Panel>
    </>
  );
}
