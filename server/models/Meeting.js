import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    powerTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'PowerTeam', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    title: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tyfcb: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    visitors: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Meeting', meetingSchema);
