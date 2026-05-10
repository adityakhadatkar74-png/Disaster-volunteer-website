import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useMemo, useState } from 'react';

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

function normalizeLocation(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

export default function MapView({ disasters, volunteers, currentUserId }) {
  const [selected, setSelected] = useState(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const mappedDisasters = useMemo(
    () =>
      disasters
        .map((disaster) => ({ ...disaster, location: normalizeLocation(disaster.location) }))
        .filter((disaster) => disaster.location),
    [disasters]
  );

  const mappedVolunteers = useMemo(
    () =>
      volunteers
        .map((volunteer) => ({ ...volunteer, location: normalizeLocation(volunteer.location) }))
        .filter((volunteer) => volunteer.location),
    [volunteers]
  );

  const center = useMemo(() => {
    const firstDisaster = mappedDisasters[0];
    const currentVolunteer = mappedVolunteers.find((item) => item.id === currentUserId);
    return currentVolunteer?.location || firstDisaster?.location || defaultCenter;
  }, [currentUserId, mappedDisasters, mappedVolunteers]);

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return <div className="map-fallback">Add VITE_GOOGLE_MAPS_API_KEY to show Google Maps.</div>;
  }

  if (!isLoaded) return <div className="map-fallback">Loading map...</div>;

  return (
    <GoogleMap mapContainerClassName="map" center={center} zoom={7} options={{ mapTypeControl: false, streetViewControl: false }}>
      {mappedDisasters.map((disaster) => (
        <Marker
          key={disaster.id}
          position={disaster.location}
          label="!"
          onClick={() => setSelected({ type: 'disaster', item: disaster })}
        />
      ))}
      {mappedVolunteers.map((volunteer) => (
        <Marker
          key={volunteer.id}
          position={volunteer.location}
          label={volunteer.id === currentUserId ? 'Me' : 'V'}
          onClick={() => setSelected({ type: 'volunteer', item: volunteer })}
        />
      ))}
      {selected && (
        <InfoWindow position={selected.item.location} onCloseClick={() => setSelected(null)}>
          <div className="info-window">
            <strong>{selected.item.name || selected.item.email}</strong>
            <span>{selected.type === 'disaster' ? selected.item.place || selected.item.type : selected.item.skills?.join(', ')}</span>
            {selected.type === 'disaster' && selected.item.approximateLocation && <span>Approximate pin</span>}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
