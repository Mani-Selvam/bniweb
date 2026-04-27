import { Router } from 'express';
import Chapter from '../models/Chapter.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const chapters = await Chapter.find().sort({ createdAt: -1 });
    res.json({ chapters });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { name, location } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Chapter name is required' });
    const chapter = await Chapter.create({ name: name.trim(), location: (location || '').trim() });
    res.status(201).json({ chapter });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Chapter name already exists' });
    next(err);
  }
});

router.put('/:id', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { name, location, isActive } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (location !== undefined) update.location = location.trim();
    if (isActive !== undefined) update.isActive = !!isActive;
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    res.json({ chapter });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Chapter name already exists' });
    next(err);
  }
});

router.delete('/:id', requireRole('super_admin'), async (req, res, next) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
