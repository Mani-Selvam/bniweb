import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid session' });
    if (user.sessionId && decoded.sid && user.sessionId !== decoded.sid) {
      return res.status(401).json({ error: 'Signed in on another device. Please log in again.' });
    }
    req.user = user;
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
