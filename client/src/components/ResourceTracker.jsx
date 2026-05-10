import { AlertTriangle, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function ResourceTracker({ resources, disasters, canEdit = false }) {
  const disasterById = Object.fromEntries(disasters.map((item) => [item.id, item.name]));

  return (
    <section className="panel span-two">
      <div className="panel-heading">
        <h2>Resource Tracker</h2>
      </div>
      <div className="resource-grid">
        {resources.map((resource) => {
          const low = Number(resource.quantity) <= Number(resource.lowStockThreshold);

          return (
            <article className={low ? 'resource-card low' : 'resource-card'} key={resource.id}>
              <div>
                <h3>{resource.name}</h3>
                <p>{disasterById[resource.disasterId] || 'Unlinked zone'} · {resource.category}</p>
              </div>
              <strong>{resource.quantity} {resource.unit}</strong>
              {low && <span className="alert"><AlertTriangle size={15} /> Low stock</span>}
              {canEdit && (
                <div className="button-row">
                  <button className="secondary" onClick={() => api.updateResource(resource.id, { quantity: Number(resource.quantity) + 1 })}>+1</button>
                  <button className="secondary" onClick={() => api.updateResource(resource.id, { quantity: Math.max(0, Number(resource.quantity) - 1) })}>-1</button>
                  <button className="icon-button danger" title="Delete resource" onClick={() => api.deleteResource(resource.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </article>
          );
        })}
        {!resources.length && <p className="muted">No resource records yet.</p>}
      </div>
    </section>
  );
}

