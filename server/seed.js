import User from './models/User.js';

export async function seedSuperAdmin() {
  const phone = process.env.SUPER_ADMIN_PHONE;
  const email = process.env.SUPER_ADMIN_EMAIL;
  if (!phone || !email) {
    console.warn('[seed] SUPER_ADMIN_PHONE/EMAIL missing; skipping seed');
    return;
  }
  const existing = await User.findOne({ role: 'super_admin' });
  if (existing) {
    console.log('[seed] super admin already exists:', existing.email);
    return;
  }
  await User.create({
    name: 'Super Admin',
    phone,
    email: email.toLowerCase(),
    role: 'super_admin',
    isActive: true,
  });
  console.log(`[seed] super admin created (${email}). Login by entering this email or phone.`);
}
