import React, { useState, useMemo, useEffect } from "react";
import { useGet } from "@/hooks/useGet";
import GenericDataTable from "@/components/GenericDataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banknote, Receipt, Wallet, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { usePost } from "@/hooks/usePost";
import { useTranslation } from "@/hooks/useTranslation";


export default function CollectDeliveryCash() {
  const { t } = useTranslation();
  const [selectedDeliveryManId, setSelectedDeliveryManId] = useState("all");
  const [note, setNote] = useState(t("defaultCollectNote", "Cash fully collected from delivery man"));
  
  // State لحفظ الطلبات المحددة
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // تصفير التحديد عند تغيير المندوب
  useEffect(() => {
    setSelectedOrderIds([]);
  }, [selectedDeliveryManId]);

  // 1. Fetch active delivery men
  const { data: deliveryMenRes, isLoading: isLoadingMen } = useGet(
    ["deliveryMen", "active"],
    "/api/restaurant/delivery-men",
    { isActive: true }
  );
  
  const deliveryMen = Array.isArray(deliveryMenRes) 
    ? deliveryMenRes 
    : Array.isArray(deliveryMenRes?.data) 
      ? deliveryMenRes.data 
      : Array.isArray(deliveryMenRes?.data?.data)
        ? deliveryMenRes.data.data
        : [];

  // 2. Fetch stats and orders for the selected delivery man
  const { data: collectRes, isLoading: isLoadingCollect } = useGet(
    ["collectCash", selectedDeliveryManId],
    "/api/restaurant/delivery-men/collect-cash",
    selectedDeliveryManId !== "all" ? { deliveryManId: selectedDeliveryManId } : {}
  );

  const responseData = collectRes?.data?.data || collectRes?.data || collectRes || {};
  const summary = responseData.summary || {};
  
  const totalOrders = summary.totalCashOrders || 0;
  const cashWithDeliveryMan = summary.cashWithDeliveryMan || "0.00";
  const cashOnHand = summary.cashOnHand || "0.00";
  const rawOrders = responseData.orders;
  const orders = Array.isArray(rawOrders) ? rawOrders : [];

  // 3. Collect cash mutation function
  const { mutate: collectCashMutation, isPending: isCollecting } = usePost(
    "/api/restaurant/delivery-men/collect-cash",
    "post",
    "collectCash"
  );

  // 4. Execute collection using ONLY selected orders
  const handleCollect = () => {
    if (selectedDeliveryManId === "all") {
      toast.error(t("errorSelectDeliveryMan", "Please select a specific delivery man first to complete collection"));
      return;
    }
    
    if (selectedOrderIds.length === 0) {
      toast.error(t("errorNoOrdersSelected", "Please select at least one order to collect"));
      return;
    }

    collectCashMutation(
      {
        deliveryManId: selectedDeliveryManId,
        orderIds: selectedOrderIds, // إرسال الأوردرات المحددة فقط
        note,
      },
      {
        onSuccess: () => {
          setNote(t("defaultCollectNote", "Cash fully collected from delivery man"));
          setSelectedOrderIds([]); // تصفير التحديد بعد النجاح
          
          const currentIndex = deliveryMen.findIndex(
            (dm) => dm.id === selectedDeliveryManId
          );
          
          if (currentIndex !== -1 && currentIndex + 1 < deliveryMen.length) {
            const nextDeliveryMan = deliveryMen[currentIndex + 1];
            setSelectedDeliveryManId(nextDeliveryMan.id);
            toast.success(`${t("successCollectedAutoMove", "Collected successfully! Auto-moved to:")} ${nextDeliveryMan.name || nextDeliveryMan.firstName}`);
          } else {
            setSelectedDeliveryManId("all");
            toast.success(t("successCollectedDone", "Collected successfully. No more delivery men in the list."));
          }
        },
      }
    );
  };

  // دوال التحكم في الـ Checkboxes
  const toggleOrderSelection = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    // تحديد الطلبات اللي لسه متحصلتش فقط
    const selectableOrders = orders.filter((o) => !o.isCashCollected);
    if (selectedOrderIds.length === selectableOrders.length && selectableOrders.length > 0) {
      setSelectedOrderIds([]); // إلغاء تحديد الكل
    } else {
      setSelectedOrderIds(selectableOrders.map((o) => o.id || o.orderId)); // تحديد الكل
    }
  };

  // 5. Table columns 
  const columns = useMemo(
    () => [
      {
        id: "selection",
        // Checkbox لتحديد الكل
        header: () => (
          <input
            type="checkbox"
            className="w-4 h-4 cursor-pointer accent-emerald-600"
            checked={
              orders.filter(o => !o.isCashCollected).length > 0 &&
              selectedOrderIds.length === orders.filter(o => !o.isCashCollected).length
            }
            onChange={toggleSelectAll}
          />
        ),
        cell: ({ row }) => {
          const order = row.original;
          const id = order.id || order.orderId;
          const isCollected = order.isCashCollected; // الاعتماد على الـ Key

          // لو متحصل يظهر علامة صح، لو لأ يظهر Checkbox عشان نختاره
          if (isCollected) {
            return <CheckCircle className="w-5 h-5 text-emerald-500" />;
          }

          return (
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer accent-emerald-600"
              checked={selectedOrderIds.includes(id)}
              onChange={() => toggleOrderSelection(id)}
            />
          );
        },
      },
      { accessorKey: "dailyOrderNumber", header: t("orderNumber", "Order Number") },
      { accessorKey: "customerName", header: t("customerName", "Customer Name") },
      { 
        accessorKey: "totalAmount", 
        header: t("amount", "Amount"), 
        cell: ({ row }) => <span className="font-bold">{row.getValue("totalAmount")} {t("currency", "EGP")}</span> 
      },
      {
        // العمود الجديد الخاص بـ Cash on Hand
        accessorKey: "cashOnHandCol",
        header: t( "CashonHand"),
        cell: ({ row }) => {
          const order = row.original;
          const status = (order.status || "").toLowerCase();
          
          if (status === "delivered") {
            return <span className="font-bold text-emerald-600">{order.totalAmount} {t("currency", "EGP")}</span>;
          }
          return <span className="text-slate-400 font-bold text-lg">-</span>;
        }
      },
      { 
        accessorKey: "paymentMethodName", 
        header: t("paymentMethod", "Payment Method") 
      },
      { 
        accessorKey: "status", 
        header: t("status", "Status"),
        cell: ({ row }) => {
            const status = row.getValue("status");
            if (status === "delivered") return <span className="text-emerald-600 font-medium">{t("statusDelivered", "Delivered")}</span>;
            if (status === "pending") return <span className="text-amber-600 font-medium">{t("statusPending", "Pending")}</span>;
            return status;
        }
      }
    ],
    [t, orders, selectedOrderIds] // إضافة Dependencies المهمة
  );

  return (
    <div className="space-y-6 w-full">
      {/* Filter and Delivery Man Selection Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
            {t("selectDeliveryMan", "Select Delivery Man:")}
          </label>
          <Select
            value={selectedDeliveryManId}
            onValueChange={setSelectedDeliveryManId}
            disabled={isLoadingMen}
          >
            <SelectTrigger className="w-full sm:w-[280px] bg-slate-50 border-slate-200">
              <SelectValue placeholder={t("loading", "Loading...")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allDeliveryMen", "All Delivery Men")}</SelectItem>
              {deliveryMen.map((dm) => (
                <SelectItem key={dm.id} value={dm.id}>
                  {dm.name || dm.firstName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Collect Button and Note Field */}
        {selectedDeliveryManId !== "all" && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Input 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("collectionNotePlaceholder", "Collection note...")}
              className="w-full sm:w-[250px] bg-slate-50 text-xs"
            />
            <Button 
              onClick={handleCollect} 
              disabled={isCollecting || selectedOrderIds.length === 0} // تعطيل الزر لو مفيش أوردرات متحددة
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm transition-all"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {t("collectCashButton", "Collect Cash")} ({selectedOrderIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* Statistics Section (Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{t("totalOrders", "Total Orders")}</p>
            <h4 className="text-2xl font-bold text-slate-800">{totalOrders}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{t("withDeliveryMan", "With Delivery Man")}</p>
            <h4 className="text-2xl font-bold text-slate-800">{cashWithDeliveryMan} {t("currency", "EGP")}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{t("cashOnHand", "Cash On Hand")}</p>
            <h4 className="text-2xl font-bold text-slate-800">{cashOnHand} {t("currency", "EGP")}</h4>
          </div>
        </div>
      </div>

      {/* Orders Table fetched from Custom Component */}
      <GenericDataTable
        title={t("cashDeliveryOrdersTitle", "Cash Delivery Orders")}
        columns={columns}
        data={orders}
        isLoading={isLoadingCollect}
        actions={false} 
        queryKey="collectCash"
      />
    </div>
  );
}