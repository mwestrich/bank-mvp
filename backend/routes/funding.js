const express = require('express');
const prisma = require('../db/prisma');
const auth = require('../middleware/auth');
const { addFundingSourceSchema } = require('../services/validationSchemas');

const router = express.Router();

// Get all funding sources for the current user
router.get('/', auth, async (req, res, next) => {
  try {
    const fundingSources = await prisma.fundingSource.findMany({
      where: { user_id: req.userId },
      select: { id: true, bank_name: true, account_last4: true, created_at: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(fundingSources);
  } catch (err) {
    next(err);
  }
});

// Add a new funding source
router.post('/', auth, async (req, res, next) => {
  const { error, value } = addFundingSourceSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { bankName, accountNumber } = value;
  const last4 = accountNumber.slice(-4).padStart(4, '*'); // Just in case it's shorter than 4, though validation says min 4

  try {
    const source = await prisma.fundingSource.create({
      data: {
        user_id: req.userId,
        bank_name: bankName,
        account_last4: last4
      },
      select: { id: true, bank_name: true, account_last4: true, created_at: true }
    });
    res.status(201).json(source);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
