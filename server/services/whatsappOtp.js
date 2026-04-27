import axios from 'axios';

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

  const payload = {
    token,
    phone,
    template_name: templateName,
    template_language: language,
    components: [
      { type: 'body', parameters: [{ type: 'text', text: code }] },
      { type: 'button', sub_type: 'url', index: buttonIndex, parameters: [{ type: 'text', text: code }] },
    ],
  };

  try {
    const res = await axios.post(url, payload, { timeout: 15000 });
    return { ok: true, data: res.data };
  } catch (err) {
    console.error('[whatsappOtp] failed', err.response?.data || err.message);
    return { ok: false, error: err.response?.data || err.message };
  }
}
