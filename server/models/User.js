import mongoose from 'mongoose';

export const ROLES = [
  'super_admin',
  'president',
  'vice_president',
  'coordinator',
  'captain',
  'vice_captain',
  'member',
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    role: { type: String, enum: ROLES, default: 'member', required: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', default: null },
    powerTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'PowerTeam', default: null },
    passwordHash: { type: String, default: null },
    passwordSet: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    sessionId: { type: String, default: null },
    lastDevice: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
