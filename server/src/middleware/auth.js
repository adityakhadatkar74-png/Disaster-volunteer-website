import { auth, db } from '../firebaseAdmin.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    const profile = await db.collection('users').doc(decoded.uid).get();
    req.userProfile = profile.exists ? profile.data() : null;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.userProfile?.role === 'admin' || req.user?.admin === true) {
    return next();
  }

  res.status(403).json({ message: 'Admin access required' });
}

