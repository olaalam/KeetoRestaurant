import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polygon, Circle, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { Pencil, MapPin, DollarSign, ShoppingBag, Layers, CheckCircle2, X, Save, Trash2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGet } from "@/hooks/useGet"; // Hook to fetch data
import { useTranslation } from "@/hooks/useTranslation";
import LoadingSpinner from "@/components/LoadingSpinner";

// 💡 Same function used in DeliveryZoneAdd.jsx to ensure coordinates are always converted to an Array
const parseCoordinatesToArray = (raw) => {
  if (!raw) return [];
  let parsed = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (typeof parsed === "object" && parsed !== null) {
    if ("lat" in parsed || "latitude" in parsed) {
      return [parsed];
    }
    if (Array.isArray(parsed.coordinates)) {
      return parsed.coordinates;
    }
  }

  return [];
};

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom colors for map zones
const ZONE_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
];

// Component to re-center the map when a zone is selected
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      // Using flyTo instead of setView for a clear and smooth animation highlighting the selected zone
      map.flyTo(center, zoom || 14, { duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
};

// 💡 Same logic as MapClickHandler in InteractiveZoneMap.jsx, but applied to the main map 
// so other zones remain visible in their colors during editing
const EditMapClickHandler = ({ enabled, coverageType, setCoordinates }) => {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (coverageType === "RADIUS") {
        setCoordinates([newPoint]);
      } else {
        setCoordinates((prev) => [...prev, newPoint]);
      }
    },
  });
  return null;
};

export default function ZoneMap() {
  const navigate = useNavigate();
  const { isRTL } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [mapCenter, setMapCenter] = useState([31.2001, 29.9187]); // Default: Alexandria

  // 💡 List search by name (Arabic/English), City, or Branch
  const [searchQuery, setSearchQuery] = useState("");

  // 💡 Reference for each drawn shape (Polygon/Marker) on the map to open its Popup programmatically 
  // when selected from the list (not just when clicking on the map itself)
  const zoneLayerRefs = useRef({});

  // 💡 Reference for each card in the list to scroll to it reliably (instead of getElementById)
  const cardRefs = useRef({});

  // ============ 💡 Inline Edit Mode ============
  // Instead of navigating to another page, "Edit" opens a form in place of the list on the same map
  const [editingZone, setEditingZone] = useState(null); // null = Normal list view
  const [editCityId, setEditCityId] = useState("");
  const [editZoneId, setEditZoneId] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editCoverageType, setEditCoverageType] = useState("RADIUS");
  const [editDeliveryFee, setEditDeliveryFee] = useState("0.00");
  const [editMinOrderAmount, setEditMinOrderAmount] = useState("0.00");
  const [editCustomRadiusKm, setEditCustomRadiusKm] = useState("5.00");
  const [editCoordinates, setEditCoordinates] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch City/Zone/Branch lists for the edit form - same endpoint used in DeliveryZoneAdd.jsx
  const { data: selectionData = { zones: [], cities: [], branches: [] } } = useQuery({
    queryKey: ["DeliveryZonesSelect"],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/restaurant-zone-delivery-fees/select");
      const responseData = res.data?.data?.data || res.data?.data || {};
      return {
        zones: responseData.zonesselect || [],
        cities: responseData.citiesselect || [],
        branches: responseData.branchesselect || responseData.branches || [],
      };
    },
    enabled: !!editingZone, // Fetch only when opening edit mode
    staleTime: 5 * 60 * 1000,
  });

  const editFilteredZones = useMemo(() => {
    if (!editCityId) return [];
    return selectionData.zones.filter((z) => String(z.cityId) === String(editCityId));
  }, [editCityId, selectionData.zones]);

  const editFilteredBranches = useMemo(() => {
    if (!editCityId) return [];
    return selectionData.branches.filter((b) => {
      const branchCityId = b.cityId || b.city_id;
      return !branchCityId || String(branchCityId) === String(editCityId);
    });
  }, [editCityId, selectionData.branches]);

  // 1. Fetch delivery zones data from API
  const { data: apiResponse, isLoading, error } = useGet(
    "delivery-zones",
    "/api/restaurant/restaurant-zone-delivery-fees"
  );

  const zonesList = useMemo(() => apiResponse?.data?.data || [], [apiResponse]);

  // 2. Process coordinates and format them for Leaflet
  const parsedZones = useMemo(() => {
    return zonesList.map((item, index) => {
      let coords = [];
      let rawCoords = item.customCoordinates || item.zone?.defaultCoordinates;

      // Parse JSON string if coordinates are stringified
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

      // Calculate the center point to focus the map
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

  // 💡 Filter the list by search - searches zone name (Arabic/English), city, and branch
  // Note: Filtering applies to the list only; the map displays all zones
  const filteredListZones = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return parsedZones;

    return parsedZones.filter((zone) => {
      const haystack = [
        zone.zone?.name,
        zone.zone?.nameAr,
        zone.zone?.displayName,
        zone.zone?.displayNameAr,
        zone.city?.name,
        zone.city?.nameAr,
        zone.branch?.name,
        zone.branch?.nameAr,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [parsedZones, searchQuery]);

  // Focus on the zone when clicked in the list
  const handleSelectZone = (zone) => {
    setSelectedZoneId(zone.id);
    setMapCenter(zone.center);
  };

  // 💡 Start inline edit mode - populate all form fields with zone data from the list
  // (no extra API call needed, data is already in zonesList)
  const handleStartEdit = (zone) => {
    setSelectedZoneId(zone.id);
    setMapCenter(zone.center);
    setEditingZone(zone);

    setEditCityId(String(zone.city?.id || zone.cityId || ""));
    setEditZoneId(String(zone.zone?.id || zone.zoneId || ""));
    setEditBranchId(String(zone.branch?.id || zone.branchId || ""));
    setEditCoverageType(zone.coverageType || "RADIUS");
    setEditDeliveryFee(String(zone.deliveryFee ?? "0.00"));
    setEditMinOrderAmount(String(zone.minOrderAmount ?? "0.00"));
    setEditCustomRadiusKm(String(zone.customRadiusKm || zone.zone?.defaultRadiusKm || "5.00"));

    let rawCoords = zone.customCoordinates;
    if (!rawCoords || (Array.isArray(rawCoords) && rawCoords.length === 0)) {
      rawCoords = zone.zone?.defaultCoordinates || zone.coordinates;
    }
    setEditCoordinates(parseCoordinatesToArray(rawCoords));
  };

  const handleCancelEdit = () => {
    setEditingZone(null);
  };

  // When selecting a different "Zone" from the dropdown, fetch its default data (fees/coords) like the original form
  const handleEditZoneChange = (zoneId) => {
    setEditZoneId(zoneId);
    const zone = selectionData.zones.find((z) => String(z.id) === String(zoneId));
    if (zone) {
      setEditDeliveryFee(zone.deliveryFee || "0.00");
      setEditMinOrderAmount(zone.minOrderAmount || "0.00");
      setEditCoordinates(parseCoordinatesToArray(zone?.coordinates));
      if (zone?.coverageAreaRadiusKm) {
        setEditCustomRadiusKm(String(zone?.coverageAreaRadiusKm));
        setEditCoverageType("RADIUS");
      }
    }
  };

  const handleEditCoverageTypeChange = (isPolygon) => {
    const newType = isPolygon ? "POLYGON" : "RADIUS";
    setEditCoverageType(newType);
    if (newType === "RADIUS" && editCoordinates.length > 1) {
      setEditCoordinates([editCoordinates[0]]);
    }
  };

  // 💡 Save - exactly the same payload built by transformPayload in DeliveryZoneAdd.jsx
  const handleSaveEdit = async () => {
    if (!editingZone) return;
    setIsSaving(true);
    try {
      const payload = {
        cityId: editCityId,
        zoneId: editZoneId,
        branchId: editBranchId,
        coverageType: editCoverageType,
        deliveryFee: parseFloat(editDeliveryFee),
        minOrderAmount: parseFloat(editMinOrderAmount),
        status: "active",
        customCoordinates: editCoordinates,
      };
      if (editCoverageType === "RADIUS") {
        payload.customRadiusKm = parseFloat(editCustomRadiusKm);
      }

      await api.put(`/api/restaurant/restaurant-zone-delivery-fees/${editingZone.id}`, payload);

      // ⚠️ Ensure "delivery-zones" is the same key used by useGet above
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      queryClient.invalidateQueries({ queryKey: ["DeliveryZone"] }); // Also invalidate DeliveryZone.jsx list if open

      setEditingZone(null);
    } catch (err) {
      console.error("Failed to save changes:", err);
      // ⚠️ Replace with your project's toast component if preferred over alert
      alert("Something went wrong while saving");
    } finally {
      setIsSaving(false);
    }
  };

  // 💡 Auto-scrolling happens here in useEffect, not inside handleSelectZone,
  // to work consistently when clicking a row or a map shape.
  // Using requestAnimationFrame instead of random timeouts to ensure DOM readiness.
  useEffect(() => {
    if (selectedZoneId == null) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const card = cardRefs.current[selectedZoneId];
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [selectedZoneId]);

  // 💡 When selectedZoneId changes (whether from row click or map shape click),
  // open its Popup on the map to clearly highlight its location
  useEffect(() => {
    if (selectedZoneId == null) return;
    const timer = setTimeout(() => {
      const layer = zoneLayerRefs.current[selectedZoneId];
      if (layer && layer.openPopup) {
        layer.openPopup();
      }
    }, 350); // After flyTo finishes roughly
    return () => clearTimeout(timer);
  }, [selectedZoneId]);

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <LoadingSpinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:h-[calc(100vh-100px)]">
      {/* Map - Left Side */}
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
            // 💡 If this zone is currently being edited, don't draw its static shape;
            // draw an interactive overlay below instead
            if (editingZone && String(zone.id) === String(editingZone.id)) return null;

            const isSelected = selectedZoneId === zone.id;
            const zoneName = isRTL
              ? zone.zone?.displayNameAr || zone.zone?.nameAr
              : zone.zone?.displayName || zone.zone?.name;

            return (
              <React.Fragment key={zone.id}>
                {/* Draw Polygon */}
                {zone.coverageType === "POLYGON" && zone.parsedCoords.length >= 3 && (
                  <Polygon
                    ref={(el) => { zoneLayerRefs.current[zone.id] = el; }}
                    positions={zone.parsedCoords}
                    pathOptions={{
                      color: isSelected ? "#1e293b" : zone.color,
                      fillColor: zone.color,
                      fillOpacity: isSelected ? 0.55 : 0.25,
                      weight: isSelected ? 4 : 2,
                    }}
                    eventHandlers={{
                      click: () => handleSelectZone(zone),
                    }}
                  >
                    <Popup>
                      <div className="text-start">
                        <strong className="text-sm font-bold">{zoneName}</strong>
                        <div className="text-xs text-slate-500 mt-1">
                          Delivery Fee: {zone.deliveryFee} EGP
                        </div>
                      </div>
                    </Popup>
                  </Polygon>
                )}

                {/* Draw Radius Circle */}
                {zone.coverageType === "RADIUS" && zone.center && (
                  <>
                    <Circle
                      center={zone.center}
                      radius={zone.radiusMeters || 1000}
                      pathOptions={{
                        color: isSelected ? "#1e293b" : zone.color,
                        fillColor: zone.color,
                        fillOpacity: isSelected ? 0.45 : 0.2,
                        weight: isSelected ? 4 : 2,
                      }}
                      eventHandlers={{
                        click: () => handleSelectZone(zone),
                      }}
                    />
                    <Marker
                      ref={(el) => { zoneLayerRefs.current[zone.id] = el; }}
                      position={zone.center}
                      eventHandlers={{
                        click: () => handleSelectZone(zone),
                      }}
                    >
                      <Popup>
                        <div className="text-start">
                          <strong className="text-sm font-bold">{zoneName}</strong>
                          <div className="text-xs text-slate-500 mt-1">
                            Radius: {zone.customRadiusKm} km
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
              </React.Fragment>
            );
          })}

          {/* ============ 💡 Live Edit Overlay - Draws on the same map with other zones ============ */}
          {editingZone && (
            <>
              <EditMapClickHandler
                enabled={true}
                coverageType={editCoverageType}
                setCoordinates={setEditCoordinates}
              />

              {editCoverageType === "RADIUS" && editCoordinates.length > 0 && (
                <>
                  <Circle
                    center={[Number(editCoordinates[0].lat), Number(editCoordinates[0].lng)]}
                    radius={(parseFloat(editCustomRadiusKm) || 0) * 1000}
                    pathOptions={{
                      color: "#0f172a",
                      fillColor: "#facc15",
                      fillOpacity: 0.35,
                      weight: 3,
                      dashArray: "6, 4",
                    }}
                  />
                  <Marker
                    position={[Number(editCoordinates[0].lat), Number(editCoordinates[0].lng)]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        setEditCoordinates([{ lat, lng }]);
                      },
                    }}
                  />
                </>
              )}

              {editCoverageType === "POLYGON" && editCoordinates.length > 0 && (
                <>
                  {editCoordinates.length >= 2 && (
                    <Polygon
                      positions={editCoordinates.map((c) => [Number(c.lat), Number(c.lng)])}
                      pathOptions={{
                        color: "#0f172a",
                        fillColor: "#facc15",
                        fillOpacity: 0.35,
                        weight: 3,
                        dashArray: "6, 4",
                      }}
                    />
                  )}
                  {editCoordinates.map((coord, idx) => (
                    <Marker
                      key={`edit-pt-${idx}`}
                      position={[Number(coord.lat), Number(coord.lng)]}
                      draggable={true}
                      eventHandlers={{
                        dragend: (e) => {
                          const { lat, lng } = e.target.getLatLng();
                          setEditCoordinates((prev) => prev.map((p, i) => (i === idx ? { lat, lng } : p)));
                        },
                      }}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </MapContainer>
      </Card>

      {/* Zones List - Right Side */}
      <div className="w-full lg:w-96 flex flex-col gap-3 overflow-y-auto pr-1 pt-3">
        {editingZone ? (
          // ============ 💡 Inline Edit Form - Replaces the list ============
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
                <h2 className="text-lg font-bold text-slate-800">Edit Zone</h2>
              </div>
            </div>

            <p className="text-xs text-slate-500 -mt-2">
              {editCoverageType === "RADIUS"
                ? "Click once on the map to set the coverage circle center, or drag the pin."
                : "Click multiple points on the map to draw the zone shape (Polygon)."}
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">City</Label>
              <select
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={editCityId}
                onChange={(e) => {
                  setEditCityId(e.target.value);
                  setEditZoneId("");
                  setEditBranchId("");
                }}
              >
                <option value="">Select City</option>
                {selectionData.cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {isRTL ? c.nameAr || c.displayNameAr || c.name : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Zone</Label>
              <select
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                value={editZoneId}
                disabled={!editCityId}
                onChange={(e) => handleEditZoneChange(e.target.value)}
              >
                <option value="">Select Zone</option>
                {editFilteredZones.map((z) => (
                  <option key={z.id} value={String(z.id)}>
                    {isRTL ? z.nameAr || z.displayNameAr || z.name : z.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Branch</Label>
              <select
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                value={editBranchId}
                disabled={!editCityId}
                onChange={(e) => setEditBranchId(e.target.value)}
              >
                <option value="">Select Branch</option>
                {editFilteredBranches.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {isRTL ? b.nameAr || b.name : b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <Label className="text-sm font-semibold">Coverage Type</Label>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${editCoverageType === "RADIUS" ? "text-primary" : "text-slate-400"}`}>
                  RADIUS
                </span>
                <Switch
                  checked={editCoverageType === "POLYGON"}
                  onCheckedChange={handleEditCoverageTypeChange}
                />
                <span className={`text-xs font-medium ${editCoverageType === "POLYGON" ? "text-primary" : "text-slate-400"}`}>
                  POLYGON
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Delivery Fee</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="h-9 text-sm"
                  value={editDeliveryFee}
                  onChange={(e) => setEditDeliveryFee(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Min. Order Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="h-9 text-sm"
                  value={editMinOrderAmount}
                  onChange={(e) => setEditMinOrderAmount(e.target.value)}
                />
              </div>
            </div>

            {editCoverageType === "RADIUS" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Radius (km)</Label>
                <Input
                  type="number"
                  step="0.1"
                  className="h-9 text-sm"
                  value={editCustomRadiusKm}
                  onChange={(e) => setEditCustomRadiusKm(e.target.value)}
                />
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 w-fit"
              onClick={() => setEditCoordinates([])}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Points
            </Button>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                className="flex-1 gap-1.5"
                disabled={isSaving}
                onClick={handleSaveEdit}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleCancelEdit} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-800">Delivery Zones</h2>
          </div>
          <Badge variant="secondary" className="rounded-lg font-semibold">
            {searchQuery ? `${filteredListZones.length} of ${parsedZones.length}` : `${parsedZones.length} Zone(s)`}
          </Badge>
        </div>

        {/* 💡 Name Search Box */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search for a zone by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 h-10 text-sm bg-white rounded-xl shadow-sm border-slate-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {filteredListZones.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-8">
            No matching results for "{searchQuery}"
          </div>
        )}

        {filteredListZones.map((zone) => {
          const zoneName = isRTL
            ? zone.zone?.displayNameAr || zone.zone?.nameAr || "Unnamed Zone"
            : zone.zone?.displayName || zone.zone?.name || "Unnamed Zone";

          const isSelected = selectedZoneId === zone.id;

          return (
            <div
              key={zone.id}
              id={`zone-card-${zone.id}`}
              ref={(el) => { cardRefs.current[zone.id] = el; }}
              onClick={() => handleSelectZone(zone)}
              className={`group relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "shadow-lg scale-[1.02]"
                  : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
              }`}
              style={
                isSelected
                  ? {
                      borderColor: zone.color,
                      backgroundColor: `${zone.color}14`, // Same zone color with slight opacity for background
                      boxShadow: `0 0 0 3px ${zone.color}33, 0 8px 16px -4px ${zone.color}55`,
                    }
                  : undefined
              }
            >
              {/* "Currently Selected" badge clear above the card */}
              {isSelected && (
                <div
                  className="absolute -top-2.5 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: zone.color }}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Currently Selected
                </div>
              )}

              {/* Color indicator bar */}
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

                {/* Edit button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1.5 rounded-lg border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(zone);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
              </div>

              {/* Zone Details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Delivery Fee:</span>
                  <span className="font-bold text-slate-800">{zone.deliveryFee} EGP</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <ShoppingBag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Min. Order:</span>
                  <span className="font-bold text-slate-800">{zone.minOrderAmount} EGP</span>
                </div>
              </div>
            </div>
          );
        })}
          </>
        )}
      </div>
    </div>
  );
}