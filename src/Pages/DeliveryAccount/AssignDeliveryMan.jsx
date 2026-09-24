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
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export default function AssignDeliveryMan() {
  const { t } = useTranslation();

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
  const [note, setNote] = useState("");

  // Set default note translated when component mounts or language changes
  useEffect(() => {
    setNote(t("defaultAssignNote") || "يرجى توصيل الطلبات في أسرع وقت");
  }, [t]);

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

  // Selected driver object
  const selectedDeliveryMan = useMemo(() => {
    return deliveryMenList.find(
      (m) => String(m.id || m.deliveryManId) === String(selectedDeliveryManId)
    );
  }, [deliveryMenList, selectedDeliveryManId]);

  // 3. Fetch pending orders (Pending / Accept / Prepare)
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

  // Mutation for assigning orders
  const assignOrdersMutation = usePost(
    "/api/restaurant/delivery-men/assign-orders",
    "post",
    "pendingOrders" // Revalidate pending orders after success
  );

  // Toggle order selection from pending orders
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
    return pendingOrders
      .filter((o) => selectedOrderIds.includes(o.id))
      .reduce((sum, o) => sum + (Number(o.totalAmount || o.amount) || 0), 0);
  }, [pendingOrders, selectedOrderIds]);

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

        {/* ==================== Section 2: Pending Orders (Selectable) ==================== */}
        <Card className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[540px]">
          <div className="bg-gray-50/80 border-b border-gray-100 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-gray-800 text-sm">
                  {t("pendingOrdersTitle")}
                </h2>
              </div>
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                {pendingOrders.length} {t("orders")}
              </Badge>
            </div>
            {/* Select All Button */}
            {pendingOrders.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={toggleSelectAllOrders}
                  className="text-xs font-bold text-primary hover:underline"
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
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">{t("loading")}</span>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="text-xs font-semibold text-gray-500">
                  {t("noPendingOrders")}
                </p>
              </div>
            ) : (
              pendingOrders.map((order) => {
                const orderNum = order.dailyOrderNumber || order.code || order.id;
                const total = order.totalAmount || order.amount || 0;
                const formattedAddress = parseAddress(order.shippingAddress || order.address, t("noAddress"));
                const customerName = order.customerName || t("customer");
                const customerPhone = order.customerPhone || "-";
                
                const isChecked = selectedOrderIds.includes(order.id);

                return (
                  <div
                    key={order.id || orderNum}
                    onClick={() => toggleOrderSelection(order.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                      isChecked
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                        : "border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200"
                    }`}
                  >
                    {/* Order Number & Status with Checkbox */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                        <span className="text-xs font-black text-gray-900 dir-ltr">
                          #{orderNum}
                        </span>
                      </div>
                      {renderStatusBadge(order.status)}
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center justify-between text-xs text-gray-700 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 font-bold truncate">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{customerName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-[11px] dir-ltr">
                        <Phone className="w-3 h-3" />
                        <span>{customerPhone}</span>
                      </div>
                    </div>

                    {/* Address & Total */}
                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-gray-100/80 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{formattedAddress}</span>
                      </div>
                      <div className="text-emerald-600 font-black text-xs shrink-0">
                        {total} {t("currencyEGP")}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ==================== Section 3: Summary (ملخص التعيين) ==================== */}
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
                {selectedOrderIds.length} {t("orders")}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4 flex-1 overflow-y-auto space-y-3 bg-gray-50/30">
            {!selectedDeliveryManId ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 text-center p-4">
                <User className="w-8 h-8 text-gray-300" />
                <p className="text-xs font-semibold">
                  {t("selectDeliveryManFirst") }
                </p>
              </div>
            ) : selectedOrderIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 text-center p-4">
                <Package className="w-8 h-8 text-gray-300" />
                <p className="text-xs font-semibold">
                  {t("noOrdersToCollect") }
                </p>
              </div>
            ) : (
              pendingOrders
                .filter((order) => selectedOrderIds.includes(order.id))
                .map((order) => {
                  const orderNum = order.dailyOrderNumber || order.code || order.id;
                  return (
                    <div key={order.id} className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-gray-900 dir-ltr">#{orderNum}</span>
                        <span className="text-[10px] text-gray-500 font-bold truncate max-w-[120px]">
                          {order.customerName || t("customer")}
                        </span>
                      </div>
                      <div className="text-emerald-600 font-black text-xs bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        {order.totalAmount || order.amount} {t("currencyEGP")}
                      </div>
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>

      </div>

      {/* Note Field */}
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
      </div>

      {/* ==================== Footer Action Cards ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        {/* Selected Orders Summary */}
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

        {/* Selected Total Cash */}
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

        {/* Submit Action Button */}
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
                <span>{t("assignOrders")}</span>
              </>
            )}
          </Button>
        </Card>

      </div>
    </div>
  );
}