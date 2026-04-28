import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';
import { sendWhatsappOtp } from './whatsappOtp.js';
import { sendEmailOtp } from './emailOtp.js';

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// If a still-valid OTP was issued less than this many seconds ago, reuse it
// instead of generating + sending a new one. Prevents spamming WhatsApp/email
// when a user hits "send" twice or returns to the verify screen quickly.
const REUSE_WINDOW_SECONDS = 60;

export async function issueOtp({ user, purpose, channel = 'both' }) {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

  const recent = await Otp.findOne({
    userId: user._id,
    purpose,
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (recent) {
    const ageMs = Date.now() - new Date(recent.createdAt).getTime();
    if (ageMs < REUSE_WINDOW_SECONDS * 1000) {
      return { expiresAt: recent.expiresAt, results: { reused: true }, reused: true };
    }
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await Otp.deleteMany({ userId: user._id, purpose, used: false });
  await Otp.create({ userId: user._id, codeHash, purpose, channel, expiresAt });

  const results = {};
  if (channel === 'whatsapp' || channel === 'both') {
    results.whatsapp = await sendWhatsappOtp({ phone: user.phone, code });
  }
  if (channel === 'email' || channel === 'both') {
    results.email = await sendEmailOtp({ email: user.email, code, purpose });
  }

  return { expiresAt, results, reused: false };
}

export async function verifyOtp({ user, purpose, code }) {
  const otp = await Otp.findOne({ userId: user._id, purpose, used: false }).sort({ createdAt: -1 });
  if (!otp) return { ok: false, reason: 'No active code. Please request a new one.' };
  if (otp.expiresAt < new Date()) return { ok: false, reason: 'Code expired. Please request a new one.' };
  if (otp.attempts >= 5) return { ok: false, reason: 'Too many attempts. Please request a new code.' };
  const match = await bcrypt.compare(String(code), otp.codeHash);
  otp.attempts += 1;
  if (!match) {
    await otp.save();
    return { ok: false, reason: 'Incorrect code.' };
  }
  otp.used = true;
  await otp.save();
  return { ok: true };
}
