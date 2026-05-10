import express from 'express';
import { db, FieldValue } from '../firebaseAdmin.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (_req, res) => {
  const snapshot = await db.collection('disasters').orderBy('createdAt', 'desc').get();
  res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const {
    name,
    type,
    severity = 'medium',
    status = 'active',
    description = '',
    place = '',
    approximateLocation = false,
    location
  } = req.body;
  const resolvedLocation = isValidLocation(location) ? location : fallbackLocation(place || name);

  if (!name || !type) {
    return res.status(400).json({ message: 'name and type are required' });
  }

  const doc = await db.collection('disasters').add({
    name,
    type,
    severity,
    status,
    description,
    place,
    approximateLocation: approximateLocation || !isValidLocation(location),
    location: resolvedLocation,
    createdBy: req.user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  res.status(201).json({ id: doc.id });
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  await db.collection('disasters').doc(req.params.id).set(
    {
      ...req.body,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  res.json({ id: req.params.id });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await db.collection('disasters').doc(req.params.id).delete();
  res.status(204).send();
});

export default router;

function isValidLocation(location) {
  return (
    typeof location?.lat === 'number' &&
    typeof location?.lng === 'number' &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.lng >= -180 &&
    location.lng <= 180
  );
}

function fallbackLocation(seed) {
  const text = String(seed || 'default').trim().toLowerCase();
  let hash = 0;

  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const latOffset = ((hash % 1200) - 600) / 1000;
  const lngOffset = (((hash >> 10) % 1200) - 600) / 1000;

  return {
    lat: 12.9716 + latOffset,
    lng: 77.5946 + lngOffset
  };
}
