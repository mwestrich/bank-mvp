const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  full_name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const transferSchema = Joi.object({
  fromAccount: Joi.string().length(10).required(),
  toAccount: Joi.string().length(10).required(),
  amount: Joi.number().positive().precision(2).max(1000000).required(),
});

const depositWithdrawSchema = Joi.object({
  accountNumber: Joi.string().length(10).required(),
  amount: Joi.number().positive().precision(2).max(1000000).required(),
  fundingSourceId: Joi.number().integer().positive().optional(),
});

const addFundingSourceSchema = Joi.object({
  bankName: Joi.string().min(2).max(100).required(),
  accountNumber: Joi.string().min(4).max(30).required(),
});

const addJointUserSchema = Joi.object({
  email: Joi.string().email().required(),
});

const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(2).max(100),
  password: Joi.string().min(6),
});

module.exports = {
  registerSchema,
  loginSchema,
  transferSchema,
  depositWithdrawSchema,
  updateProfileSchema,
  addFundingSourceSchema,
  addJointUserSchema,
};