const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionsRouter = require('./routes/transactions');
const fundingRouter = require('./routes/funding');
const profileRoutes = require('./routes/profile');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow all origins dynamically to prevent Vercel preview/production domain mismatches
    callback(null, true);
  }, 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionsRouter);
app.use('/api/funding', fundingRouter);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.use(errorHandler);

module.exports = app;