import mongoose from 'mongoose';

const powerTeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    viceCaptain: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

powerTeamSchema.index({ chapter: 1, name: 1 }, { unique: true });

export default mongoose.model('PowerTeam', powerTeamSchema);
