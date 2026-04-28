import { Router } from 'express';
import mongoose from 'mongoose';
import Chapter from '../models/Chapter.js';
import User from '../models/User.js';
import PowerTeam from '../models/PowerTeam.js';
import Meeting from '../models/Meeting.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const chapters = await Chapter.find().sort({ createdAt: -1 }).lean();
    const ids = chapters.map((c) => c._id);
    const [teamCounts, userCounts, meetingCounts] = await Promise.all([
      PowerTeam.aggregate([{ $match: { chapter: { $in: ids } } }, { $group: { _id: '$chapter', n: { $sum: 1 } } }]),
      User.aggregate([{ $match: { chapter: { $in: ids } } }, { $group: { _id: '$chapter', n: { $sum: 1 } } }]),
      Meeting.aggregate([{ $match: { chapter: { $in: ids } } }, { $group: { _id: '$chapter', n: { $sum: 1 } } }]),
    ]);
    const map = (arr) => Object.fromEntries(arr.map((x) => [String(x._id), x.n]));
    const t = map(teamCounts), u = map(userCounts), m = map(meetingCounts);
    const enriched = chapters.map((c) => ({
      ...c,
      teamCount: t[String(c._id)] || 0,
      userCount: u[String(c._id)] || 0,
      meetingCount: m[String(c._id)] || 0,
    }));
    res.json({ chapters: enriched });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/tree', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid chapter id' });
    const chapter = await Chapter.findById(id).lean();
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    const [officers, members, teams] = await Promise.all([
      User.find({ chapter: id, role: { $in: ['president', 'vice_president', 'coordinator'] } })
        .select('name email phone role isActive')
        .sort({ role: 1, name: 1 })
        .lean(),
      User.find({ chapter: id, role: { $in: ['captain', 'vice_captain', 'member'] } })
        .select('name email phone role isActive powerTeam')
        .sort({ name: 1 })
        .lean(),
      PowerTeam.find({ chapter: id })
        .populate('captain', 'name email phone')
        .populate('viceCaptain', 'name email phone')
        .populate('members', 'name email phone role')
        .sort({ name: 1 })
        .lean(),
    ]);

    const teamIds = teams.map((t) => t._id);
    const meetingCountsAgg = await Meeting.aggregate([
      { $match: { powerTeam: { $in: teamIds } } },
      { $group: { _id: '$powerTeam', n: { $sum: 1 } } },
    ]);
    const mc = Object.fromEntries(meetingCountsAgg.map((x) => [String(x._id), x.n]));
    const teamsOut = teams.map((t) => ({ ...t, meetingCount: mc[String(t._id)] || 0 }));

    const unassignedMembers = members.filter((u) => !u.powerTeam);

    res.json({
      chapter,
      officers,
      powerTeams: teamsOut,
      unassignedMembers,
      counts: {
        officers: officers.length,
        members: members.length,
        powerTeams: teams.length,
        meetings: Object.values(mc).reduce((s, n) => s + n, 0),
      },
    });
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
