export function distanceKm(a, b) {
  if (
    typeof a?.lat !== 'number' ||
    typeof a?.lng !== 'number' ||
    typeof b?.lat !== 'number' ||
    typeof b?.lng !== 'number'
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const radius = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * radius * Math.asin(Math.sqrt(h));
}

function toRad(value) {
  return (value * Math.PI) / 180;
}
