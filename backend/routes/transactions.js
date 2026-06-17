const express = require('express');
const prisma = require('../db/prisma');
const auth = require('../middleware/auth');
const { transferSchema, depositWithdrawSchema } = require('../services/validationSchemas');
const router = express.Router();

// Internal transfer
router.post('/transfer', auth, async (req, res, next) => {
  const { error, value } = transferSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { fromAccount, toAccount, amount } = value;
  try {
    const risCheck = await prisma.risNotice.findFirst({
      where: { user_id: req.userId, status: 'uncleared' }
    });
    if (risCheck) {
      return res.status(403).json({ error: 'Action blocked: You have an uncleared IRS tax notice. Please clear it to proceed.' });
    }

    await prisma.$transaction(async (tx) => {
      const fromOwner = await tx.account.findFirst({
        where: {
          account_number: fromAccount,
          OR: [{ user_id: req.userId }, { joint_user_id: req.userId }]
        }
      });
      if (!fromOwner) throw new Error('You do not own the source account');
      if (parseFloat(fromOwner.balance) < amount) throw new Error('Insufficient funds');

      const toAcc = await tx.account.findUnique({
        where: { account_number: toAccount }
      });
      if (!toAcc) throw new Error('Destination account not found');

      await tx.account.update({
        where: { account_number: fromAccount },
        data: { balance: { decrement: amount } }
      });

      await tx.account.update({
        where: { account_number: toAccount },
        data: { balance: { increment: amount } }
      });

      await tx.transaction.create({
        data: {
          from_account: fromAccount,
          to_account: toAccount,
          amount,
          type: 'transfer',
          description: `Transfer to ${toAccount}`
        }
      });
    });

    res.json({ success: true, message: 'Transfer completed successfully' });
  } catch (err) {
    if (err.message === 'You do not own the source account' || err.message === 'Destination account not found') {
      return res.status(err.message === 'Destination account not found' ? 404 : 403).json({ error: err.message });
    }
    if (err.message === 'Insufficient funds') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// Deposit simulation
router.post('/deposit', auth, async (req, res, next) => {
  const { error, value } = depositWithdrawSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { accountNumber, amount, fundingSourceId } = value;
  try {
    await prisma.$transaction(async (tx) => {
      const acc = await tx.account.findFirst({
        where: {
          account_number: accountNumber,
          OR: [{ user_id: req.userId }, { joint_user_id: req.userId }]
        }
      });
      if (!acc) throw new Error('Account not found or not yours');

      let description = 'Cash deposit';
      if (fundingSourceId) {
        const source = await tx.fundingSource.findFirst({
          where: { id: fundingSourceId, user_id: req.userId }
        });
        if (source) {
          description = `Deposit from ${source.bank_name} ending in ${source.account_last4}`;
        }
      }

      await tx.account.update({
        where: { account_number: accountNumber },
        data: { balance: { increment: amount } }
      });

      await tx.transaction.create({
        data: {
          from_account: accountNumber,
          to_account: accountNumber,
          amount,
          type: 'deposit',
          description
        }
      });
    });

    res.json({ success: true, message: 'Deposit successful' });
  } catch (err) {
    if (err.message === 'Account not found or not yours') {
      return res.status(403).json({ error: err.message });
    }
    next(err);
  }
});

// Withdrawal simulation
router.post('/withdraw', auth, async (req, res, next) => {
  const { error, value } = depositWithdrawSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { accountNumber, amount, fundingSourceId } = value;
  try {
    const risCheck = await prisma.risNotice.findFirst({
      where: { user_id: req.userId, status: 'uncleared' }
    });
    if (risCheck) {
      return res.status(403).json({ error: 'Action blocked: You have an uncleared IRS tax notice. Please clear it to proceed.' });
    }

    await prisma.$transaction(async (tx) => {
      const acc = await tx.account.findFirst({
        where: {
          account_number: accountNumber,
          OR: [{ user_id: req.userId }, { joint_user_id: req.userId }]
        }
      });
      if (!acc) throw new Error('Account not found or not yours');
      if (parseFloat(acc.balance) < amount) throw new Error('Insufficient funds for withdrawal');

      let description = 'Cash withdrawal';
      if (fundingSourceId) {
        const source = await tx.fundingSource.findFirst({
          where: { id: fundingSourceId, user_id: req.userId }
        });
        if (source) {
          description = `Withdrawal to ${source.bank_name} ending in ${source.account_last4}`;
        }
      }

      await tx.account.update({
        where: { account_number: accountNumber },
        data: { balance: { decrement: amount } }
      });

      await tx.transaction.create({
        data: {
          from_account: accountNumber,
          to_account: accountNumber,
          amount,
          type: 'withdrawal',
          description
        }
      });
    });

    res.json({ success: true, message: 'Withdrawal successful' });
  } catch (err) {
    if (err.message === 'Account not found or not yours') {
      return res.status(403).json({ error: err.message });
    }
    if (err.message === 'Insufficient funds for withdrawal') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// Transaction history with filters
router.get('/history', auth, async (req, res, next) => {
  try {
    const { from_date, to_date, type } = req.query;
    
    const accounts = await prisma.account.findMany({
      where: {
        OR: [{ user_id: req.userId }, { joint_user_id: req.userId }]
      }
    });

    if (accounts.length === 0) return res.status(404).json({ error: 'Account not found' });
    
    accounts.sort((a, b) => (b.joint_user_id === req.userId ? 1 : -1) - (a.joint_user_id === req.userId ? 1 : -1));
    const accNum = accounts[0].account_number;

    const whereClause = {
      OR: [{ from_account: accNum }, { to_account: accNum }]
    };

    if (from_date || to_date) {
      whereClause.created_at = {};
      if (from_date) whereClause.created_at.gte = new Date(from_date);
      if (to_date) whereClause.created_at.lte = new Date(to_date);
    }

    if (type && ['transfer', 'deposit', 'withdrawal'].includes(type)) {
      whereClause.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });

    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;