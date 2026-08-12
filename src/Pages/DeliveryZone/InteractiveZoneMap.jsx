import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// أيقونة الماركر للنقاط
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// إعادة تحريك مركز الخريطة
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
};

// معالج الضغط على الخريطة حسب نوع التغطية
const MapClickHandler = ({ coverageType, setCoordinates }) => {
  useMapEvents({
    click(e) {
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (coverageType === 'RADIUS') {
        // 🎯 في حالة RADIUS: اختيار نقطة واحدة فقط (السنتر)
        setCoordinates([newPoint]);
      } else {
        // 🎯 في حالة POLYGON: إضافة نقطة جديدة لرسم الشكل
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
  // مركز الخريطة الافتراضي
  const defaultCenter = coordinates.length > 0 && coordinates[0]?.lat 
    ? { lat: Number(coordinates[0].lat), lng: Number(coordinates[0].lng) } 
    : { lat: 31.2156, lng: 29.9553 };

  // إمكانية سحب أي نقطة وتحديث مكانها
  const handleMarkerDrag = (index, event) => {
    const { lat, lng } = event.target.getLatLng();
    const updated = [...coordinates];
    updated[index] = { lat, lng };
    setCoordinates(updated);
  };

  const polygonPositions = coordinates.map((c) => [Number(c.lat), Number(c.lng)]);
  const parsedRadiusInMeters = (parseFloat(radiusKm) || 0) * 1000; // تحويل الكيلومتر إلى أمتار

  return (
    <div className="relative w-full h-[450px] rounded-xl overflow-hidden border shadow-sm">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        className="w-full h-full"
      >
        <RecenterMap center={defaultCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler 
          coverageType={coverageType} 
          setCoordinates={setCoordinates} 
        />

        {/* 🟡 1. حالة الـ RADIUS: رسم دايرة تلقائية حول نقطة واحدة فقط */}
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

        {/* 🔵 2. حالة الـ POLYGON: رسم شكل متعدد النقاط يتم توصيلها معاً */}
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
  );
}