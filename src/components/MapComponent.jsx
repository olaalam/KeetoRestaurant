import { MapContainer, TileLayer, Marker, Circle, Polygon, Popup, useMap, useMapEvents } from "react-leaflet";
import { Input } from "@/components/ui/input";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

// نفس باليتة الألوان المستخدمة في صفحة ZoneMap الرئيسية
// عشان كل منطقة تبقى واضحة بلونها بدل ما كلهم يبقوا رمادي موحد
const ZONE_COLORS = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
    "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
];

// إصلاح مشكلة أيقونات Leaflet الافتراضية
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 1. دالة الـ Geocode المساعدة (لجلب العنوان عند النقر أو السحب)[cite: 9]
export const tryGeocode = async (lat, lng, form) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en,ar&addressdetails=1`,
            { method: "GET", headers: { Accept: "application/json" } }
        );
        if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
                form.setValue("address", data.display_name, { shouldValidate: true, shouldDirty: true });
                return;
            }
        }
    } catch (error) { console.warn("Nominatim failed:", error); }

    try {
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`
        );
        if (response.ok) {
            const data = await response.json();
            if (data && (data.display_name || data.locality)) {
                const address = data.display_name || `${data.locality}, ${data.countryName}`;
                form.setValue("address", address, { shouldValidate: true, shouldDirty: true });
                return;
            }
        }
    } catch (error) { console.warn("BigDataCloud failed:", error); }

    const fallbackAddress = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    form.setValue("address", fallbackAddress, { shouldValidate: true, shouldDirty: true });
};

// 2. مكون تحريك الخريطة بسلاسة وبشكل واضح (FlyTo)[cite: 11]
const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords?.lat && coords?.lng) {
            // استخدام flyTo بدل setView لحركة واضحة وجميلة
            map.flyTo([coords.lat, coords.lng], 15, { duration: 1.5 });
        }
    }, [coords, map]);
    return null;
};

// 3. مكون التقاط النقر على الخريطة (والعكس)[cite: 10]
const MapEventsHandler = ({ form, setLocationState, isEnabled }) => {
    useMapEvents({
        click: async (e) => {
            if (!isEnabled) return;
            const { lat, lng } = e.latlng;
            
            // تحديث الدبوس والإحداثيات
            setLocationState({ lat, lng });
            form.setValue("lat", String(lat), { shouldDirty: true, shouldValidate: true });
            form.setValue("lng", String(lng), { shouldDirty: true, shouldValidate: true });
            
            // "والعكس": جلب العنوان وتحديث الحقل
            await tryGeocode(lat, lng, form);
        }
    });
    return null;
};

const MapComponent = ({
    selectedLocation,
    setLocationState, // 💡 نستقبلها من ZoneAdd للربط المباشر
    form,
    isMapClickEnabled = true,
    radiusKm, 
    backgroundZones = [],
}) => {
    const watchedAddress = form.watch("address");
    
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const radiusInMeters = (parseFloat(radiusKm) || 0) * 1000;

    useEffect(() => {
        if (searchQuery.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=en,ar&limit=5`
                );
                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data);
                }
            } catch (error) {
                console.error("Search geocoding failed:", error);
            } finally {
                setIsSearching(false);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // عند النقر على نتيجة من قائمة البحث (الليست)
    const handleSelectSuggestion = (place) => {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        const displayName = place.display_name;

        // 1. تحديث مكان الخريطة (هتتحرك بشكل واضح بسبب FlyTo)[cite: 6]
        if (setLocationState) {
            setLocationState({ lat, lng });
        }
        
        // 2. تحديث الفورم بالبيانات والعنوان
        form.setValue("lat", String(lat), { shouldDirty: true, shouldValidate: true });
        form.setValue("lng", String(lng), { shouldDirty: true, shouldValidate: true });
        form.setValue("address", displayName, { shouldDirty: true, shouldValidate: true });
        
        setSuggestions([]);
        setSearchQuery("");
    };

    // عند سحب الدبوس يدويًا (والعكس)
    const onMarkerDragEnd = async (e) => {
        const { lat, lng } = e.target.getLatLng();
        
        if (setLocationState) {
            setLocationState({ lat, lng });
        }
        form.setValue("lat", String(lat), { shouldDirty: true, shouldValidate: true });
        form.setValue("lng", String(lng), { shouldDirty: true, shouldValidate: true });
        
        // جلب اسم المنطقة
        await tryGeocode(lat, lng, form);
    };

    return (
        <div className="relative rounded-2xl overflow-hidden shadow-lg h-[460px] flex flex-col bg-white">
            {/* صندوق البحث العائم */}
            <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md mx-auto">
                 <div className="relative shadow-md rounded-xl bg-white border border-slate-200 overflow-visible">
                    <div className="flex items-center px-3 py-1">
                        <Search className="text-slate-400 h-5 w-5 shrink-0" />
                        <input
                            type="text"
                            placeholder="البحث عن منطقة، شارع، معلم..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 px-3 text-sm font-medium border-none outline-none focus:ring-0 bg-transparent text-slate-800"
                        />
                        {isSearching && (
                            <Loader2 className="animate-spin text-primary h-4 w-4 shrink-0" />
                        )}
                    </div>

                    {suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-[105%] bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-[9999] py-1.5 divide-y divide-slate-50">
                            {suggestions.map((place) => (
                                <button
                                    key={place.place_id}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(place)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-2.5 text-xs font-medium text-slate-600"
                                    style={{ direction: 'rtl', textAlign: 'right' }}
                                >
                                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{place.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* الخريطة */}
            <div className="w-full h-[380px] relative z-10">
                {selectedLocation.lat && selectedLocation.lng ? (
                    <MapContainer
                        center={selectedLocation}
                        zoom={13}
                        scrollWheelZoom={true}
                        className="w-full h-full"
                        style={{ minHeight: "100%" }}
                    >
                        <RecenterMap coords={selectedLocation} />
                        
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {/* الخلفيات - كل منطقة بلونها الخاص عشان تبقى كل الرسومات ظاهرة ومميزة عن بعض */}
                        {backgroundZones.map((zone, bgIndex) => {
                            let coords = [];
                            let rawCoords = zone.customCoordinates || zone.zone?.defaultCoordinates;
                            
                            if (typeof rawCoords === "string") {
                                try { rawCoords = JSON.parse(rawCoords); } catch (e) { rawCoords = []; }
                            }
                            if (Array.isArray(rawCoords)) {
                                coords = rawCoords.map((pt) => [parseFloat(pt.lat), parseFloat(pt.lng)]).filter((pt) => !isNaN(pt[0]) && !isNaN(pt[1]));
                            }

                            const zoneColor = ZONE_COLORS[bgIndex % ZONE_COLORS.length];
                            const zoneName = zone.zone?.displayName || zone.zone?.name || zone.name || "منطقة أخرى";

                            if (zone.coverageType === "POLYGON" && coords.length >= 3) {
                                return (
                                    <Polygon
                                        key={`bg-poly-${zone.id}`}
                                        positions={coords}
                                        pathOptions={{ color: zoneColor, fillColor: zoneColor, fillOpacity: 0.25, weight: 2 }}
                                    >
                                        <Popup>
                                            <div className="text-right text-xs font-semibold">{zoneName}</div>
                                        </Popup>
                                    </Polygon>
                                );
                            }

                            if (zone.coverageType === "RADIUS" && coords.length > 0) {
                                const radiusKmBg = parseFloat(zone.customRadiusKm || zone.zone?.defaultRadiusKm || 0);
                                if (radiusKmBg > 0) {
                                    return (
                                        <Circle
                                            key={`bg-circle-${zone.id}`}
                                            center={coords[0]}
                                            radius={radiusKmBg * 1000}
                                            pathOptions={{ color: zoneColor, fillColor: zoneColor, fillOpacity: 0.2, weight: 2 }}
                                        >
                                            <Popup>
                                                <div className="text-right text-xs font-semibold">{zoneName}</div>
                                            </Popup>
                                        </Circle>
                                    );
                                }
                            }
                            return null;
                        })}

                        <Marker
                            position={selectedLocation}
                            draggable={true}
                            eventHandlers={{ dragend: onMarkerDragEnd }}
                        >
                            <Popup>
                                <div className="text-right text-xs font-bold">📍 المنطقة الحالية</div>
                            </Popup>
                        </Marker>
                        
                        <MapEventsHandler 
                            form={form} 
                            setLocationState={setLocationState} 
                            isEnabled={isMapClickEnabled} 
                        />

                        {radiusInMeters > 0 && (
                            <Circle
                                center={selectedLocation}
                                pathOptions={{ fillColor: 'blue', color: 'blue' }}
                                radius={radiusInMeters}
                            />
                        )}
                    </MapContainer>
                ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
                        جاري تحميل الخريطة...
                    </div>
                )}
            </div>

            {/* حقل الإدخال يعرض العنوان المحدث دائمًا */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0">
                <Input
                    value={watchedAddress || ""}
                    onChange={(e) => form.setValue("address", e.target.value, { shouldValidate: true })}
                    placeholder="العنوان المحدد الحالي سيظهر هنا..."
                    className="w-full bg-white rounded-xl shadow-sm border-slate-200 h-9 text-sm"
                />
            </div>
        </div>
    );
};

export default MapComponent;