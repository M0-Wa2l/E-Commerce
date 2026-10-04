const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendAuth = (res, user, status = 200) =>
  res.status(status).json({
    success: true,
    token: signToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // role is never taken from the request body — admins are promoted manually or via seed
  const user = await User.create({ name, email, password });
  sendAuth(res, user, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new AppError('Invalid credentials', 401);
  sendAuth(res, user);
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (req.body.name) user.name = req.body.name;
  if (req.body.password) {
    if (!req.body.currentPassword || !(await user.matchPassword(req.body.currentPassword)))
      throw new AppError('Current password is incorrect', 401);
    user.password = req.body.password;
  }
  await user.save();
  sendAuth(res, user);
});
