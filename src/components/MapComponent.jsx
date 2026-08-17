import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { Input } from "@/components/ui/input";
import MapClickHandler from "./MapClickHandler";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { Search, MapPin, Loader2 } from "lucide-react";

// إصلاح مشكلة أيقونات Leaflet الافتراضية
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center.lat && center.lng) {
            map.setView([center.lat, center.lng], map.getZoom());
        }
    }, [center, map]);
    return null;
};

const MapEvents = ({ handleMapClick, isMapClickEnabled }) => {
    const map = useMap();
    useEffect(() => {
        if (handleMapClick && isMapClickEnabled) {
            map.on('click', handleMapClick);
            return () => { map.off('click', handleMapClick); };
        }
    }, [map, handleMapClick, isMapClickEnabled]);
    return null;
};

const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords.lat && coords.lng) {
            map.setView([coords.lat, coords.lng], 14);
        }
    }, [coords, map]);
    return null;
};

const MapComponent = ({
    selectedLocation,
    setSelectedLocation,
    locationName,
    setLocationName,
    handleMapClick,
    form,
    onMarkerDragEnd,
    isMapClickEnabled,
    radiusKm, // 💡 استقبال قيمة الكيلومترات هنا
}) => {
    const watchedAddress = form.watch("address");
    
    // 💡 1. مراقبة حقول الـ lat والـ lng داخل الفورم عند تغييرهم يدوياً
    const watchedLat = form.watch("lat");
    const watchedLng = form.watch("lng");

    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // 💡 2. تحويل قيمة الكيلومترات إلى أمتار لأن مكتبة Leaflet تتوقع الأبعاد بالمتر
    const radiusInMeters = (parseFloat(radiusKm) || 0) * 1000;

    // 💡 3. تأثير جانبي لتحديث موقع الخريطة والـ Marker فوراً عند الكتابة اليدوية داخل الحقول
    useEffect(() => {
        const latNum = parseFloat(watchedLat);
        const lngNum = parseFloat(watchedLng);

        // التأكد من أن القيم المدخلة هي أرقام صالحة
        if (!isNaN(latNum) && !isNaN(lngNum)) {
            // شرط لمنع الـ Infinite Loop + التأكد من أن الدالة ممررة وموجودة 💡
            if (latNum !== selectedLocation.lat || lngNum !== selectedLocation.lng) {
                if (typeof setSelectedLocation === "function") {
                    setSelectedLocation({ lat: latNum, lng: lngNum });
                }
            }
        }
    }, [watchedLat, watchedLng, selectedLocation, setSelectedLocation]);

    // دالة جلب الاقتراحات من خوادم OpenStreetMap أثناء الكتابة
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

    const handleSelectSuggestion = (place) => {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        const displayName = place.display_name;

        if (setSelectedLocation) {
            setSelectedLocation({ lat, lng });
        }
        
        setLocationName(displayName);
        form.setValue("address", displayName, { shouldValidate: true });
        setSuggestions([]);
        setSearchQuery("");
    };

    return (
        <div className="relative rounded-2xl overflow-hidden shadow-lg h-[460px] flex flex-col bg-white">
            
            {/* صندوق البحث العائم فوق الخريطة */}
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

                    {/* قائمة الاقتراحات المنسدلة */}
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
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ChangeView center={selectedLocation} />
                        <Marker
                            position={selectedLocation}
                            draggable={true}
                            eventHandlers={{
                                dragend: onMarkerDragEnd,
                            }}
                        />
                        <MapEvents
                            handleMapClick={handleMapClick}
                            isMapClickEnabled={isMapClickEnabled}
                        />
                        {/* 💡 ربط نصف قطر الدائرة بالمتر بدلاً من 500 الثابتة */}
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
                        Loading Map...
                    </div>
                )}
            </div>

            {/* حقل الإدخال اليدوي أسفل الخريطة */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0">
                <Input
                    value={watchedAddress || locationName}
                    onChange={(e) => {
                        setLocationName(e.target.value);
                        form.setValue("address", e.target.value, { shouldValidate: true });
                    }}
                    placeholder="العنوان المحدد الحالي"
                    className="w-full bg-white rounded-xl shadow-sm border-slate-200 h-9 text-sm"
                />
            </div>
        </div>
    );
};

export default MapComponent;