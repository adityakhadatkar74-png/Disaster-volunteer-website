import express from 'express';
import { db, FieldValue } from '../firebaseAdmin.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  const doc = await db.collection('users').doc(req.user.uid).get();
  res.json({ id: req.user.uid, ...(doc.exists ? doc.data() : {}) });
});

router.put('/me', requireAuth, async (req, res) => {
  const { name, role = 'volunteer', skills = [], location = null, phone = '' } = req.body;

  if (!['volunteer', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Role must be volunteer or admin' });
  }

  const payload = {
    name: name || req.user.name || req.user.email || 'Unnamed user',
    email: req.user.email || '',
    role,
    skills,
    phone,
    location,
    updatedAt: FieldValue.serverTimestamp()
  };

  await db.collection('users').doc(req.user.uid).set(payload, { merge: true });
  res.json({ id: req.user.uid, ...payload });
});

router.patch('/me/location', requireAuth, async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ message: 'lat and lng are required numbers' });
  }

  await db.collection('users').doc(req.user.uid).set(
    {
      location: { lat, lng },
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  res.json({ location: { lat, lng } });
});

export default router;

