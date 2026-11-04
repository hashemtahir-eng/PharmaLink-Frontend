# Verification record

## Automated checks

- `npm test`: 11 tests passed.
- `npm run build`: successful Vite production build.
- All implementation files are `.jsx`, `.js`, `.css`, HTML or project documentation/configuration. No backend files or API integration.

## Browser walkthroughs completed

- Standard email/password login, role demo login, logout, manufacturer registration.
- Company posts a requirement with quantity, specifications and future deadline.
- Manufacturer submits a structured offer; My bids shows its saved price and sealed status.
- Company sees sealed bid count, closes bidding, and sees frozen component scores.
- Recommendation shows the documented 92.3 / 85.4 / 80.8 example and the single-bid normalization case.
- Award creates an order with held simulated escrow.
- Manufacturer starts production and marks shipment; company confirms receipt.
- Company submits a review; order becomes Completed and simulated escrow Released.
- Unverified manufacturer cannot bid.
- Certificate selection, PDF saving, preview/download link, and Pending status.
- Administrator approval updates verification; rejection without a reason displays validation.
- Administrator reviews overdue order evidence and resolves the dispute for the buyer; full simulated refund and cancellation appear.
- Administrator edits a chatbot rule; the assistant immediately uses the edited scoring response.
- Navbar search filters requirements; profile contact information saves.
- Phone viewport at 390 × 844: dashboard cards, collapsed sidebar, navigation selection and single-column profile form.

## Practical limits

This is a browser-local frontend simulation. Certificates have a 2 MB demo limit. No real authentication, financial transaction, live shipment data or external storage exists. Automated algorithm checks and the workflows above were tested; this is not an exhaustive cross-browser or accessibility audit.
