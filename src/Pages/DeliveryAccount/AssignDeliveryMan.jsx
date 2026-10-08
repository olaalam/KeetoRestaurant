import React, { useState, useMemo, useEffect } from "react";
import {
  Bike,
  Package,
  MapPin,
  User,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  AlertCircle,
  Truck,
  Check,
  Store,
  Phone,
  Wallet,
  Eye,
  ExternalLink,
  Banknote,
  CreditCard,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGet } from "@/hooks/useGet";
import { usePost } from "@/hooks/usePost";
import { useTranslation } from "@/hooks/useTranslation";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "sonner";

// Helper function to safely parse shipping address JSON string
const parseAddress = (addressRaw, defaultText = "") => {
  if (!addressRaw) return defaultText;
  if (typeof addressRaw === "object") {
    return addressRaw.fulladdress || addressRaw.street || addressRaw.title || defaultText;
  }
  try {
    const parsed = JSON.parse(addressRaw);
    return parsed.fulladdress || parsed.street || parsed.title || defaultText;
  } catch {
    return String(addressRaw);
  }
};

// Safely parse a JSON string (or return the object as-is). Returns null if it is not JSON.
const parseJsonSafe = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

// Delivery zone name: customer address zone first, then the branch zone as a fallback
const getZoneName = (order, isRTL) => {
  const pick = (obj, en, ar) =>
    obj ? (isRTL ? obj[ar] || obj[en] : obj[en] || obj[ar]) || null : null;
  const address = parseJsonSafe(order.shippingAddress || order.address);
  const branch = parseJsonSafe(order.branchSnapshot);
  return (
    pick(address, "addressZoneName", "addressZoneNameAr") ||
    order.zoneName ||
    pick(branch, "zoneName", "zoneNameAr") ||
    null
  );
};

// Google Maps links (open in a new tab + embeddable preview).
const getMapsLinks = (addressObj, fallbackText) => {
  const hasCoords =
    addressObj?.lat != null &&
    addressObj?.lng != null &&
    Number.isFinite(Number(addressObj.lat)) &&
    Number.isFinite(Number(addressObj.lng));
  const query = hasCoords
    ? `${Number(addressObj.lat)},${Number(addressObj.lng)}`
    : addressObj?.fulladdress || fallbackText;
  if (!query) return null;
  const encoded = encodeURIComponent(query);
  return {
    openUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    embedUrl: `https://maps.google.com/maps?q=${encoded}&z=16&output=embed`,
  };
};

// Order type chip
const getOrderTypeInfo = (type, t) => {
  const key = String(type || "").toLowerCase();
  if (!key) return null;
  if (key === "delivery") {
    return { label: t("orderTypeDelivery") || "دليفري", Icon: Truck, className: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (key === "takeaway" || key === "pickup") {
    return { label: t("orderTypeTakeaway") || "استلام من الفرع", Icon: Store, className: "bg-sky-50 text-sky-700 border-sky-200" };
  }
  if (key === "dine_in" || key === "dinein") {
    return { label: t("orderTypeDineIn") || "داخل المطعم", Icon: Store, className: "bg-violet-50 text-violet-700 border-violet-200" };
  }
  return { label: String(type), Icon: Package, className: "bg-gray-50 text-gray-700 border-gray-200" };
};

// Payment chip
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const getPaymentInfo = (order, t) => {
  const raw =
    order.paymentMethodName ||
    order.paymentMethod?.name ||
    order.paymentType ||
    order.paymentMethod;
  if (!raw || typeof raw !== "string" || UUID_RE.test(raw)) return null;
  if (/cash|كاش|نقد/i.test(raw)) {
    return { label: t("paymentCash") || "كاش", Icon: Banknote, className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  return { label: raw, Icon: CreditCard, className: "bg-blue-50 text-blue-700 border-blue-200" };
};

export default function AssignDeliveryMan() {
  const { t, isRTL } = useTranslation();
  const [note, setNote] = useState("");

  // 1. Get branchId from Auth Store
  const userBranchId = useAuthStore((state) => state.user?.branchId || state.branchId);
  const [selectedBranchId, setSelectedBranchId] = useState(userBranchId || "");

  useEffect(() => {
    if (userBranchId) {
      setSelectedBranchId(userBranchId);
    }
  }, [userBranchId]);

  // Selection states
  const [selectedDeliveryManId, setSelectedDeliveryManId] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [addressOrder, setAddressOrder] = useState(null);

  // useEffect(() => {
  //   setNote(t("defaultAssignNote") || "يرجى توصيل الطلبات في أسرع وقت");
  // }, [t]);

  // 2. Fetch active delivery drivers
  const { data: deliveryMenRes, isFetching: isFetchingDeliveryMen } = useGet(
    ["deliveryMenList"],
    "/api/restaurant/delivery-men"
  );

  const deliveryMenList = useMemo(() => {
    const raw = deliveryMenRes?.data?.data || deliveryMenRes?.data || deliveryMenRes || [];
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => item.isActive === true);
  }, [deliveryMenRes]);

  const selectedDeliveryMan = useMemo(() => {
    return deliveryMenList.find(
      (m) => String(m.id || m.deliveryManId) === String(selectedDeliveryManId)
    );
  }, [deliveryMenList, selectedDeliveryManId]);

  // 3. Fetch pending orders
  const { data: pendingOrdersRes, isFetching: isFetchingPending } = useGet(
    ["pendingOrders", selectedBranchId],
    "/api/restaurant/delivery-men/pending-orders",
    selectedBranchId ? { branchId: selectedBranchId } : {}
  );

  const pendingOrders = useMemo(() => {
    const raw = pendingOrdersRes?.data?.data?.orders || pendingOrdersRes?.orders || pendingOrdersRes?.data?.data || pendingOrdersRes?.data || pendingOrdersRes || [];
    if (!Array.isArray(raw)) return [];
    
    return raw.filter((order) => {
      const status = (order.status || "").toLowerCase();
      return status === "accept" || status === "prepare" || status === "pending" || !order.status;
    });
  }, [pendingOrdersRes]);

  // قائمة الطلبات المتاحة فقط (التي لم يتم تحديدها بعد)
  const availableOrders = useMemo(() => {
    return pendingOrders.filter((order) => !selectedOrderIds.includes(order.id));
  }, [pendingOrders, selectedOrderIds]);

  // قائمة الطلبات المحددة (التي تم اختيارها)
  const selectedOrders = useMemo(() => {
    return pendingOrders.filter((order) => selectedOrderIds.includes(order.id));
  }, [pendingOrders, selectedOrderIds]);

  // Mutation for assigning orders
  const assignOrdersMutation = usePost(
    "/api/restaurant/delivery-men/assign-orders",
    "post",
    "pendingOrders"
  );

  // Toggle order selection
  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Toggle select all pending orders
  const toggleSelectAllOrders = () => {
    if (selectedOrderIds.length === pendingOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(pendingOrders.map((o) => o.id));
    }
  };

  // Calculate total cash of selected pending orders
  const totalSelectedCash = useMemo(() => {
    return selectedOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.amount) || 0), 0);
  }, [selectedOrders]);

  // Submit assignment
  const handleAssignSubmit = () => {
    if (!selectedDeliveryManId) {
      toast.error(t("selectDeliveryManFirst") || "الرجاء اختيار مندوب التوصيل أولاً");
      return;
    }
    if (selectedOrderIds.length === 0) {
      toast.error(t("selectOrdersFirst") || "الرجاء تحديد الطلبات أولاً");
      return;
    }

    const payload = {
      deliveryManId: selectedDeliveryManId,
      orderIds: selectedOrderIds,
      note: note,
    };

    assignOrdersMutation.mutate(payload, {
      onSuccess: () => {
        setSelectedOrderIds([]);
        toast.success(t("ordersAssignedSuccessfully") || "تم تعيين الطلبات للمندوب بنجاح");
      },
    });
  };

  // Render status badge
  const renderStatusBadge = (statusKey) => {
    const status = (statusKey || "").toLowerCase();
    switch (status) {
      case "accept":
      case "accepted":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">{t("statusAccepted")}</Badge>;
      case "prepare":
      case "preparing":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold">{t("statusPreparing")}</Badge>;
      case "out_for_delivery":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">{t("statusOutForDelivery")}</Badge>;
      case "delivered":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">{t("statusDelivered")}</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] font-bold">{t("statusPending")}</Badge>;
    }
  };

  // Address dialog data
  const dialogAddressObj = addressOrder
    ? parseJsonSafe(addressOrder.shippingAddress || addressOrder.address)
    : null;
  const dialogAddressText = addressOrder
    ? parseAddress(addressOrder.shippingAddress || addressOrder.address, t("noAddress"))
    : "";
  const dialogMaps = addressOrder ? getMapsLinks(dialogAddressObj, dialogAddressText) : null;
  const dialogZone = addressOrder ? getZoneName(addressOrder, isRTL) : null;
  const dialogRows = dialogAddressObj
    ? [
        [t("addressTitle") || "اسم العنوان", dialogAddressObj.title],
        [t("street") || "الشارع", dialogAddressObj.street],
        [t("building") || "المبنى", dialogAddressObj.building],
        [t("floor") || "الدور", dialogAddressObj.floor],
        [t("apartment") || "الشقة", dialogAddressObj.apartment],
        [t("landmark") || "علامة مميزة", dialogAddressObj.landmark],
        [t("phone") || "الهاتف", dialogAddressObj.phone],
      ].filter(([, value]) => value)
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Page */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {t("deliveryManagement")}
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              {t("assignOrdersToDeliveryMan")}
            </p>
          </div>
        </div>

        {selectedBranchId && (
          <Badge className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" />
            <span>{t("branchId")}: {selectedBranchId}</span>
          </Badge>
        )}
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ==================== Section 1: Active Delivery Drivers ==================== */}
        <Card className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[540px]">
          <div className="bg-gray-50/80 border-b border-gray-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-gray-800 text-sm">
                {t("activeDeliveryMen")}
              </h2>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              {deliveryMenList.length} {t("active")}
            </Badge>
          </div>

          <CardContent className="p-4 flex-1 overflow-y-auto space-y-2">
            {isFetchingDeliveryMen ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">{t("loading")}</span>
              </div>
            ) : deliveryMenList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <AlertCircle className="w-8 h-8 text-amber-500" />
                <p className="text-xs font-semibold">{t("noActiveDeliveryMen")}</p>
              </div>
            ) : (
              deliveryMenList.map((man) => {
                const manId = man.id || man.deliveryManId;
                const isSelected = String(manId) === String(selectedDeliveryManId);

                return (
                  <button
                    key={manId}
                    type="button"
                    onClick={() => setSelectedDeliveryManId(manId)}
                    className={`w-full p-3.5 rounded-2xl border text-start transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                      }`}>
                        {man.image && man.image.startsWith("data:image") ? (
                          <img src={man.image} alt={man.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          (man.name || "D")?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {man.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {man.phone || "-"}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ==================== Section 2: Pending Orders (Movable to Card 3) ==================== */}
        <Card className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[540px]">
          <div className="bg-gray-50/80 border-b border-gray-100 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                <h2 className="font-bold text-gray-800 text-sm">
                  {t("pendingOrdersTitle")}
                </h2>
              </div>
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                {availableOrders.length} {t("orders")}
              </Badge>
            </div>
            
            {pendingOrders.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={toggleSelectAllOrders}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors"
                >
                  {selectedOrderIds.length === pendingOrders.length
                    ? t("deselectAll") || "إلغاء التحديد"
                    : t("selectAll") || "تحديد الكل"}
                </button>
              </div>
            )}
          </div>

          <CardContent className="p-4 flex-1 overflow-y-auto space-y-3">
            {isFetchingPending ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs">{t("loading")}</span>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="text-xs font-semibold text-gray-500 text-center">
                  {pendingOrders.length === 0
                    ? t("noPendingOrders")
                    : "تم اختيار جميع الطلبات وتنقلها للكرت الثالث"}
                </p>
              </div>
            ) : (
              availableOrders.map((order) => {
                const orderNum = order.dailyOrderNumber || order.code || order.id;
                const total = order.totalAmount || order.amount || 0;
                const formattedAddress = parseAddress(order.shippingAddress || order.address, t("noAddress"));
                const customerName = order.customerName || t("customer");
                const customerPhone = order.customerPhone || "-";
                const zoneName = getZoneName(order, isRTL);
                const orderTypeInfo = getOrderTypeInfo(order.orderType, t);
                const paymentInfo = getPaymentInfo(order, t);

                return (
                  <div
                    key={order.id || orderNum}
                    onClick={() => toggleOrderSelection(order.id)}
                    className="p-3.5 rounded-2xl border border-gray-200/80 bg-white hover:bg-amber-50/30 hover:border-amber-300 cursor-pointer transition-all space-y-2.5 shadow-2xs"
                  >
                    {/* Order Number & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 dir-ltr">
                          #{orderNum}
                        </span>
                      </div>
                      {renderStatusBadge(order.status)}
                    </div>

                    {/* Zone */}
                    <div className="flex items-center gap-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 px-3 py-2 text-amber-950">
                      <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-amber-800/80 block leading-tight">
                          {t("zone") || "المنطقة"}
                        </span>
                        <span className="truncate text-base font-extrabold text-amber-950 leading-tight block">
                          {zoneName || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Chips */}
                    {(orderTypeInfo || paymentInfo) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {orderTypeInfo && (
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${orderTypeInfo.className}`}>
                            <orderTypeInfo.Icon className="w-3 h-3" />
                            {orderTypeInfo.label}
                          </span>
                        )}
                        {paymentInfo && (
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${paymentInfo.className}`}>
                            <paymentInfo.Icon className="w-3 h-3" />
                            {paymentInfo.label}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Customer Info */}
                    <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 font-bold truncate">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate text-gray-800">{customerName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-[11px] dir-ltr font-medium">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{customerPhone}</span>
                      </div>
                    </div>

                    {/* Address & Price Bar */}
                    <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5 text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate font-medium">{formattedAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddressOrder(order);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          {t("view") || "عرض"}
                        </button>
                        <span className="text-emerald-700 font-extrabold text-xs bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-lg">
                          {total} {t("currencyEGP")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ==================== Section 3: Summary (Click to Remove & Return) ==================== */}
        <Card className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[540px]">
          <div className="bg-primary/10 border-b border-primary/10 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Truck className="w-5 h-5 text-primary shrink-0" />
                <h2 className="font-bold text-primary text-sm truncate">
                  {selectedDeliveryMan
                    ? selectedDeliveryMan.name
                    : " " + (t("noDeliveryManSelected"))}
                </h2>
              </div>
              <Badge className="bg-white text-primary border border-primary/20 text-xs font-semibold shadow-sm">
                {selectedOrders.length} {t("orders")}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4 flex-1 overflow-y-auto space-y-3 bg-gray-50/30">
            {!selectedDeliveryManId ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 text-center p-4">
                <User className="w-8 h-8 text-gray-300" />
                <p className="text-xs font-semibold">
                  {t("selectDeliveryManFirst")}
                </p>
              </div>
            ) : selectedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 text-center p-4">
                <Package className="w-8 h-8 text-gray-300" />
                <p className="text-xs font-semibold">
                  {t("noOrdersToCollect")}
                </p>
              </div>
            ) : (
              selectedOrders.map((order) => {
                const orderNum = order.dailyOrderNumber || order.code || order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => toggleOrderSelection(order.id)}
                    title="اضغط لإزالة الطلب وإعادته للطلبات المعلقة"
                    className="p-3 bg-white hover:bg-red-50/50 hover:border-red-200 rounded-xl border border-gray-200 flex items-center justify-between shadow-2xs cursor-pointer transition-all group"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-gray-900 dir-ltr">#{orderNum}</span>
                      <span className="text-[10px] text-gray-500 font-bold truncate max-w-[120px]">
                        {order.customerName || t("customer")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-emerald-600 font-black text-xs bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        {order.totalAmount || order.amount} {t("currencyEGP")}
                      </div>
                      <button
                        type="button"
                        className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

      </div>

      {/* Note Field
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
        <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          {t("noteTitle") || "ملاحظات للمندوب"}
        </label>
        <Input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("enterNotePlaceholder") || "اكتب ملاحظاتك هنا..."}
          className="h-11 rounded-xl bg-gray-50 border-gray-200 text-sm"
        />
      </div> */}

      {/* Address Dialog */}
      <Dialog
        open={!!addressOrder}
        onOpenChange={(open) => {
          if (!open) setAddressOrder(null);
        }}
      >
        <DialogContent
          dir={isRTL ? "rtl" : "ltr"}
          aria-describedby={undefined}
          className="w-full overflow-hidden rounded-3xl p-0"
        >
          <DialogHeader className="p-5 pb-2">
            <DialogTitle className="flex items-center gap-2 text-base font-black text-gray-900">
              <MapPin className="w-5 h-5 text-primary" />
              <span>{t("addressDetails") || "تفاصيل العنوان"}</span>
              {addressOrder && (
                <span className="text-xs font-bold text-gray-400 dir-ltr">
                  #{addressOrder.dailyOrderNumber || addressOrder.code || addressOrder.id}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {addressOrder && (
            <div className="max-h-[75vh] space-y-4 overflow-y-auto px-5 pb-5">
              <div className="flex items-center gap-2.5 rounded-xl bg-primary px-3 py-2.5 text-white">
                <MapPin className="w-6 h-6 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold opacity-80">{t("zone") || "المنطقة"}</p>
                  <p className="truncate text-xl font-black leading-tight">{dialogZone || "—"}</p>
                </div>
              </div>

              <p className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm font-semibold leading-relaxed text-gray-800">
                {dialogAddressObj?.fulladdress || dialogAddressText}
              </p>

              {dialogRows.length > 0 && (
                <dl className="grid grid-cols-2 gap-2">
                  {dialogRows.map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-gray-100 bg-white p-2.5">
                      <dt className="text-[10px] font-semibold text-gray-400">{label}</dt>
                      <dd className="mt-0.5 break-words text-xs font-bold text-gray-800">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {dialogMaps && (
                <>
                  <iframe
                    title="map"
                    src={dialogMaps.embedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-56 w-full rounded-2xl border border-gray-200"
                  />
                  <a
                    href={dialogMaps.openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("openInGoogleMaps") || "فتح في Google Maps"}
                  </a>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <Card className="rounded-3xl border border-gray-100 shadow-sm bg-gradient-to-br from-blue-50/50 to-white p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-1">
              {t("totalOrdersSelected") || "الطلبات المحددة"}
            </p>
            <h3 className="text-2xl font-black text-gray-900">
              {selectedOrderIds.length}{" "}
              <span className="text-xs font-medium text-gray-400">
                / {pendingOrders.length}
              </span>
            </h3>
          </div>
        </Card>

        <Card className="rounded-3xl border border-gray-100 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-1">
              {t("totalCashSelected") || "إجمالي المبالغ للطلبات"}
            </p>
            <h3 className="text-2xl font-black text-emerald-600">
              {totalSelectedCash} {t("currencyEGP")}
            </h3>
          </div>
        </Card>

        <Card className="rounded-3xl border border-gray-100 shadow-sm bg-gradient-to-br from-primary/5 to-white p-4 flex items-center justify-center">
          <Button
            onClick={handleAssignSubmit}
            disabled={
              assignOrdersMutation.isPending ||
              !selectedDeliveryManId ||
              selectedOrderIds.length === 0
            }
            className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/25 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {assignOrdersMutation.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 dir-rtl:rotate-180" />
                <span>{t("outfordelivery")}</span>
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}