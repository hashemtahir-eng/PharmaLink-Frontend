# PharmaLink — frontend demo

A complete React frontend for a pharmaceutical B2B bidding and recommendation project. Built with React, React Router, plain CSS and JavaScript. Vite is the development/build tool. No backend, database, Python, APIs, JWT, UI framework or payment service is included.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. For a production bundle run `npm run build`; `npm run preview` serves the result. A static host must send unknown paths to `index.html` because React Router uses browser routing.

## Demo accounts

Use the three one-click buttons on Login, or enter these credentials. All use `Demo123!`.

| Role          | Email                        |
| ------------- | ---------------------------- |
| Company       | company@pharmalink.demo      |
| Manufacturer  | manufacturer@pharmalink.demo |
| Administrator | admin@pharmalink.demo        |

Company and manufacturer registration is available. A new manufacturer starts Pending and uploads certificates in its workspace. Administrators cannot self-register.

## Project map

- `src/components`: icons, cards, badges, forms, simulation banner, chatbot.
- `src/pages`: routed screens. Requirements covers posting, detail, bid submission, comparison and bid outcomes. Orders covers tracking, escrow, SLA and ratings. Verification covers certificate uploads and administration. Disputes covers filing, evidence and resolution. Settings covers profiles and chatbot rules.
- `src/styles/global.css`: design tokens, layout, component styles and responsive breakpoints.
- `src/context/DataContext.jsx`: current user, shared records, localStorage persistence and toast feedback.
- `src/mockData/seed.js`: realistic starting records and 20 editable chatbot rules.
- `src/mockData/logic.js`: scoring, deadline closure, currency/date formatting, SLA and order permissions.
- `src/assets`: place future static brand assets here. Current illustrations are CSS and icons are inline SVG.
- `tests/logic.test.js`: algorithm, deadline, SLA and role-transition checks. Run `npm test`.

## Nine implemented demo modules

1. Authentication: login, registration, logout, persistent session, role redirection.
2. Structured bidding: requirements, validated fixed-field offers, verification gate, one bid per manufacturer, sealed offers, deadline closure.
3. Recommendation: price 40%, delivery 35%, rating 25%; normalized component scores, 2.5/5 cold start, earliest submission tie break. Scores freeze when bidding closes. Only the top ranked offer can be awarded.
4. Verification: selected file feedback, PDF/image preview, download, pending/verified/rejected status, mandatory rejection reason, resubmission.
5. Ratings: one review per delivered order; weighted update of seeded rating history; completion and escrow settlement.
6. Orders: award, production, shipping, company receipt, completion; timestamped activity; company cancellation before shipping.
7. SLA and disputes: 2% per started late week capped at 10%, frozen at delivery; party-owned cases; administrator review and resolution with SLA/history evidence.
8. Escrow: simulated held, released and refunded states; no real funds. Company-favour resolution cancels the order and refunds the full value. Manufacturer-favour resolution releases the amount after penalty.
9. Chatbot: keyword-hit matching, fallback replies, suggested questions and administrator rule create/edit/delete.

## Suggested presentation walkthrough

1. Sign in as Company. Open Amoxicillin 250mg from Bid comparison. NovaMed scores 92.3 despite having the highest price. Award the bid and inspect the created order.
2. Sign out, enter Manufacturer. In Orders, open that order, Start production, then Mark shipped.
3. Sign in as Company. Confirm receipt, submit a rating, observe Completed and Released, then inspect the manufacturer rating.
4. Register a sample manufacturer. Upload a PDF/JPG/PNG, then sign in as Administrator and review the certificate. Reject with feedback or approve to unlock bidding. Sign back into that registered account to submit an offer.
5. As Company, post a new requirement with a future deadline. Manufacturer submits a bid. Company sees only its count until Close bidding & rank.
6. Open the seeded overdue order PL-2048. The initial dispute demonstrates administrator mediation and simulated settlement.
7. Edit a chatbot rule as Administrator and test its keyword in the floating assistant.

## Persistence and demo limitations

All users, demo passwords and records are stored in this browser under `pharmalink-demo-v1`; the session uses `pharmalink-session`. This is a frontend simulation, not secure authentication. Use sample data. Roles and ownership are enforced for the demonstration UI, and must be enforced again by a future backend. No network calls are made by application code.

Certificates are stored as data URLs so they survive refresh. Files are limited to **2 MB**, below the document's suggested 5 MB, because localStorage has a small browser quota. A storage failure displays an error and does not report a successful save. Seeded certificate records are clearly labelled sample documents. Keep real confidential documents out of the demo.

Data is shared by roles in the same browser origin. Sign out and sign in as another role to demonstrate the complete workflow. Separate browsers or ports have separate data. Deadlines are checked each second while the app is open and when reopening it. There is no background processing while the app is closed.

For a fresh demo, remove only `pharmalink-demo-v1` and `pharmalink-session` from this site's browser storage and reload. Export any records you need first; resetting demo storage removes your local changes.

## Future integration

Keep page components and their forms. Replace the context's local data operations with a separately designed API client later. The attached design's Django, database, token, server and Phase-I placeholder instructions were intentionally superseded by the frontend-only request. No backend scaffolding is present.
