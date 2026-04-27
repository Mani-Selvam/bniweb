import { Router } from 'express';
import Meeting from '../models/Meeting.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { chapter, powerTeam } = req.query;
    const filter = {};
    if (chapter) filter.chapter = chapter;
    if (powerTeam) filter.powerTeam = powerTeam;
    const meetings = await Meeting.find(filter)
      .populate('chapter', 'name')
      .populate('powerTeam', 'name')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .limit(200);
    res.json({ meetings });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { chapter, powerTeam, date, title, notes, attendees = [], tyfcb = 0, referrals = 0, visitors = 0 } = req.body || {};
    if (!chapter || !powerTeam || !date) return res.status(400).json({ error: 'chapter, powerTeam, date are required' });
    const meeting = await Meeting.create({
      chapter, powerTeam, date: new Date(date), title, notes, attendees,
      tyfcb: Number(tyfcb) || 0, referrals: Number(referrals) || 0, visitors: Number(visitors) || 0,
      createdBy: req.user._id,
    });
    res.status(201).json({ meeting });
  } catch (err) {
    next(err);
  }
});

export default router;
