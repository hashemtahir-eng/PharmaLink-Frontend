import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rankBids,
  closeRequirement,
  penalty,
  canTransition,
  expireRequirements,
} from '../src/mockData/logic.js';
const manufacturers = [
  { id: 'a', rating: 3.5 },
  { id: 'b', rating: 4.8 },
  { id: 'c', rating: 4.2 },
];
const bids = [
  { id: '1', manufacturer: 'a', requirement: 'r', price: 100000, days: 30, created: '2026-01-01' },
  { id: '2', manufacturer: 'b', requirement: 'r', price: 120000, days: 20, created: '2026-01-02' },
  { id: '3', manufacturer: 'c', requirement: 'r', price: 110000, days: 25, created: '2026-01-03' },
];
test('weighted recommendation rewards speed and rating over lowest price', () => {
  const ranked = rankBids(bids, manufacturers);
  assert.equal(ranked[0].id, '2');
  assert.ok(Math.abs(ranked[0].score - 92.333333) < 0.001);
  assert.equal(ranked[2].id, '1');
});
test('cold start uses 2.5 and a single offer gets full cost scores', () => {
  const [b] = rankBids([bids[0]], [{ id: 'a', rating: null }]);
  assert.equal(b.priceScore, 100);
  assert.equal(b.deliveryScore, 100);
  assert.equal(b.ratingScore, 50);
  assert.equal(b.score, 87.5);
});
test('equal scores favour earliest submission', () => {
  const same = bids.map((b) => ({ ...b, price: 100, days: 10 }));
  const result = rankBids(
    same,
    manufacturers.map((m) => ({ ...m, rating: 4 })),
  );
  assert.equal(result[0].id, '1');
});
test('closing stores score snapshot independent of subsequent rating changes', () => {
  const data = { requirements: [{ id: 'r', status: 'OPEN' }], bids, manufacturers };
  const closed = closeRequirement(data, 'r');
  assert.equal(closed.requirements[0].status, 'CLOSED');
  const original = closed.bids[0].score;
  closed.manufacturers[0].rating = 5;
  assert.equal(closed.bids[0].score, original);
});
test('expired requirement closes without bids', () => {
  const result = expireRequirements({
    requirements: [{ id: 'r', status: 'OPEN', deadline: '2000-01-01' }],
    bids: [],
    manufacturers: [],
  });
  assert.equal(result.requirements[0].status, 'CLOSED');
});
test('SLA started-week penalty and cap use integer paisa', () => {
  const order = { price: 100000, due: '2026-01-01', status: 'IN_PRODUCTION', history: [] };
  assert.equal(penalty(order, new Date('2026-01-02T23:59:59')).amount, 2000);
  assert.equal(penalty(order, new Date('2026-01-09T23:59:59')).amount, 4000);
  assert.equal(penalty(order, new Date('2026-03-01')).amount, 10000);
});
test('delivery freezes SLA and cancellation has no penalty', () => {
  const order = {
    price: 100000,
    due: '2026-01-01',
    status: 'DELIVERED',
    history: [{ status: 'DELIVERED', at: '2026-01-04' }],
  };
  assert.equal(penalty(order, new Date('2027-01-01')).amount, 2000);
  assert.equal(penalty({ ...order, status: 'CANCELLED' }).amount, 0);
});
test('order actions are restricted to the correct role and milestone', () => {
  assert.ok(canTransition('manufacturer', 'AWARDED'));
  assert.ok(canTransition('manufacturer', 'IN_PRODUCTION'));
  assert.ok(canTransition('company', 'SHIPPED'));
  assert.equal(canTransition('company', 'AWARDED'), false);
  assert.equal(canTransition('admin', 'SHIPPED'), false);
  assert.equal(canTransition('manufacturer', 'COMPLETED'), false);
});

test('settled disputes retain their recorded penalty', () => {
  const stored = { late: 11, amount: 5800 };
  assert.deepEqual(
    penalty({ status: 'CANCELLED', settlementPenalty: stored }, new Date('2030-01-01')),
    stored,
  );
});

import { chatbotReply, money } from '../src/mockData/logic.js';
import { seedData } from '../src/mockData/seed.js';
test('seeded chatbot resolves scoring question and has a fallback', () => {
  const data = seedData();
  assert.match(chatbotReply('How are bids scored?', data.rules), /40% price/);
  assert.match(chatbotReply('Escrow payments', data.rules), /simulation/);
  assert.match(chatbotReply('unrecognized xyz', data.rules), /Try asking/);
  assert.equal(
    chatbotReply('customword', [{ keywords: 'customword', response: 'Saved custom reply' }]),
    'Saved custom reply',
  );
});
test('currency retains fractional bid amounts', () => {
  assert.match(money(0.01), /0\.01/);
});
