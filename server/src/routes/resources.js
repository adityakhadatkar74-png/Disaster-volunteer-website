import express from 'express';
import { db, FieldValue } from '../firebaseAdmin.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  let query = db.collection('resources');
  if (req.query.disasterId) query = query.where('disasterId', '==', req.query.disasterId);

  const snapshot = await query.orderBy('name').get();
  res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { disasterId, name, category, quantity, unit = 'units', lowStockThreshold = 10 } = req.body;

  if (!disasterId || !name || !category || typeof quantity !== 'number') {
    return res.status(400).json({ message: 'disasterId, name, category, and numeric quantity are required' });
  }

  const doc = await db.collection('resources').add({
    disasterId,
    name,
    category,
    quantity,
    unit,
    lowStockThreshold,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  res.status(201).json({ id: doc.id });
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  await db.collection('resources').doc(req.params.id).set(
    {
      ...req.body,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  res.json({ id: req.params.id });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await db.collection('resources').doc(req.params.id).delete();
  res.status(204).send();
});

export default router;

