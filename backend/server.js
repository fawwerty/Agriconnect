import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import './db.js'; // initializes + seeds the database on first run

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import farmersRoutes from './routes/farmers.js';
import listingsRoutes from './routes/listings.js';
import ordersRoutes from './routes/orders.js';
import paymentsRoutes from './routes/payments.js';
import transportRoutes from './routes/transport.js';
import marketpricesRoutes from './routes/marketprices.js';
import messagesRoutes from './routes/messages.js';
import notificationsRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import reviewsRoutes from './routes/reviews.js';
import walletRoutes from './routes/wallet.js';
import bulkpoolsRoutes from './routes/bulkpools.js';
import advisoriesRoutes from './routes/advisories.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
// Serve uploaded product images publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/api/health', (req, res) => res.json({ ok: true, name: 'AgriConnect Ghana API' }));

app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmersRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/market-prices', marketpricesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/bulk-pools', bulkpoolsRoutes);
app.use('/api/advisories', advisoriesRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`AgriConnect Ghana API running on http://localhost:${PORT}`));
