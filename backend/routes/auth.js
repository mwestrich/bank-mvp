const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');
const { registerSchema, loginSchema } = require('../services/validationSchemas');
const { generateAndSendOTP, verifyOTP } = require('../services/otpService');
const router = express.Router();

// Register: step 1 – create user, send OTP
router.post('/register', async (req, res, next) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { email, full_name, password } = value;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          full_name,
          password_hash: hashed,
          is_verified: false,
        },
      });

      await tx.account.create({
        data: {
          user_id: user.id,
          account_number: accountNumber,
          balance: 0.00,
        },
      });
    });

    await generateAndSendOTP(email);
    res.status(201).json({ message: 'User created. OTP sent to email.' });
  } catch (err) {
    next(err);
  }
});

// Verify OTP and activate account
router.post('/verify-otp', async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  const isValid = await verifyOTP(email, otp);
  if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP' });

  await prisma.user.update({
    where: { email },
    data: { is_verified: true },
  });
  res.json({ message: 'Account verified. You can now log in.' });
});

// Login
router.post('/login', async (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { email, password } = value;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, full_name: true, password_hash: true, is_verified: true },
  });
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // if (!user.is_verified) {
  //   return res.status(401).json({ error: 'Please verify your email with OTP first' });
  // }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

  res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
});

module.exports = router;