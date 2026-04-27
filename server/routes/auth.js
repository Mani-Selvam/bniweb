import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { issueOtp, verifyOtp } from '../services/otp.js';
import { signToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function findIdentifier(identifier) {
  const id = (identifier || '').trim().toLowerCase();
  if (!id) return null;
  if (id.includes('@')) return { email: id };
  return { phone: id.replace(/[^0-9+]/g, '') };
}

function publicUser(u) {
  return {
    id: u._id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    chapter: u.chapter,
    passwordSet: u.passwordSet,
    isActive: u.isActive,
  };
}

router.post('/request-otp', async (req, res, next) => {
  try {
    const { identifier, purpose = 'login' } = req.body || {};
    const query = findIdentifier(identifier);
    if (!query) return res.status(400).json({ error: 'Phone or email is required' });
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ error: 'No account found for this phone/email' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });

    const { expiresAt } = await issueOtp({ user, purpose, channel: 'both' });
    res.json({
      message: 'OTP sent to your phone (WhatsApp) and email',
      expiresAt,
      userId: user._id,
      passwordSet: user.passwordSet,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-otp', async (req, res, next) => {
  try {
    const { identifier, code, purpose = 'login' } = req.body || {};
    const query = findIdentifier(identifier);
    if (!query) return res.status(400).json({ error: 'Phone or email is required' });
    if (!code) return res.status(400).json({ error: 'OTP code is required' });
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ error: 'No account found' });

    const result = await verifyOtp({ user, purpose, code });
    if (!result.ok) return res.status(400).json({ error: result.reason });

    if (purpose === 'login') {
      if (!user.passwordSet) {
        const setupToken = signToken({ sub: user._id, kind: 'set_password' }, { expiresIn: '15m' });
        return res.json({ requiresPasswordSetup: true, setupToken, user: publicUser(user) });
      }
      user.lastLoginAt = new Date();
      await user.save();
      const token = signToken({ sub: user._id });
      return res.json({ token, user: publicUser(user) });
    }

    if (purpose === 'reset_password') {
      const resetToken = signToken({ sub: user._id, kind: 'reset_password' }, { expiresIn: '15m' });
      return res.json({ resetToken, user: publicUser(user) });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/set-password', async (req, res, next) => {
  try {
    const { setupToken, password } = req.body || {};
    if (!setupToken || !password) return res.status(400).json({ error: 'Token and password required' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const { verifyToken } = await import('../utils/jwt.js');
    let payload;
    try {
      payload = verifyToken(setupToken);
    } catch (_e) {
      return res.status(401).json({ error: 'Invalid or expired setup token' });
    }
    if (payload.kind !== 'set_password' && payload.kind !== 'reset_password') {
      return res.status(401).json({ error: 'Invalid token kind' });
    }
    const user = await User.findById(payload.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordSet = true;
    user.lastLoginAt = new Date();
    await user.save();
    const token = signToken({ sub: user._id });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login-password', async (req, res, next) => {
  try {
    const { identifier, password } = req.body || {};
    const query = findIdentifier(identifier);
    if (!query || !password) return res.status(400).json({ error: 'Identifier and password required' });
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ error: 'No account found' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });
    if (!user.passwordSet || !user.passwordHash) {
      return res.status(400).json({ error: 'Password not set. Please use OTP login first.' });
    }
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });
    user.lastLoginAt = new Date();
    await user.save();
    const token = signToken({ sub: user._id });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
