import { Crosshair, Save } from 'lucide-react';
import { useState } from 'react';
import { SKILLS } from '../constants';
import { api } from '../services/api';

export default function ProfilePanel({ profile }) {
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [role, setRole] = useState(profile?.role || 'volunteer');
  const [skills, setSkills] = useState(profile?.skills || []);
  const [saving, setSaving] = useState(false);

  function toggleSkill(skill) {
    setSkills((current) => (current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]));
  }

  async function saveProfile() {
    setSaving(true);
    await api.saveProfile({ ...profile, name, phone, skills, role });
    setSaving(false);
  }

  async function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition(async (position) => {
      await api.updateLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    });
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Volunteer Profile</h2>
      </div>
      <div className="grid two">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
      </div>
      <label className="role-control">
        Role
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="volunteer">Volunteer</option>
          <option value="admin">Authority/Admin</option>
        </select>
      </label>
      <div className="skill-list">
        {SKILLS.map((skill) => (
          <button key={skill} className={skills.includes(skill) ? 'chip active' : 'chip'} onClick={() => toggleSkill(skill)}>
            {skill}
          </button>
        ))}
      </div>
      <div className="button-row">
        <button className="secondary" onClick={useCurrentLocation}>
          <Crosshair size={16} /> Update Location
        </button>
        <button className="primary" onClick={saveProfile} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving' : 'Save Profile'}
        </button>
      </div>
    </section>
  );
}
