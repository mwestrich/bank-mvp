const nodemailer = require('nodemailer');
const prisma = require('../db/prisma');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function generateAndSendOTP(email) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await prisma.otpCode.create({
    data: {
      email,
      code,
      expires_at: expiresAt,
      used: false,
    },
  });

  await transporter.sendMail({
    from: `"Bank MVP" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Bank Account',
    text: `Your OTP is ${code}. Valid for 10 minutes.`,
  });

  return true;
}

async function verifyOTP(email, code) {
  const result = await prisma.otpCode.findFirst({
    where: {
      email,
      code,
      expires_at: { gt: new Date() },
      used: false,
    },
    orderBy: { expires_at: 'desc' },
  });
  if (!result) return false;

  await prisma.otpCode.update({
    where: { id: result.id },
    data: { used: true },
  });
  return true;
}

module.exports = { generateAndSendOTP, verifyOTP };