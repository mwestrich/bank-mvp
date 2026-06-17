const express = require('express');
const prisma = require('../db/prisma');
const auth = require('../middleware/auth');
const router = express.Router();

// Get balance and account info
router.get('/me', auth, async (req, res, next) => {
  try {
    // Fetch the account prioritizing joint account if they have two
    const accounts = await prisma.account.findMany({
      where: {
        OR: [{ user_id: req.userId }, { joint_user_id: req.userId }]
      },
      include: {
        user: { select: { full_name: true } },
        joint_user: { select: { full_name: true } }
      }
    });

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Prioritize joint account if they have two
    accounts.sort((a, b) => (b.joint_user_id === req.userId ? 1 : -1) - (a.joint_user_id === req.userId ? 1 : -1));
    const account = accounts[0];
    
    // Check for RIS notice
    const risCheck = await prisma.risNotice.findFirst({
      where: { user_id: req.userId, status: 'uncleared' }
    });
    
    const accountData = {
      id: account.id,
      account_number: account.account_number,
      balance: account.balance,
      owner_name: account.user?.full_name,
      joint_owner_name: account.joint_user?.full_name || null,
      has_ris_notice: !!risCheck,
      ris_amount: risCheck ? risCheck.amount_due : 0
    };
    
    res.json(accountData);
  } catch (err) {
    next(err);
  }
});

// Get last 5 transactions
router.get('/recent-transactions', auth, async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        OR: [{ user_id: req.userId }, { joint_user_id: req.userId }]
      }
    });

    if (accounts.length === 0) return res.status(404).json({ error: 'Account not found' });
    
    accounts.sort((a, b) => (b.joint_user_id === req.userId ? 1 : -1) - (a.joint_user_id === req.userId ? 1 : -1));
    const accountNumber = accounts[0].account_number;

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ from_account: accountNumber }, { to_account: accountNumber }]
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });
    
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// Add a joint user to the current user's account
router.post('/joint', auth, async (req, res, next) => {
  const { addJointUserSchema } = require('../services/validationSchemas');
  const { error, value } = addJointUserSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { email } = value;

  try {
    // Cannot invite yourself
    const me = await prisma.user.findUnique({ where: { id: req.userId } });
    if (me.email === email) {
      return res.status(400).json({ error: 'You cannot invite yourself' });
    }

    // Find target user
    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) {
      return res.status(404).json({ error: 'User not found with that email' });
    }

    // Check if current user actually owns an account as primary
    const myAcc = await prisma.account.findFirst({ where: { user_id: req.userId } });
    if (!myAcc) {
      return res.status(403).json({ error: 'You do not own a primary account to share' });
    }

    // Update account
    await prisma.account.updateMany({
      where: { user_id: req.userId },
      data: { joint_user_id: target.id }
    });

    res.json({ success: true, message: `Successfully linked account with ${target.full_name}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;