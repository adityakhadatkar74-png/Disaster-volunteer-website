import { signOut } from 'firebase/auth';
import { Bell, Flame, HeartPulse, LifeBuoy, LogOut, MapPin, Megaphone, PackageCheck, RadioTower, Siren } from 'lucide-react';
import { useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import AuthPanel from './components/AuthPanel';
import MapView from './components/MapView';
import ProfilePanel from './components/ProfilePanel';
import ResourceTracker from './components/ResourceTracker';
import TaskBoard from './components/TaskBoard';
import { auth } from './firebase';
import { useAuthProfile } from './hooks/useAuthProfile';
import { useDisasters, useNotifications, useResources, useTasks, useVolunteers } from './hooks/useCollections';

export default function App() {
  const { user, profile, loading, error: authError } = useAuthProfile();

  if (loading) return <main className="loading">Connecting to Firebase...</main>;
  if (authError) {
    return (
      <main className="loading error-screen">
        <strong>Firebase startup failed</strong>
        <span>{authError}</span>
      </main>
    );
  }
  if (!user) return <AuthPanel />;

  return <AuthenticatedApp user={user} profile={profile} />;
}

function AuthenticatedApp({ user, profile }) {
  const activeProfile = profile || { id: user.uid, email: user.email, role: 'volunteer' };
  const { items: disasters } = useDisasters();
  const { items: volunteers } = useVolunteers();
  const { items: resources } = useResources();
  const { items: tasks } = useTasks(activeProfile.id, activeProfile.role);
  const { items: notifications } = useNotifications(activeProfile.id);

  useEffect(() => {
    if (!activeProfile.id || !notifications.length) return;
    const newest = notifications[0];

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if ('Notification' in window && Notification.permission === 'granted' && !newest.read) {
      new Notification(newest.title, { body: newest.body });
    }
  }, [notifications, activeProfile.id]);

  return (
    <main className="experience-shell">
      <FloatingIcons />
      <div className="app-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Live coordination console</span>
            <h1>{activeProfile.role === 'admin' ? 'Authority Dashboard' : 'Volunteer Workspace'}</h1>
          </div>
          <div className="topbar-actions">
            <span className="notification-pill" title="Unread notifications">
              <Bell size={16} /> {notifications.filter((item) => !item.read).length}
            </span>
            <button className="secondary" onClick={() => signOut(auth)}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <section className="hero-strip">
          <div>
            <span className="pulse-dot" />
            <strong>{tasks.filter((task) => task.status !== 'completed').length}</strong>
            <span>active missions</span>
          </div>
          <div>
            <MapPin size={18} />
            <strong>{disasters.length}</strong>
            <span>mapped zones</span>
          </div>
          <div>
            <PackageCheck size={18} />
            <strong>{resources.filter((item) => Number(item.quantity) <= Number(item.lowStockThreshold)).length}</strong>
            <span>low-stock alerts</span>
          </div>
        </section>

        <section className="map-section">
          <div className="section-title">
            <MapPin size={20} />
            <h2>Disaster Zones & Volunteer Locations</h2>
          </div>
          <MapView disasters={disasters} volunteers={volunteers} currentUserId={activeProfile.id} />
        </section>

        {activeProfile.role === 'admin' ? (
          <AdminDashboard disasters={disasters} tasks={tasks} resources={resources} volunteers={volunteers} />
        ) : (
          <div className="volunteer-grid">
            <ProfilePanel profile={activeProfile} />
            <TaskBoard tasks={tasks} disasters={disasters} volunteers={volunteers} profile={activeProfile} />
            <ResourceTracker resources={resources} disasters={disasters} />
          </div>
        )}
      </div>
    </main>
  );
}

function FloatingIcons() {
  const icons = [
    { Icon: Siren, className: 'float-one' },
    { Icon: HeartPulse, className: 'float-two' },
    { Icon: RadioTower, className: 'float-three' },
    { Icon: LifeBuoy, className: 'float-four' },
    { Icon: Flame, className: 'float-five' },
    { Icon: Megaphone, className: 'float-six' }
  ];

  return (
    <div className="floating-icons" aria-hidden="true">
      {icons.map(({ Icon, className }) => (
        <span className={`floating-icon ${className}`} key={className}>
          <Icon size={24} />
        </span>
      ))}
    </div>
  );
}
