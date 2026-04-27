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

router.get('/trends', async (_req, res, next) => {
  try {
    // last 6 months of meetings -> referrals, visitors, tyfcb
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const monthly = await Meeting.aggregate([
      { $match: { date: { $gte: since } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          meetings: { $sum: 1 },
          referrals: { $sum: '$referrals' },
          visitors: { $sum: '$visitors' },
          tyfcb: { $sum: '$tyfcb' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);

    const months = [];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const cur = new Date(since);
    for (let i = 0; i < 6; i++) {
      const y = cur.getFullYear();
      const m = cur.getMonth() + 1;
      const found = monthly.find((x) => x._id.y === y && x._id.m === m);
      months.push({
        label: monthNames[m - 1],
        meetings: found?.meetings || 0,
        referrals: found?.referrals || 0,
        visitors: found?.visitors || 0,
        tyfcb: found?.tyfcb || 0,
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    const roleAgg = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const chapterAgg = await User.aggregate([
      { $match: { chapter: { $ne: null } } },
      { $group: { _id: '$chapter', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $lookup: { from: 'chapters', localField: '_id', foreignField: '_id', as: 'chapter' } },
      { $unwind: '$chapter' },
      { $project: { _id: 0, name: '$chapter.name', count: 1 } },
    ]);

    res.json({
      months,
      roles: roleAgg.map((r) => ({ role: r._id, count: r.count })),
      chapters: chapterAgg,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
