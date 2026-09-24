import React, { useState, useMemo } from "react";
import { useGet } from "@/hooks/useGet";
import GenericDataTable from "@/components/GenericDataTable";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Phone, User, Truck, Package, Banknote, Wallet } from "lucide-react";

export default function OutForDelivery() {
  const { t } = useTranslation();
  const [selectedDeliveryManId, setSelectedDeliveryManId] = useState("all");

  // 1. جلب البيانات من API الطلبات المسندة
  const { data: assignedOrdersRes, isLoading: isLoadingOrders } = useGet(
    ["assignedOrders"],
    "/api/restaurant/delivery-men/assigned-orders"
  );

  // 2. معالجة وتجهيز البيانات من الـ Response
  const { deliveryMenList, formattedOrders } = useMemo(() => {
    const rawDeliveryMen = assignedOrdersRes?.data?.data || [];
    
    if (!Array.isArray(rawDeliveryMen)) {
      return { deliveryMenList: [], formattedOrders: [] };
    }

    // قائمة المناديب للاستخدام في القائمة المنسدلة (Select)
    const dmList = rawDeliveryMen.map((dm) => ({
      id: dm.id,
      name: dm.name,
    }));

    // تصفية المناديب حسب اختيار الفلتر
    const filteredDms = selectedDeliveryManId === "all"
      ? rawDeliveryMen
      : rawDeliveryMen.filter((dm) => dm.id === selectedDeliveryManId);

    // تجميل واستخراج الطلبات (Flatten Orders) وإضافة اسم المندوب لكل طلب
    const orders = [];
    filteredDms.forEach((dm) => {
      if (Array.isArray(dm.orders)) {
        dm.orders.forEach((order) => {
          orders.push({
            ...order,
            deliveryManName: dm.name,
            deliveryManPhone: dm.phone,
          });
        });
      }
    });

    return { deliveryMenList: dmList, formattedOrders: orders };
  }, [assignedOrdersRes, selectedDeliveryManId]);

  // 3. حساب الإحصائيات للكروت العلوية (يتم تحديثها تلقائياً عند فلترة المندوب)
  const stats = useMemo(() => {
    let totalOrders = formattedOrders.length;
    let totalCash = 0;
    let cashOnHand = 0;

    formattedOrders.forEach((order) => {
      const amount = parseFloat(order.totalAmount) || 0;
      totalCash += amount;
      
      // إذا كان الطلب مُسلم، يتم إضافته لعهدة الكاش
      if (order.status?.toLowerCase() === "delivered") {
        cashOnHand += amount;
      }
    });

    return { totalOrders, totalCash, cashOnHand };
  }, [formattedOrders]);

  // 4. إعداد أعمدة الجدول
  const columns = useMemo(
    () => [
      {
        accessorKey: "dailyOrderNumber",
        header: t("orderNumber", "رقم الطلب"),
        cell: ({ row }) => (
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {row.getValue("dailyOrderNumber") || `#${row.original.id?.slice(0, 8)}`}
          </span>
        ),
      },
      {
        accessorKey: "customerName",
        header: t("customerName", "العميل"),
        cell: ({ row }) => {
          const name = row.getValue("customerName") || "-";
          const phone = row.original.customerPhone;
          return (
            <div className="flex flex-col items-center">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{name}</span>
              {phone && (
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> {phone}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "deliveryManName",
        header: t("deliveryMan", "مندوب التوصيل"),
        cell: ({ row }) => {
          const name = row.getValue("deliveryManName") || "-";
          return (
            <div className="flex items-center gap-1.5 justify-center font-medium text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-slate-400" />
              <span>{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: t("amount", "المبلغ الإجمالي"),
        cell: ({ row }) => (
          <span className="font-bold text-slate-600 dark:text-slate-400">
            {row.getValue("totalAmount")} {t("currency", "ج.م")}
          </span>
        ),
      },
      {
        accessorKey: "cashOnHand",
        header: t("cashOnHandColumn", "الكاش المحصل"),
        cell: ({ row }) => {
          const status = (row.original.status || "").toLowerCase();
          // عرض المبلغ فقط إذا كانت الحالة تم التسليم، غير ذلك نعرض شرطة
          if (status === "delivered") {
            return (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {row.original.totalAmount} {t("currency", "ج.م")}
              </span>
            );
          }
          return <span className="text-slate-400 font-bold">-</span>;
        },
      },
      {
        accessorKey: "status",
        header: t("status", "الحالة"),
        cell: ({ row }) => {
          const status = (row.getValue("status") || "").toLowerCase();
          let badgeStyle = "bg-slate-100 text-slate-600";
          let label = status;

          if (status === "out_for_delivery") {
            badgeStyle = "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";
            label = t("outForDelivery", "خرج للتوصيل");
          } else if (status === "pending") {
            badgeStyle = "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
            label = t("pending", "قيد الانتظار");
          } else if (status === "delivered") {
            badgeStyle = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
            label = t("delivered", "تم التسليم");
          }

          return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
              {label}
            </span>
          );
        },
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6 w-full">
      
      {/* الكروت الإحصائية (Stats Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* كارت إجمالي الطلبات */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{t("totalOrdersCard", "إجمالي الطلبات")}</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {stats.totalOrders}
            </h3>
          </div>
        </div>

        {/* كارت إجمالي النقدية */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{t("totalCashCard", "إجمالي النقدية")}</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {stats.totalCash.toFixed(2)} {t("currency", "ج.م")}
            </h3>
          </div>
        </div>

        {/* كارت الكاش المحصل فعلياً */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{t("cashOnHandCard", "الكاش المحصل (في اليد)")}</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {stats.cashOnHand.toFixed(2)} {t("currency", "ج.م")}
            </h3>
          </div>
        </div>
      </div>

      {/* شريط الفلترة بالمناديب */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {t("selectDeliveryMan", "فلترة بحسب المندوب:")}
          </label>
          <Select
            value={selectedDeliveryManId}
            onValueChange={setSelectedDeliveryManId}
            disabled={isLoadingOrders}
          >
            <SelectTrigger className="w-full sm:w-[280px] bg-slate-50 border-slate-200">
              <SelectValue placeholder={t("loading", "جاري التحميل...")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allDeliveryMen", "جميع المناديب")}</SelectItem>
              {deliveryMenList.map((dm) => (
                <SelectItem key={dm.id} value={dm.id}>
                  {dm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl">
          <Truck className="w-4 h-4 text-blue-500" />
          <span>{t("totalAssignedOrdersList", "الطلبات بالقائمة:")} <b>{formattedOrders.length}</b></span>
        </div>
      </div>

      {/* جدول عرض الطلبات */}
      <GenericDataTable
        title={t("assignedOrdersTitle", "الطلبات المسندة للمناديب")}
        columns={columns}
        data={formattedOrders}
        isLoading={isLoadingOrders}
        actions={false}
        queryKey="assignedOrders"
      />
    </div>
  );
}