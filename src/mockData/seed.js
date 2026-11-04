import { closeRequirement } from './logic.js';
const future = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 16);
const past = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
export function seedData() {
  const manufacturers = [
    {
      id: 'm1',
      name: 'NovaMed Laboratories',
      status: 'VERIFIED',
      rating: 4.8,
      ratingCount: 24,
      phone: '+92 42 3512 8888',
      address: 'Sundar Industrial Estate, Lahore',
      certificate: 'GMP • DRAP licence',
      certificateType: 'GMP',
      reason: '',
    },
    {
      id: 'm2',
      name: 'Getz Healthcare',
      status: 'VERIFIED',
      rating: 4.2,
      ratingCount: 18,
      certificate: 'ISO 9001 certificate',
      certificateType: 'ISO',
    },
    {
      id: 'm3',
      name: 'Searle Pharmaceuticals',
      status: 'VERIFIED',
      rating: 3.5,
      ratingCount: 12,
      certificate: 'GMP certificate',
      certificateType: 'GMP',
    },
    {
      id: 'm4',
      name: 'CureWell Pharma',
      status: 'PENDING',
      rating: null,
      ratingCount: 0,
      certificate: 'DRAP-2026.pdf',
      certificateType: 'DRAP',
    },
    {
      id: 'm5',
      name: 'Apex Biologics',
      status: 'REJECTED',
      rating: null,
      ratingCount: 0,
      certificate: 'ISO-2023.pdf',
      certificateType: 'ISO',
      reason: 'Certificate has expired. Please upload a valid copy.',
    },
  ];
  const users = [
    {
      id: 'c1',
      name: 'Haris Tahir',
      organization: 'HealthBridge Pharma',
      email: 'company@pharmalink.demo',
      password: 'Demo123!',
      role: 'company',
      phone: '+92 300 1234567',
      address: 'Gulberg III, Lahore',
    },
    {
      id: 'm1',
      name: 'Ayesha Malik',
      organization: manufacturers[0].name,
      email: 'manufacturer@pharmalink.demo',
      password: 'Demo123!',
      role: 'manufacturer',
    },
    {
      id: 'a1',
      name: 'Sarah Ahmed',
      organization: 'PharmaLink',
      email: 'admin@pharmalink.demo',
      password: 'Demo123!',
      role: 'admin',
    },
  ];
  const requirements = [
    {
      id: 'r1',
      company: 'c1',
      product: 'Paracetamol 500mg',
      category: 'Tablets',
      quantity: 50000,
      specifications:
        'BP grade. Blister packs of 10 tablets. GMP-certified production and batch analysis required.',
      deadline: future,
      status: 'OPEN',
      created: '2026-11-01',
    },
    {
      id: 'r2',
      company: 'c1',
      product: 'Amoxicillin 250mg',
      category: 'Capsules',
      quantity: 25000,
      specifications:
        'Hard gelatin capsules, BP standard. Include stability report and certificate of analysis.',
      deadline: future,
      status: 'CLOSED',
      created: '2026-10-28',
    },
    {
      id: 'r3',
      company: 'c1',
      product: 'Vitamin D3 2000 IU',
      category: 'Softgels',
      quantity: 100000,
      specifications: 'Shelf life minimum 24 months. Amber bottle packaging.',
      deadline: future,
      status: 'OPEN',
      created: '2026-11-02',
    },
    {
      id: 'r4',
      company: 'c1',
      product: 'Cetirizine 10mg',
      category: 'Tablets',
      quantity: 30000,
      specifications: 'Film-coated tablets with GMP documentation.',
      deadline: future,
      status: 'AWARDED',
      created: '2026-10-20',
    },
  ];
  const bids = [
    {
      id: 'b1',
      requirement: 'r2',
      manufacturer: 'm1',
      price: 120000,
      days: 20,
      certifications: 'GMP, DRAP',
      created: '2026-10-29',
    },
    {
      id: 'b2',
      requirement: 'r2',
      manufacturer: 'm2',
      price: 110000,
      days: 25,
      certifications: 'GMP, ISO',
      created: '2026-10-30',
    },
    {
      id: 'b3',
      requirement: 'r2',
      manufacturer: 'm3',
      price: 100000,
      days: 30,
      certifications: 'GMP',
      created: '2026-10-31',
    },
    {
      id: 'b4',
      requirement: 'r1',
      manufacturer: 'm2',
      price: 180000,
      days: 15,
      certifications: 'GMP',
      created: '2026-11-02',
    },
  ];
  const orders = [
    {
      id: 'PL-2048',
      company: 'c1',
      manufacturer: 'm1',
      product: 'Cetirizine 10mg',
      quantity: 30000,
      price: 145000,
      status: 'IN_PRODUCTION',
      escrow: 'HELD',
      due: past,
      history: [
        { status: 'AWARDED', at: new Date(Date.now() - 30 * 86400000).toISOString() },
        { status: 'IN_PRODUCTION', at: new Date(Date.now() - 28 * 86400000).toISOString() },
      ],
    },
    {
      id: 'PL-2047',
      company: 'c1',
      manufacturer: 'm1',
      product: 'Omeprazole 20mg',
      quantity: 20000,
      price: 96000,
      status: 'DELIVERED',
      escrow: 'HELD',
      due: future.slice(0, 10),
      history: [
        { status: 'AWARDED', at: '2026-10-10T10:00:00Z' },
        { status: 'IN_PRODUCTION', at: '2026-10-11T10:00:00Z' },
        { status: 'SHIPPED', at: '2026-10-25T10:00:00Z' },
        { status: 'DELIVERED', at: new Date().toISOString() },
      ],
    },
  ];
  const topics = [
    [
      'registration,register,account',
      'Choose Create account on the login screen. Select Company or Manufacturer; administrator accounts are provided for the demo.',
    ],
    [
      'verification,verified,approval',
      'Upload a valid GMP, DRAP or ISO certificate. An administrator reviews it before bidding is unlocked.',
    ],
    [
      'bid,bidding,quotation',
      'Open a requirement and enter a total price, delivery days and offered certifications. One bid per manufacturer is allowed.',
    ],
    [
      'score,scored,ranking,recommendation',
      'Bids use 40% price, 35% delivery and 25% rating. Lower price and delivery time score higher. New manufacturers start at 2.5/5.',
    ],
    [
      'escrow,payment,funds',
      'Escrow is a simulation only. Awarding holds the amount; rating releases it after SLA penalties. A buyer-favour dispute refunds it.',
    ],
    [
      'dispute,complaint',
      'Open Disputes to raise a case for one of your orders. An administrator reviews the order timeline and SLA evidence.',
    ],
    [
      'order,tracking,delivery',
      'Orders move from Awarded to In production, Shipped, Delivered and Completed. Manufacturers update production and shipping; buyers confirm receipt.',
    ],
    [
      'requirement,post',
      'Companies can post a product, quantity, specifications and a future bidding deadline from Post requirement.',
    ],
    [
      'rating,review',
      'After delivery the company submits one rating from 1 to 5. This completes the order and updates the manufacturer average.',
    ],
    [
      'late,penalty,sla',
      'The SLA penalty is 2% for each started late week, capped at 10% of the order value.',
    ],
    [
      'certificate,upload',
      'Upload a PDF, JPG or PNG certificate. This demo accepts files up to 2 MB to fit browser storage.',
    ],
    [
      'sealed,close',
      'Bids stay sealed while bidding is open. Close bidding to calculate and freeze the score breakdown.',
    ],
    ['logout,sign out', 'Use Sign out in the sidebar. Saved demo data remains in this browser.'],
    [
      'profile,phone,address',
      'Open Profile to update your name, organization and contact details.',
    ],
    [
      'password,login',
      'Use the role demo buttons on Login, or sign in with your registered demo email and password.',
    ],
    [
      'cancel,cancellation',
      'A company can cancel an awarded or in-production order if no dispute is active. Simulated escrow is refunded.',
    ],
    [
      'refund,refunded',
      'An administrator resolution in favour of the company refunds the full simulated escrow.',
    ],
    [
      'release,released',
      'After rating, the manufacturer receives the simulated order value minus the calculated SLA penalty.',
    ],
    [
      'deadline,expired',
      'Requirements automatically close at the deadline. Closed requirements cannot receive new bids.',
    ],
    [
      'support,help',
      'I can help with registration, verification, bidding, scoring, orders, SLA, disputes and simulated payments.',
    ],
  ];
  let data = {
    users,
    manufacturers,
    requirements,
    bids,
    orders,
    ratings: [],
    disputes: [
      {
        id: 'DSP-1001',
        order: 'PL-2048',
        raisedBy: 'c1',
        category: 'Late delivery',
        description: 'The agreed delivery date has passed. Please review the production delay.',
        status: 'OPEN',
        created: new Date().toISOString(),
      },
    ],
    rules: topics.map((t, i) => ({ id: 'rule' + i, keywords: t[0], response: t[1] })),
  };
  return closeRequirement(data, 'r2');
}
