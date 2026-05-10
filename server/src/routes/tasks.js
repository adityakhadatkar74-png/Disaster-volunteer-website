import express from 'express';
import { db, FieldValue } from '../firebaseAdmin.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { distanceKm } from '../utils/geo.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  let query = db.collection('tasks');

  if (req.query.assignedTo === 'me') {
    query = query.where('assignedTo', '==', req.user.uid);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
});

router.get('/recommended-volunteers', requireAuth, requireAdmin, async (req, res) => {
  const { skill, lat, lng, radiusKm = 50 } = req.query;
  const center = { lat: Number(lat), lng: Number(lng) };

  if (!skill || Number.isNaN(center.lat) || Number.isNaN(center.lng)) {
    return res.status(400).json({ message: 'skill, lat, and lng are required' });
  }

  const snapshot = await db
    .collection('users')
    .where('role', '==', 'volunteer')
    .where('skills', 'array-contains', skill)
    .get();

  const volunteers = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .map((volunteer) => ({
      ...volunteer,
      distanceKm: Number(distanceKm(center, volunteer.location).toFixed(1))
    }))
    .filter((volunteer) => volunteer.distanceKm <= Number(radiusKm))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json(volunteers);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const {
    title,
    description = '',
    disasterId,
    requiredSkill,
    location,
    assignedTo = null,
    priority = 'medium'
  } = req.body;

  if (!title || !disasterId || !requiredSkill || !isValidLocation(location)) {
    return res.status(400).json({ message: 'title, disasterId, requiredSkill, and numeric location are required' });
  }

  const doc = await db.collection('tasks').add({
    title,
    description,
    disasterId,
    requiredSkill,
    location,
    assignedTo,
    priority,
    status: assignedTo ? 'assigned' : 'open',
    createdBy: req.user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  if (assignedTo) {
    await db.collection('notifications').add({
      userId: assignedTo,
      taskId: doc.id,
      title: 'New task assigned',
      body: title,
      read: false,
      createdAt: FieldValue.serverTimestamp()
    });
  }

  res.status(201).json({ id: doc.id });
});

router.patch('/:id/assign', requireAuth, requireAdmin, async (req, res) => {
  const { volunteerId } = req.body;
  if (!volunteerId) return res.status(400).json({ message: 'volunteerId is required' });

  const taskRef = db.collection('tasks').doc(req.params.id);
  const taskDoc = await taskRef.get();
  if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });

  await taskRef.set(
    {
      assignedTo: volunteerId,
      status: 'assigned',
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  await db.collection('notifications').add({
    userId: volunteerId,
    taskId: req.params.id,
    title: 'New task assigned',
    body: taskDoc.data().title,
    read: false,
    createdAt: FieldValue.serverTimestamp()
  });

  res.json({ id: req.params.id, assignedTo: volunteerId });
});

router.patch('/:id/accept', requireAuth, async (req, res) => {
  const etaMinutes = Number(req.body?.etaMinutes);
  const hasEta = Number.isFinite(etaMinutes) && etaMinutes > 0;
  const ref = db.collection('tasks').doc(req.params.id);
  const task = await ref.get();

  if (!task.exists) return res.status(404).json({ message: 'Task not found' });
  const data = task.data();
  if (data.assignedTo && data.assignedTo !== req.user.uid) {
    return res.status(403).json({ message: 'Task is assigned to another volunteer' });
  }

  await ref.set(
    {
      assignedTo: req.user.uid,
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
      etaMinutes: hasEta ? Math.round(etaMinutes) : null,
      etaUpdatedAt: hasEta ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  res.json({ id: req.params.id, status: 'accepted' });
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ['assigned', 'accepted', 'in_progress', 'arrived', 'completed', 'blocked'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Unsupported status' });

  const ref = db.collection('tasks').doc(req.params.id);
  const task = await ref.get();
  if (!task.exists) return res.status(404).json({ message: 'Task not found' });

  const data = task.data();
  const isOwner = data.assignedTo === req.user.uid;
  const isAdmin = req.userProfile?.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Only assignee or admin can update status' });

  const payload = {
    status,
    updatedAt: FieldValue.serverTimestamp()
  };

  if (status === 'arrived') {
    payload.arrivedAt = FieldValue.serverTimestamp();
  }

  await ref.set(payload, { merge: true });

  res.json({ id: req.params.id, status });
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
