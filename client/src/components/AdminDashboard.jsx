import { useJsApiLoader } from '@react-google-maps/api';
import { Plus, Send, Warehouse } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RESOURCE_CATEGORIES, SKILLS } from '../constants';
import { api } from '../services/api';
import ResourceTracker from './ResourceTracker';
import TaskBoard from './TaskBoard';

export default function AdminDashboard({ disasters, tasks, resources, volunteers }) {
  const firstDisaster = disasters[0];
  const [error, setError] = useState('');
  const [creatingDisaster, setCreatingDisaster] = useState(false);
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });
  const [disasterForm, setDisasterForm] = useState({
    name: '',
    type: 'flood',
    severity: 'medium',
    description: '',
    place: ''
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    requiredSkill: SKILLS[0],
    disasterId: '',
    assignedTo: '',
    priority: 'medium',
    description: ''
  });
  const [resourceForm, setResourceForm] = useState({
    disasterId: '',
    name: '',
    category: RESOURCE_CATEGORIES[0],
    quantity: 0,
    unit: 'units',
    lowStockThreshold: 10
  });

  const selectedDisaster = useMemo(
    () => disasters.find((item) => item.id === taskForm.disasterId) || firstDisaster,
    [disasters, firstDisaster, taskForm.disasterId]
  );

  const matchingVolunteers = volunteers.filter((volunteer) => volunteer.skills?.includes(taskForm.requiredSkill));

  async function createDisaster(event) {
    event.preventDefault();
    setError('');

    setCreatingDisaster(true);

    try {
      const { location, approximate } = await resolvePlace(disasterForm.place, mapsLoaded);

      await api.createDisaster({
        name: disasterForm.name,
        type: disasterForm.type,
        severity: disasterForm.severity,
        description: disasterForm.description,
        place: disasterForm.place,
        approximateLocation: approximate,
        location
      });
      setDisasterForm({ name: '', type: 'flood', severity: 'medium', description: '', place: '' });
    } catch (geocodeError) {
      setError(geocodeError.message);
    } finally {
      setCreatingDisaster(false);
    }
  }

  async function createTask(event) {
    event.preventDefault();
    setError('');
    const disaster = disasters.find((item) => item.id === taskForm.disasterId) || selectedDisaster;
    const location = parseLocation(disaster?.location?.lat, disaster?.location?.lng);

    if (!disaster || !location) {
      setError('Select a disaster with a valid map location before creating a task.');
      return;
    }

    await api.createTask({
      ...taskForm,
      disasterId: taskForm.disasterId || disaster.id,
      assignedTo: taskForm.assignedTo || null,
      location
    });
    setTaskForm({ title: '', requiredSkill: SKILLS[0], disasterId: '', assignedTo: '', priority: 'medium', description: '' });
  }

  async function createResource(event) {
    event.preventDefault();
    await api.createResource({
      ...resourceForm,
      disasterId: resourceForm.disasterId || firstDisaster?.id,
      quantity: Number(resourceForm.quantity),
      lowStockThreshold: Number(resourceForm.lowStockThreshold)
    });
    setResourceForm({ disasterId: '', name: '', category: RESOURCE_CATEGORIES[0], quantity: 0, unit: 'units', lowStockThreshold: 10 });
  }

  return (
    <div className="admin-grid">
      {error && <p className="error admin-error span-two">{error}</p>}
      <section className="panel">
        <div className="panel-heading">
          <h2>Create Disaster Event</h2>
          <Plus size={20} />
        </div>
        <form className="stack" onSubmit={createDisaster}>
          <input placeholder="Event name" value={disasterForm.name} onChange={(e) => setDisasterForm({ ...disasterForm, name: e.target.value })} required />
          <div className="grid two">
            <select value={disasterForm.type} onChange={(e) => setDisasterForm({ ...disasterForm, type: e.target.value })}>
              <option value="flood">Flood</option>
              <option value="earthquake">Earthquake</option>
              <option value="cyclone">Cyclone</option>
              <option value="fire">Fire</option>
              <option value="landslide">Landslide</option>
            </select>
            <select value={disasterForm.severity} onChange={(e) => setDisasterForm({ ...disasterForm, severity: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <textarea placeholder="Description" value={disasterForm.description} onChange={(e) => setDisasterForm({ ...disasterForm, description: e.target.value })} />
          <input
            placeholder="Location, e.g. Bangalore flood camp or Main Road shelter"
            value={disasterForm.place}
            onChange={(e) => setDisasterForm({ ...disasterForm, place: e.target.value })}
            required
          />
          <button className="primary" type="submit" disabled={creatingDisaster}>
            {creatingDisaster ? 'Finding Place...' : 'Create Event'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Assign Task</h2>
          <Send size={20} />
        </div>
        <form className="stack" onSubmit={createTask}>
          <input placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
          <textarea placeholder="Instructions" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          <div className="grid two">
            <select value={taskForm.disasterId} onChange={(e) => setTaskForm({ ...taskForm, disasterId: e.target.value })} required>
              <option value="">Select disaster</option>
              {disasters.map((disaster) => <option key={disaster.id} value={disaster.id}>{disaster.name}</option>)}
            </select>
            <select value={taskForm.requiredSkill} onChange={(e) => setTaskForm({ ...taskForm, requiredSkill: e.target.value })}>
              {SKILLS.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
            </select>
          </div>
          <div className="grid two">
            <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
              <option value="">Open task</option>
              {matchingVolunteers.map((volunteer) => (
                <option key={volunteer.id} value={volunteer.id}>{volunteer.name || volunteer.email}</option>
              ))}
            </select>
          </div>
          <button className="primary" type="submit" disabled={!disasters.length}>Create Task</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Add Resource</h2>
          <Warehouse size={20} />
        </div>
        <form className="stack" onSubmit={createResource}>
          <select value={resourceForm.disasterId} onChange={(e) => setResourceForm({ ...resourceForm, disasterId: e.target.value })} required>
            <option value="">Select disaster</option>
            {disasters.map((disaster) => <option key={disaster.id} value={disaster.id}>{disaster.name}</option>)}
          </select>
          <div className="grid two">
            <input placeholder="Resource name" value={resourceForm.name} onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })} required />
            <select value={resourceForm.category} onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}>
              {RESOURCE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div className="grid three">
            <input type="number" min="0" value={resourceForm.quantity} onChange={(e) => setResourceForm({ ...resourceForm, quantity: e.target.value })} />
            <input value={resourceForm.unit} onChange={(e) => setResourceForm({ ...resourceForm, unit: e.target.value })} />
            <input type="number" min="0" value={resourceForm.lowStockThreshold} onChange={(e) => setResourceForm({ ...resourceForm, lowStockThreshold: e.target.value })} />
          </div>
          <button className="primary" type="submit" disabled={!disasters.length}>Add Resource</button>
        </form>
      </section>

      <ResourceTracker resources={resources} disasters={disasters} canEdit />
      <TaskBoard tasks={tasks} disasters={disasters} volunteers={volunteers} profile={{ role: 'admin' }} />
      <section className="panel span-two">
        <div className="panel-heading">
          <h2>Volunteer Matching</h2>
        </div>
        <div className="table-like">
          {volunteers.map((volunteer) => (
            <div key={volunteer.id}>
              <strong>{volunteer.name || volunteer.email}</strong>
              <span>{volunteer.skills?.join(', ') || 'No skills set'}</span>
              <span>{volunteer.location ? 'Location shared' : 'No location'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function parseLocation(latValue, lngValue) {
  const lat = Number(latValue);
  const lng = Number(lngValue);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

function formatLocation(location) {
  const parsed = parseLocation(location?.lat, location?.lng);
  return parsed ? `${parsed.lat.toFixed(3)}, ${parsed.lng.toFixed(3)}` : 'No location';
}

async function resolvePlace(place, mapsLoaded) {
  if (!place.trim()) {
    throw new Error('Enter a location name.');
  }

  if (!mapsLoaded || !window.google?.maps?.Geocoder) {
    return { location: fallbackLocation(place), approximate: true };
  }

  try {
    const location = await geocodePlace(place);
    return { location, approximate: false };
  } catch {
    return { location: fallbackLocation(place), approximate: true };
  }
}

function geocodePlace(place) {
  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address: place }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        reject(new Error('Could not find that place. Try a more specific area or city name.'));
        return;
      }

      const point = results[0].geometry.location;
      resolve({ lat: point.lat(), lng: point.lng() });
    });
  });
}

function fallbackLocation(place) {
  let hash = 0;
  for (const char of place.trim().toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const latOffset = ((hash % 1200) - 600) / 1000;
  const lngOffset = (((hash >> 10) % 1200) - 600) / 1000;

  return {
    lat: 12.9716 + latOffset,
    lng: 77.5946 + lngOffset
  };
}
