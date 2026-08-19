const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const products = require('./data/products');

const app = express();
const orders = [];
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/products', (req, res) => {
  const category = req.query.category;
  const search = (req.query.search || '').toLowerCase();
  const filtered = products.filter(p => (!category || category === 'All' || p.category === category) && (!search || `${p.name} ${p.description}`.toLowerCase().includes(search)));
  res.json(filtered);
});
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});
app.post('/api/orders', (req, res) => {
  const { customer, items } = req.body;
  if (!customer || !customer.name || !customer.email || !customer.address || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Name, email, address and at least one item are required.' });
  const lineItems = items.map(item => { const product = products.find(p => p.id === item.id); if (!product) throw new Error('Invalid product'); return { ...item, name: product.name, unitPrice: product.price, lineTotal: product.price * item.quantity }; });
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const order = { id: `BB-${Date.now().toString().slice(-6)}`, customer, items: lineItems, subtotal, tax: subtotal * 0.08, total: subtotal * 1.08, createdAt: new Date().toISOString() };
  orders.push(order);
  res.status(201).json(order);
});
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => res.status(500).json({ error: err.message || 'Server error' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Brew & Bloom API running on port ${PORT}`));
