import { Router } from 'express';
import PowerTeam from '../models/PowerTeam.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { chapter } = req.query;
    const filter = {};
    if (chapter) filter.chapter = chapter;
    const teams = await PowerTeam.find(filter)
      .populate('chapter', 'name')
      .populate('captain', 'name email phone')
      .populate('viceCaptain', 'name email phone')
      .populate('members', 'name email phone role')
      .sort({ createdAt: -1 });
    res.json({ powerTeams: teams });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('super_admin', 'coordinator'), async (req, res, next) => {
  try {
    const { name, chapter, captain, viceCaptain, members = [] } = req.body || {};
    if (!name || !chapter) return res.status(400).json({ error: 'Name and chapter are required' });
    const team = await PowerTeam.create({
      name: name.trim(),
      chapter,
      captain: captain || null,
      viceCaptain: viceCaptain || null,
      members,
    });
    if (captain) await User.findByIdAndUpdate(captain, { role: 'captain', powerTeam: team._id });
    if (viceCaptain) await User.findByIdAndUpdate(viceCaptain, { role: 'vice_captain', powerTeam: team._id });
    if (members?.length) await User.updateMany({ _id: { $in: members } }, { powerTeam: team._id });
    res.status(201).json({ powerTeam: team });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Power team name already exists in this chapter' });
    next(err);
  }
});

router.put('/:id', requireRole('super_admin', 'coordinator'), async (req, res, next) => {
  try {
    const { name, captain, viceCaptain, members, isActive } = req.body || {};
    const team = await PowerTeam.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Power team not found' });
    if (name !== undefined) team.name = name.trim();
    if (isActive !== undefined) team.isActive = !!isActive;
    if (captain !== undefined) {
      team.captain = captain || null;
      if (captain) await User.findByIdAndUpdate(captain, { role: 'captain', powerTeam: team._id });
    }
    if (viceCaptain !== undefined) {
      team.viceCaptain = viceCaptain || null;
      if (viceCaptain) await User.findByIdAndUpdate(viceCaptain, { role: 'vice_captain', powerTeam: team._id });
    }
    if (members !== undefined) {
      team.members = members;
      await User.updateMany({ _id: { $in: members } }, { powerTeam: team._id });
    }
    await team.save();
    res.json({ powerTeam: team });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Power team name already exists in this chapter' });
    next(err);
  }
});

router.delete('/:id', requireRole('super_admin', 'coordinator'), async (req, res, next) => {
  try {
    const team = await PowerTeam.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ error: 'Power team not found' });
    await User.updateMany({ powerTeam: team._id }, { powerTeam: null });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
