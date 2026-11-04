export const money = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
export const date = (value) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const today = () => new Date().toISOString().slice(0, 10);
// Integer paisa keep payment arithmetic stable. Scoring uses ordinary numeric ratios.
export function penalty(order, now = new Date()) {
  if (order.settlementPenalty) return order.settlementPenalty;
  const end = ['DELIVERED', 'COMPLETED'].includes(order.status)
    ? new Date(order.history.find((h) => h.status === 'DELIVERED')?.at || order.due)
    : now;
  const late =
    order.status === 'CANCELLED'
      ? 0
      : Math.max(0, Math.ceil((end - new Date(order.due + 'T23:59:59')) / 86400000));
  return {
    late,
    amount:
      Math.round(Math.round(order.price * 100) * Math.min(0.1, Math.ceil(late / 7) * 0.02)) / 100,
  };
}
// Simple additive weighting: lower costs are better, higher ratings are better.
export function rankBids(bids, manufacturers) {
  if (!bids.length) return [];
  const minPrice = Math.min(...bids.map((b) => b.price)),
    minDays = Math.min(...bids.map((b) => b.days));
  return bids
    .map((b) => {
      const manufacturer = manufacturers.find((m) => m.id === b.manufacturer);
      const priceScore = (minPrice / b.price) * 100,
        deliveryScore = (minDays / b.days) * 100,
        ratingScore = ((manufacturer.rating ?? 2.5) / 5) * 100;
      return {
        ...b,
        priceScore,
        deliveryScore,
        ratingScore,
        score: priceScore * 0.4 + deliveryScore * 0.35 + ratingScore * 0.25,
      };
    })
    .sort((a, b) => b.score - a.score || a.created.localeCompare(b.created));
}
// Freeze component scores at closure; later reviews affect only future bidding.
export function closeRequirement(data, id) {
  const ranked = rankBids(
    data.bids.filter((b) => b.requirement === id),
    data.manufacturers,
  );
  return {
    ...data,
    requirements: data.requirements.map((r) => (r.id === id ? { ...r, status: 'CLOSED' } : r)),
    bids: data.bids.map((b) => ranked.find((r) => r.id === b.id) || b),
  };
}
export function expireRequirements(data) {
  return data.requirements
    .filter((r) => r.status === 'OPEN' && new Date(r.deadline) <= new Date())
    .reduce((d, r) => closeRequirement(d, r.id), data);
}
export const nextStatus = {
  AWARDED: 'IN_PRODUCTION',
  IN_PRODUCTION: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};
export function canTransition(role, status) {
  return (
    (role === 'manufacturer' && ['AWARDED', 'IN_PRODUCTION'].includes(status)) ||
    (role === 'company' && status === 'SHIPPED')
  );
}

// The rule with the most matching keywords wins; equal matches use library order.
export function chatbotReply(message, rules) {
  let bestRule = null;
  let bestHits = 0;
  for (const rule of rules) {
    const hits = rule.keywords
      .split(',')
      .filter(
        (keyword) => keyword.trim() && message.toLowerCase().includes(keyword.trim().toLowerCase()),
      ).length;
    if (hits > bestHits) {
      bestRule = rule;
      bestHits = hits;
    }
  }
  return (
    bestRule?.response ||
    'Try asking about verification, bidding, scoring, orders, ratings, disputes or escrow.'
  );
}
