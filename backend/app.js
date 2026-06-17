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
    // Allow local development ports and production URL
    const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173'].filter(Boolean);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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