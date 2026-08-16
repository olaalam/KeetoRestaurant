import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to re-center the map
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat !== undefined && center.lng !== undefined) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Handle map clicks to update coordinates
const MapClickHandler = ({ coverageType, setCoordinates }) => {
  useMapEvents({
    click(e) {
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (coverageType === 'RADIUS') {
        // In RADIUS mode: Only one center point is allowed
        setCoordinates([newPoint]);
      } else {
        // In POLYGON mode: Add points to the shape
        setCoordinates((prev) => [...prev, newPoint]);
      }
    },
  });
  return null;
};

export default function InteractiveZoneMap({
  coverageType,
  coordinates = [],
  setCoordinates,
  radiusKm = 5,
}) {
  const [searchLat, setSearchLat] = useState('');
  const [searchLng, setSearchLng] = useState('');

  const defaultCenter = coordinates.length > 0 && coordinates[0]?.lat 
    ? { lat: Number(coordinates[0].lat), lng: Number(coordinates[0].lng) } 
    : { lat: 31.2156, lng: 29.9553 };

  const [mapCenter, setMapCenter] = useState(defaultCenter);

// Update map center and search inputs when external coordinates change
  useEffect(() => {
    if (coordinates.length > 0 && coordinates[0]?.lat && coordinates[0]?.lng) {
      const latVal = Number(coordinates[0].lat);
      const lngVal = Number(coordinates[0].lng);
      
      setMapCenter({ lat: latVal, lng: lngVal });
      
      // 💡 الكود الجديد: وضع الإحداثيات تلقائياً في حقول البحث LAT و LNG
      setSearchLat(String(latVal));
      setSearchLng(String(lngVal));
    }
  }, [coordinates]);

  const handleMarkerDrag = (index, event) => {
    const { lat, lng } = event.target.getLatLng();
    const updated = [...coordinates];
    updated[index] = { lat, lng };
    setCoordinates(updated);
  };
  const handleLatChange = (e) => {
    const val = e.target.value;
    
    if (val.includes(',')) {
      const parts = val.split(',');
      const latPart = parts[0]?.trim();
      const lngPart = parts[1]?.trim();

      setSearchLat(latPart || '');
      if (lngPart) {
        setSearchLng(lngPart);
      }

      // تحديد النقطة على الخريطة تلقائياً فور اللصق
      const latNum = parseFloat(latPart);
      const lngNum = parseFloat(lngPart);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        const newPoint = { lat: latNum, lng: lngNum };
        setMapCenter(newPoint);

        if (coverageType === 'RADIUS') {
          setCoordinates([newPoint]);
        } else {
          setCoordinates((prev) => [...prev, newPoint]);
        }
      }
    } else {
      setSearchLat(val);
    }
  };

  // Search logic without refreshing the page
  const handleSearch = () => {
    const latNum = parseFloat(searchLat);
    const lngNum = parseFloat(searchLng);

    if (!isNaN(latNum) && !isNaN(lngNum)) {
      const newPoint = { lat: latNum, lng: lngNum };
      setMapCenter(newPoint);

      if (coverageType === 'RADIUS') {
        setCoordinates([newPoint]);
      } else {
        setCoordinates((prev) => [...prev, newPoint]);
      }
    }
  };

  const polygonPositions = coordinates.map((c) => [Number(c.lat), Number(c.lng)]);
  const parsedRadiusInMeters = (parseFloat(radiusKm) || 0) * 1000;

  return (
    <div className="space-y-3">
{/* Search Bar for Lat and Lng */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <span className="text-xs font-semibold text-slate-600">LAT:</span>
          <input
            type="text" // تم تغييرها إلى text لتقبل اللصق المباشر للإحداثيات بالفاصلة
            step="any"
            placeholder="31.2156, 29.9553"
            value={searchLat}
            onChange={handleLatChange} // 💡 ربطها بالدالة الجديدة
            className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <span className="text-xs font-semibold text-slate-600">LNG:</span>
          <input
            type="number"
            step="any"
            placeholder="29.9553"
            value={searchLng}
            onChange={(e) => setSearchLng(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="px-4 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors shadow-sm"
        >
          Search / Pin Point
        </button>
      </div>

      {/* Map Display */}
      <div className="relative w-full h-[450px] rounded-xl overflow-hidden border shadow-sm">
        <MapContainer 
          center={mapCenter} 
          zoom={12} 
          className="w-full h-full"
        >
          <RecenterMap center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler 
            coverageType={coverageType} 
            setCoordinates={setCoordinates} 
          />

          {/* RADIUS View */}
          {coverageType === 'RADIUS' && coordinates.length > 0 && (
            <>
              <Circle
                center={[Number(coordinates[0].lat), Number(coordinates[0].lng)]}
                radius={parsedRadiusInMeters}
                pathOptions={{
                  color: '#2563eb',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.3,
                  weight: 2
                }}
              />
              <Marker
                position={[Number(coordinates[0].lat), Number(coordinates[0].lng)]}
                draggable={true}
                eventHandlers={{ dragend: (e) => handleMarkerDrag(0, e) }}
              />
            </>
          )}

          {/* POLYGON View */}
          {coverageType === 'POLYGON' && coordinates.length > 0 && (
            <>
              {coordinates.length >= 2 && (
                <Polygon
                  positions={polygonPositions}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.35,
                    weight: 2.5
                  }}
                />
              )}
              
              {coordinates.map((coord, idx) => (
                <Marker
                  key={idx}
                  position={[Number(coord.lat), Number(coord.lng)]}
                  draggable={true}
                  eventHandlers={{ dragend: (e) => handleMarkerDrag(idx, e) }}
                />
              ))}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}