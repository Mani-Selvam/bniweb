import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

export function signToken(payload, options = {}) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d', ...options });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
