// ============================================================
//  src/components/UbicacionMap.jsx
//  Mapa con marker arrastrable para confirmar/corregir la
//  ubicación de un negocio. Sin geocoding propio — recibe lat/lng
//  ya resuelto (por búsqueda de dirección) y notifica cambios
//  cuando el usuario arrastra el pin a mano.
// ============================================================
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const VILLA_GESELL_CENTER = [-37.2637, -56.9738];

function Recenter({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, zoom, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1]]);
  return null;
}

export default function UbicacionMap({ position, onChange, height = 240 }) {
  const pos = position || VILLA_GESELL_CENTER;

  return (
    <div style={{ height, borderRadius: 14, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
      <MapContainer center={pos} zoom={position ? 16 : 13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter position={pos} zoom={position ? 16 : 13} />
        <Marker
          position={pos}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              onChange([lat, lng]);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
