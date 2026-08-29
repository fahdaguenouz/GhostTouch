import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './telemetry.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationMapProps {
  location: LocationData | null;
}

const RecenterAutomatically = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export const LocationMap: React.FC<LocationMapProps> = ({ location }) => {
  if (!location) {
    return (
      <div className="location-map-container glass-panel loading">
        <span className="pulsing-text">Waiting for GPS lock...</span>
      </div>
    );
  }

  const { latitude, longitude } = location;

  return (
    <div className="location-map-container glass-panel">
      <div className="telemetry-header">
        <h3>Live GPS Location</h3>
      </div>
      <div className="map-wrapper">
        <MapContainer center={[latitude, longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
          />
          <Marker position={[latitude, longitude]}>
            <Popup>
              Device Location <br /> Acc: {location.accuracy}m
            </Popup>
          </Marker>
          <RecenterAutomatically lat={latitude} lng={longitude} />
        </MapContainer>
      </div>
    </div>
  );
};
