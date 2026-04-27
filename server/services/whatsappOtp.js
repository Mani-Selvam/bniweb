import axios from 'axios';

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  // Strip leading zero (some inputs like 09876543210)
  const trimmed = digits.replace(/^0+/, '');
  // If 10 digits, assume India (+91). Otherwise leave as-is.
  if (trimmed.length === 10) return `91${trimmed}`;
  return trimmed;
}

export async function sendWhatsappOtp({ phone, code }) {
  const url = process.env.NEO_OTP_WHATSAPP_URL;
  const token = process.env.NEO_OTP_TEMPLATE_TOKEN;
  const templateName = process.env.NEO_OTP_TEMPLATE_NAME;
  const language = process.env.NEO_OTP_TEMPLATE_LANGUAGE || 'en';
  const buttonIndex = parseInt(process.env.NEO_OTP_TEMPLATE_BUTTON_INDEX || '0', 10);

  if (!url || !token || !templateName) {
    console.warn('[whatsappOtp] Missing config; skipping send');
    return { skipped: true };
  }

  const to = normalizePhone(phone);
  const payload = {
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: String(code) }] },
        { type: 'button', sub_type: 'url', index: buttonIndex, parameters: [{ type: 'text', text: String(code) }] },
      ],
    },
  };

  try {
    const res = await axios.post(url, payload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = res.data || {};
    const messageStatus = data?.messages?.[0]?.message_status;
    console.log(`[whatsappOtp] sent to ${to} status=${messageStatus || 'unknown'}`);
    return { ok: true, data };
  } catch (err) {
    const errPayload = err.response?.data || err.message;
    console.error(`[whatsappOtp] failed for ${to}:`, errPayload);
    return { ok: false, error: errPayload };
  }
}
