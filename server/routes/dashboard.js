import { Router } from 'express';
import mongoose from 'mongoose';
import Chapter from '../models/Chapter.js';
import User from '../models/User.js';
import PowerTeam from '../models/PowerTeam.js';
import Meeting from '../models/Meeting.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function scopeFor(user) {
  // super admin sees everything; everyone else is scoped to their chapter (if any)
  if (user.role === 'super_admin') return { chapter: null };
  return { chapter: user.chapter || null };
}

router.get('/summary', async (req, res, next) => {
  try {
    const { chapter } = scopeFor(req.user);
    const userFilter = chapter ? { chapter } : {};
    const meetingFilter = {};
    let powerTeamFilter = {};

    if (chapter) {
      meetingFilter.chapter = chapter;
      powerTeamFilter = { chapter };
    }

    const [totalChapters, totalUsers, totalPowerTeams, totalMeetings, tyfcbAgg] = await Promise.all([
      chapter ? 1 : Chapter.countDocuments(),
      User.countDocuments(userFilter),
      PowerTeam.countDocuments(powerTeamFilter),
      Meeting.countDocuments(meetingFilter),
      Meeting.aggregate([
        ...(chapter ? [{ $match: { chapter: new mongoose.Types.ObjectId(chapter) } }] : []),
        { $group: { _id: null, total: { $sum: '$tyfcb' }, refs: { $sum: '$referrals' }, vis: { $sum: '$visitors' } } },
      ]),
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
      scopedTo: chapter ? 'chapter' : 'global',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/trends', async (req, res, next) => {
  try {
    const { chapter } = scopeFor(req.user);
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const meetMatch = { date: { $gte: since } };
    if (chapter) meetMatch.chapter = new mongoose.Types.ObjectId(chapter);

    const monthly = await Meeting.aggregate([
      { $match: meetMatch },
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

    const userScope = chapter ? { chapter: new mongoose.Types.ObjectId(chapter) } : {};
    const roleAgg = await User.aggregate([
      ...(chapter ? [{ $match: userScope }] : []),
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    let chapters = [];
    if (chapter) {
      // For chapter-scoped users, show top power teams within their chapter
      chapters = await PowerTeam.aggregate([
        { $match: userScope },
        { $project: { name: 1, count: { $size: { $ifNull: ['$members', []] } } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
        { $project: { _id: 0, name: 1, count: 1 } },
      ]);
    } else {
      chapters = await User.aggregate([
        { $match: { chapter: { $ne: null } } },
        { $group: { _id: '$chapter', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
        { $lookup: { from: 'chapters', localField: '_id', foreignField: '_id', as: 'chapter' } },
        { $unwind: '$chapter' },
        { $project: { _id: 0, name: '$chapter.name', count: 1 } },
      ]);
    }

    res.json({
      months,
      roles: roleAgg.map((r) => ({ role: r._id, count: r.count })),
      chapters,
      chartLabel: chapter ? 'Top power teams (members)' : 'Top chapters by members',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
