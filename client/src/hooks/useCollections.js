import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

function useFirestoreQuery(createQuery, deps) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const unsubscribe = onSnapshot(
      createQuery(),
      (snapshot) => {
        setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (snapshotError) => {
        console.error('Collection listener failed:', snapshotError);
        setError(snapshotError.message);
        setItems([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, deps);

  return { items, loading, error };
}

export function useDisasters() {
  return useFirestoreQuery(() => query(collection(db, 'disasters'), orderBy('createdAt', 'desc')), []);
}

export function useTasks(userId, role) {
  const result = useFirestoreQuery(() => query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), []);

  if (role === 'volunteer' && userId) {
    return {
      ...result,
      items: result.items.filter((task) => !task.assignedTo || task.assignedTo === userId)
    };
  }

  return result;
}

export function useResources() {
  return useFirestoreQuery(() => query(collection(db, 'resources'), orderBy('name')), []);
}

export function useVolunteers() {
  return useFirestoreQuery(() => query(collection(db, 'users'), where('role', '==', 'volunteer')), []);
}

export function useNotifications(userId) {
  return useFirestoreQuery(
    () =>
      userId
        ? query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
        : query(collection(db, 'notifications')),
    [userId]
  );
}
