import { Router } from 'express';
import User, { ROLES } from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { role, chapter } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (chapter) filter.chapter = chapter;
    const users = await User.find(filter)
      .populate('chapter', 'name')
      .populate('powerTeam', 'name')
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

const COORDINATOR_ALLOWED_ROLES = ['member', 'captain', 'vice_captain'];

router.post('/', requireRole('super_admin', 'coordinator'), async (req, res, next) => {
  try {
    const { name, phone, email, role = 'member', chapter, powerTeam } = req.body || {};
    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Name, phone and email are required' });
    }
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });

    let chapterId = chapter || null;
    if (req.user.role === 'coordinator') {
      if (!COORDINATOR_ALLOWED_ROLES.includes(role)) {
        return res.status(403).json({ error: 'Coordinators can only create members, captains, or vice-captains' });
      }
      if (!req.user.chapter) return res.status(400).json({ error: 'You are not assigned to a chapter' });
      chapterId = req.user.chapter;
    }

    const user = await User.create({
      name: name.trim(),
      phone: String(phone).trim(),
      email: String(email).toLowerCase().trim(),
      role,
      chapter: chapterId,
      powerTeam: powerTeam || null,
    });
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Phone or email already exists' });
    next(err);
  }
});

router.put('/:id', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { name, phone, email, role, chapter, powerTeam, isActive } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (phone !== undefined) update.phone = String(phone).trim();
    if (email !== undefined) update.email = String(email).toLowerCase().trim();
    if (role !== undefined) {
      if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
      update.role = role;
    }
    if (chapter !== undefined) update.chapter = chapter || null;
    if (powerTeam !== undefined) update.powerTeam = powerTeam || null;
    if (isActive !== undefined) update.isActive = !!isActive;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Phone or email already exists' });
    next(err);
  }
});

router.post('/:id/toggle-active', requireRole('super_admin', 'president'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('super_admin'), async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
