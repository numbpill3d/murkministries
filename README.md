# Murk Solace — Online Marriage Portal


## Quick start
1. `cp .env.example .env` and fill values.
2. `npm install`
3. `npm run dev`
4. Open `http://localhost:8080`.


## Stripe
- Create a Product and a Price in Stripe. Put the `price_xxx` into `STRIPE_PRICE_ID`.
- Add a webhook endpoint: `https://your-domain/api/stripe/webhook` with events `checkout.session.completed`.


## Free path
- Selecting "Fictional Character" creates a confirmed ceremony and redirects to a printable certificate page.


## Data
- SQLite at `db.sqlite`. Table `ceremonies` stores submissions and status.


## Email
- SMTP creds in `.env`. Confirmation emails are sent on request.


## Deployment
- Use Railway, Render, or Fly.io. Set environment vars. Use HTTPS. Configure Stripe webhook.


## Legal
- These are ceremonial unions. Jurisdictional legal recognition may require filing. The site copy states this.
