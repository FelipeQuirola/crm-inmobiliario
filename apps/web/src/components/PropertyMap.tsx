import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface PropertyMapProps {
  lat: number;
  lng: number;
  title?: string;
  height?: number;
}

export function PropertyMap({ lat: latProp, lng: lngProp, title, height = 350 }: PropertyMapProps) {
  const lat = Number(latProp);
  const lng = Number(lngProp);
  if (isNaN(lat) || isNaN(lng)) return null;

  const mapKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;

  return (
    <MapContainer
      key={mapKey}
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}>
        {title && <Popup>{title}</Popup>}
      </Marker>
    </MapContainer>
  );
}
