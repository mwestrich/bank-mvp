const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../db/prisma');
const auth = require('../middleware/auth');
const { updateProfileSchema } = require('../services/validationSchemas');
const router = express.Router();

// Get profile
router.get('/', auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, full_name: true, created_at: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update profile (name and/or password)
router.put('/', auth, async (req, res, next) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { full_name, password } = value;
  try {
    const data = {};
    if (full_name) data.full_name = full_name;
    if (password) data.password_hash = await bcrypt.hash(password, 10);

    if (Object.keys(data).length > 0) {
      await prisma.user.update({
        where: { id: req.userId },
        data
      });
    }

    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;