import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const secure = (process.env.EMAIL_SECURE || 'true') === 'true';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!host || !user || !pass) {
    console.warn('[emailOtp] Missing email configuration');
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmailOtp({ email, code, purpose = 'login' }) {
  const t = getTransporter();
  if (!t) return { skipped: true };
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const subject =
    purpose === 'reset_password' ? 'Reset your password' : 'Your verification code';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#1f2937;margin:0 0 12px">BNI Web Verification</h2>
      <p style="color:#374151">Use the following one-time code to continue:</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f3f4f6;color:#111827;padding:16px;text-align:center;border-radius:8px;margin:16px 0">${code}</div>
      <p style="color:#6b7280;font-size:13px">This code expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes. If you didn't request it, you can ignore this email.</p>
    </div>`;
  try {
    const info = await t.sendMail({ from, to: email, subject, html });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('[emailOtp] failed', err.message);
    return { ok: false, error: err.message };
  }
}
