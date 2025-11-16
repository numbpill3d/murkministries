import 'dotenv/config';
const { type, participant_a, participant_b, email, timezone, date_requested, notes } = req.body;
if (!participant_a || !email || !timezone) return res.status(400).json({ error: 'Missing required fields' });


const normalized = normalizeType(type);
const free = isFreeType(normalized);
const id = uuidv4();
const now = new Date().toISOString();


db.prepare(`INSERT INTO ceremonies (id, created_at, type, participant_a, participant_b, email, timezone, date_requested, is_free, status, notes)
VALUES (@id, @created_at, @type, @participant_a, @participant_b, @email, @timezone, @date_requested, @is_free, @status, @notes)`)
.run({ id, created_at: now, type: normalized, participant_a, participant_b: participant_b || null, email, timezone, date_requested: date_requested || null, is_free: free ? 1 : 0, status: free ? 'confirmed' : 'pending-payment', notes: notes || null });


if (free) {
const link = `${process.env.SITE_URL}/certificate.html?ceremony=${id}`;
await sendConfirmationEmail({ to: email, ceremony: { id, type: normalized, participant_a, participant_b, date_requested }, link });
return res.json({ id, status: 'confirmed', free: true, certificate_url: link });
}


// Paid path: create Stripe Checkout session
const session = await stripe.checkout.sessions.create({
mode: 'payment',
payment_method_types: ['card'],
line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
success_url: `${process.env.SITE_URL}/success.html?sid={CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.SITE_URL}/cancel.html`,
metadata: { ceremony_id: id, type: normalized, participant_a, participant_b: participant_b || '' }
});


db.prepare('UPDATE ceremonies SET stripe_session_id = ?, status = ? WHERE id = ?').run(session.id, 'awaiting-payment', id);


const link = `${process.env.SITE_URL}/success.html?sid=${session.id}`;
await sendConfirmationEmail({ to: email, ceremony: { id, type: normalized, participant_a, participant_b, date_requested }, link });
return res.json({ id, free: false, checkout_url: session.url });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Server error' });
}
});


// Stripe webhook
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
const sig = req.headers['stripe-signature'];
let event;
try {
event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
} catch (err) {
console.error('Webhook error', err.message);
return res.status(400).send(`Webhook Error: ${err.message}`);
}


if (event.type === 'checkout.session.completed') {
const session = event.data.object;
const id = session.metadata?.ceremony_id;
if (id) db.prepare('UPDATE ceremonies SET status = ? WHERE id = ?').run('confirmed', id);
}


res.json({ received: true });
});


// Fetch ceremony for certificate rendering
app.get('/api/ceremonies/:id', (req, res) => {
const row = db.prepare('SELECT * FROM ceremonies WHERE id = ?').get(req.params.id);
if (!row) return res.status(404).json({ error: 'Not found' });
res.json(row);
});


// Static fallback
app.get('*', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`Murk Solace portal on :${port}`));
