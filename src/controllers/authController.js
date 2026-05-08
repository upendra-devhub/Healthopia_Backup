const User = require('../models/User');
const HealthTracker = require('../models/HealthTracker');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../utils/errors');
const { attachAuthCookie, clearAuthCookie } = require('../utils/authTokens');
const { ensureOptionalString, ensureString, normalizeUsername } = require('../utils/validation');
const bcrypt = require("bcrypt");
const crypto = require('crypto');

const AVATAR_FILENAME_PATTERN = /^avatar-[1-9]\.png$/;

function serializeAuthUser(user) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar || '',
    likedPosts: user.likedPosts || []
  };
}

function normalizeAvatarSelection(value) {
  const avatar = ensureOptionalString(value, { max: 40 });

  if (!avatar) {
    return '';
  }

  if (!AVATAR_FILENAME_PATTERN.test(avatar)) {
    throw new AppError('Selected avatar is invalid.', 400);
  }

  return avatar;
}

async function getSaltedPassword(password){
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

const register = asyncHandler(async (req, res) => {
  const username = normalizeUsername(req.body.username);
  const email = ensureString(req.body.email, 'Email', { min: 5, max: 254 });
  let password = ensureString(req.body.password, 'Password', { min: 6, max: 128 });
  const avatar = normalizeAvatarSelection(req.body.avatar);

  const existingUser = await User.findOne({
    $or: [
      { email },
      { username }
    ]
  });

  if (existingUser) {
    throw new AppError('An account with that email or username already exists.', 409);
  }

  password = await getSaltedPassword(password);

  const user = await User.create({
    name: username,
    username,
    email,
    password,
    avatar,
    posts: [],
    likedPosts: [],
    communitiesJoined: []
  });

  await HealthTracker.create({
    userId: user._id,
    waterIntake: 0,
    waterGoal: 2500,
    steps: 0,
    running: 0,
    sleep: 0,
    stepsGoal: 10000,
    runningGoal: 5,
    sleepGoal: 8,
    dailyLogs: []
  });

  attachAuthCookie(res, user._id.toString());

  res.status(201).json({
    message: 'Registration successful.',
    user: serializeAuthUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const email = ensureString(req.body.email, 'Email', { min: 5, max: 254 });
  let password = ensureString(req.body.password, 'Password', { min: 6, max: 128 });

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No account was found for that email.', 401);
  }
  
  let isMatch = await bcrypt.compare(password, user.password);
  if(!isMatch){
    throw new AppError("Please Enter Correct Paswword");
  }

  attachAuthCookie(res, user._id.toString());

  res.json({
    message: 'Login successful.',
    user: serializeAuthUser(user)
  });
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);

  res.json({
    message: 'Signed out successfully.'
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = ensureString(req.body.email, 'Email', { min: 5, max: 254 });

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists for security reasons
    return res.status(200).json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set token and expiration (1 hour from now)
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  // In production, send email with reset link
  // const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  // await sendResetEmail(user.email, resetUrl);

  // For development, log the reset URL
  const resetUrl = `/reset-password?token=${resetToken}`;
  console.log('Password Reset URL:', resetUrl);

  res.status(200).json({
    message: 'If an account exists with this email, a password reset link has been sent.'
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const token = ensureString(req.body.token, 'Reset token', { min: 1 });
  let password = ensureString(req.body.password, 'Password', { min: 6, max: 128 });

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token.', 400);
  }

  // Update password
  password = await getSaltedPassword(password);
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.status(200).json({
    message: 'Password reset successfully. Please sign in with your new password.'
  });
});

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
};
