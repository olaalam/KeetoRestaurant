import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polygon, Circle, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pencil, MapPin, DollarSign, ShoppingBag, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useGet } from "@/hooks/useGet"; // Hook لجلب البيانات
import { useTranslation } from "@/hooks/useTranslation";
import LoadingSpinner from "@/components/LoadingSpinner";

// إصلاح أيقونات Leaflet الافتراضية
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ألوان مخصصة للمناطق على الخريطة
const ZONE_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
];

// مكون لتغيير تركيز الخريطة عند اختيار منطقة
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
};

export default function ZoneMap() {
  const navigate = useNavigate();
  const { isRTL } = useTranslation();
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [mapCenter, setMapCenter] = useState([31.2001, 29.9187]); // الافتراضي: الإسكندرية

  // 1. جلب بيانات مناطق التوصيل من الـ API
  const { data: apiResponse, isLoading, error } = useGet(
    "delivery-zones",
    "/api/restaurant/restaurant-zone-delivery-fees"
  );

  const zonesList = useMemo(() => apiResponse?.data?.data || [], [apiResponse]);

  // 2. معالجة الإحداثيات وتحويلها لتنسيق مناسب لمكتبة Leaflet
  const parsedZones = useMemo(() => {
    return zonesList.map((item, index) => {
      let coords = [];
      let rawCoords = item.customCoordinates || item.zone?.defaultCoordinates;

      // فك سلسلة JSON في حال كانت مشفرة كـ string
      if (typeof rawCoords === "string") {
        try {
          rawCoords = JSON.parse(rawCoords);
        } catch (e) {
          rawCoords = [];
        }
      }

      if (Array.isArray(rawCoords)) {
        coords = rawCoords
          .map((pt) => [parseFloat(pt.lat), parseFloat(pt.lng)])
          .filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]));
      }

      // حساب نقطة المنتصف لتركيز الخريطة
      let center = [31.2001, 29.9187];
      if (coords.length > 0) {
        const avgLat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
        const avgLng = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
        center = [avgLat, avgLng];
      }

      const radiusKm = parseFloat(item.customRadiusKm || item.zone?.defaultRadiusKm || 0);

      return {
        ...item,
        parsedCoords: coords,
        center,
        radiusMeters: radiusKm * 1000,
        color: ZONE_COLORS[index % ZONE_COLORS.length],
      };
    });
  }, [zonesList]);

  // التركيز على المنطقة عند الضغط عليها في القائمة
  const handleSelectZone = (zone) => {
    setSelectedZoneId(zone.id);
    setMapCenter(zone.center);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <LoadingSpinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:h-[calc(100vh-100px)]">
      {/* الخريطة - الجانب الأيسر */}
      <Card className="relative flex-1 overflow-hidden rounded-2xl shadow-sm border-slate-200 min-h-[450px]">
        <MapContainer
          center={mapCenter}
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full z-10"
        >
          <RecenterMap center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {parsedZones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            const zoneName = isRTL
              ? zone.zone?.displayNameAr || zone.zone?.nameAr
              : zone.zone?.displayName || zone.zone?.name;

            return (
              <React.Fragment key={zone.id}>
                {/* رسم المضلع Polygon */}
                {zone.coverageType === "POLYGON" && zone.parsedCoords.length >= 3 && (
                  <Polygon
                    positions={zone.parsedCoords}
                    pathOptions={{
                      color: zone.color,
                      fillColor: zone.color,
                      fillOpacity: isSelected ? 0.5 : 0.25,
                      weight: isSelected ? 3 : 2,
                    }}
                    eventHandlers={{
                      click: () => handleSelectZone(zone),
                    }}
                  >
                    <Popup>
                      <div className="text-right">
                        <strong className="text-sm font-bold">{zoneName}</strong>
                        <div className="text-xs text-slate-500 mt-1">
                          رسوم التوصيل: {zone.deliveryFee} ج.م
                        </div>
                      </div>
                    </Popup>
                  </Polygon>
                )}

                {/* رسم الدائرة Radius */}
                {zone.coverageType === "RADIUS" && zone.center && (
                  <>
                    <Circle
                      center={zone.center}
                      radius={zone.radiusMeters || 1000}
                      pathOptions={{
                        color: zone.color,
                        fillColor: zone.color,
                        fillOpacity: isSelected ? 0.4 : 0.2,
                        weight: isSelected ? 3 : 2,
                      }}
                      eventHandlers={{
                        click: () => handleSelectZone(zone),
                      }}
                    />
                    <Marker position={zone.center}>
                      <Popup>
                        <div className="text-right">
                          <strong className="text-sm font-bold">{zoneName}</strong>
                          <div className="text-xs text-slate-500 mt-1">
                            نصف القطر: {zone.customRadiusKm} كم
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </Card>

      {/* قائمة المناطق - الجانب الأيمن */}
      <div className="w-full lg:w-96 flex flex-col gap-3 overflow-y-auto pr-1">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-800">مناطق التوصيل</h2>
          </div>
          <Badge variant="secondary" className="rounded-lg font-semibold">
            {parsedZones.length} منطقة
          </Badge>
        </div>

        {parsedZones.map((zone) => {
          const zoneName = isRTL
            ? zone.zone?.displayNameAr || zone.zone?.nameAr || "منطقة غير معنونة"
            : zone.zone?.displayName || zone.zone?.name || "Unnamed Zone";

          const isSelected = selectedZoneId === zone.id;

          return (
            <div
              key={zone.id}
              onClick={() => handleSelectZone(zone)}
              className={`group relative flex flex-col gap-3 p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                isSelected
                  ? "border-primary ring-2 ring-primary/10 shadow-md"
                  : "border-slate-100 hover:border-slate-200 shadow-sm"
              }`}
            >
              {/* شريط مؤشر اللون */}
              <div
                className="absolute top-0 right-0 left-0 h-1 rounded-t-xl"
                style={{ backgroundColor: zone.color }}
              />

              <div className="flex items-start justify-between gap-2 mt-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{zoneName}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {zone.city?.nameAr || zone.city?.name}
                      {zone.branch?.name && ` - ${zone.branch.name}`}
                    </p>
                  </div>
                </div>

                {/* زر التعديل والتوجيه للرابط المطلوب */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1.5 rounded-lg border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/delivery-zones/edit/${zone.id}`);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>تعديل</span>
                </Button>
              </div>

              {/* تفاصيل المنطقة */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>رسوم التوصيل:</span>
                  <span className="font-bold text-slate-800">{zone.deliveryFee} ج.م</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <ShoppingBag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>الحد الأدنى:</span>
                  <span className="font-bold text-slate-800">{zone.minOrderAmount} ج.م</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}