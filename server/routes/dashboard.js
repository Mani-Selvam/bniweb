import { Router } from 'express';
import Chapter from '../models/Chapter.js';
import User from '../models/User.js';
import PowerTeam from '../models/PowerTeam.js';
import Meeting from '../models/Meeting.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', async (_req, res, next) => {
  try {
    const [totalChapters, totalUsers, totalPowerTeams, totalMeetings, tyfcbAgg] = await Promise.all([
      Chapter.countDocuments(),
      User.countDocuments(),
      PowerTeam.countDocuments(),
      Meeting.countDocuments(),
      Meeting.aggregate([{ $group: { _id: null, total: { $sum: '$tyfcb' }, refs: { $sum: '$referrals' }, vis: { $sum: '$visitors' } } }]),
    ]);
    const tyfcb = tyfcbAgg[0] || { total: 0, refs: 0, vis: 0 };
    res.json({
      totalChapters,
      totalUsers,
      totalPowerTeams,
      totalMeetings,
      tyfcbTotal: tyfcb.total || 0,
      referralsTotal: tyfcb.refs || 0,
      visitorsTotal: tyfcb.vis || 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
