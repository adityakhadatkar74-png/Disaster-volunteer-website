import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';

export function useAuthProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let unsubscribeProfile = null;
    const loadingTimeout = window.setTimeout(() => {
      setLoading(false);
    }, 6000);

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      window.clearTimeout(loadingTimeout);
      setError('');
      setUser(firebaseUser);
      setProfile(null);

      if (unsubscribeProfile) unsubscribeProfile();

      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      unsubscribeProfile = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snapshot) => {
          setProfile(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
          setLoading(false);
        },
        (snapshotError) => {
          console.error('Profile listener failed:', snapshotError);
          setError(snapshotError.message);
          setProfile(null);
          setLoading(false);
        }
      );
    }, (authError) => {
      window.clearTimeout(loadingTimeout);
      console.error('Auth listener failed:', authError);
      setError(authError.message);
      setLoading(false);
    });

    return () => {
      window.clearTimeout(loadingTimeout);
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return { user, profile, loading, error };
}
