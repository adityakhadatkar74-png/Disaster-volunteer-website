import { CheckCircle2, CircleDot, ClipboardCheck, MapPin, Timer, UserCheck } from 'lucide-react';
import { TASK_STATUSES } from '../constants';
import { api } from '../services/api';

export default function TaskBoard({ tasks, disasters, volunteers = [], profile }) {
  const disasterById = Object.fromEntries(disasters.map((item) => [item.id, item]));
  const volunteerById = Object.fromEntries(volunteers.map((item) => [item.id, item]));

  async function acceptTask(task) {
    const eta = window.prompt('How many minutes until you reach the location?', '20');
    await api.acceptTask(task.id, { etaMinutes: Number(eta) || null });
  }

  async function updateStatus(task, status) {
    await api.updateTaskStatus(task.id, status);
  }

  return (
    <section className="panel task-board-panel">
      <div className="panel-heading">
        <h2>{profile?.role === 'admin' ? 'Task Progress' : 'Available & Assigned Tasks'}</h2>
        <ClipboardCheck size={20} />
      </div>
      <div className="cards">
        {tasks.map((task) => {
          const disaster = disasterById[task.disasterId];
          const responder = volunteerById[task.assignedTo];
          const mine = task.assignedTo === profile?.id;
          const open = !task.assignedTo;

          return (
            <article className="task-card" key={task.id}>
              <div>
                <h3>{task.title}</h3>
                <p>{task.description || disaster?.name || 'No description'}</p>
              </div>
              <div className="meta-row">
                <span>{task.requiredSkill}</span>
                <span>{task.priority}</span>
                <span className={`status ${task.status}`}>{task.status}</span>
              </div>
              <div className="responder-strip">
                <span>
                  <UserCheck size={15} />
                  {task.assignedTo ? responder?.name || responder?.email || 'Assigned volunteer' : 'Waiting for volunteer'}
                </span>
                <span>
                  <Timer size={15} />
                  {arrivalText(task)}
                </span>
                <span>
                  <MapPin size={15} />
                  {task.status === 'arrived' || task.arrivedAt ? 'Reached location' : 'Not reached yet'}
                </span>
              </div>
              {profile?.role === 'volunteer' && open && (
                <button className="primary" onClick={() => acceptTask(task)}>
                  <CircleDot size={16} /> Accept Task
                </button>
              )}
              {profile?.role === 'volunteer' && mine && (
                <div className="task-actions">
                  <select value={task.status} onChange={(e) => updateStatus(task, e.target.value)}>
                    {TASK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {task.status !== 'arrived' && task.status !== 'completed' && (
                    <button className="secondary" onClick={() => updateStatus(task, 'arrived')}>
                      <MapPin size={16} /> Reached
                    </button>
                  )}
                </div>
              )}
              {task.status === 'completed' && (
                <span className="done">
                  <CheckCircle2 size={16} /> Complete
                </span>
              )}
            </article>
          );
        })}
        {!tasks.length && <p className="muted">No tasks yet.</p>}
      </div>
    </section>
  );
}

function arrivalText(task) {
  if (task.arrivedAt || task.status === 'arrived') {
    return `Reached ${formatDateTime(task.arrivedAt)}`;
  }

  if (!task.assignedTo) return 'No ETA yet';
  if (!task.etaMinutes) return `Accepted ${formatDateTime(task.acceptedAt)}`;

  return `ETA ${task.etaMinutes} min · expected ${expectedArrival(task)}`;
}

function formatDateTime(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'just now';

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function expectedArrival(task) {
  const accepted = task.acceptedAt?.toDate ? task.acceptedAt.toDate() : task.acceptedAt ? new Date(task.acceptedAt) : null;
  if (!accepted || Number.isNaN(accepted.getTime())) return 'soon';

  return new Date(accepted.getTime() + Number(task.etaMinutes) * 60000).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}
