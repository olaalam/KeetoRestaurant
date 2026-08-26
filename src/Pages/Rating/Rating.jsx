import React, { useState } from "react";
import { useGet } from "@/hooks/useGet";
import GenericDataTable from "@/components/GenericDataTable";
import { Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";

export default function Rating() {
  const { t } = useTranslation();

  // 1. بيانات التقييمات العامة (General Ratings)
  const { data: statsData, isLoading: isStatsLoading } = useGet("rating-stats", "/api/restaurant/ratings/stats");
  const { data: ratingsData, isLoading: isTableLoading } = useGet("ratings", "/api/restaurant/ratings");

  // 2. بيانات تقييمات العملاء (Customer Ratings) - الـ API الجديد
  const { data: customerRatingsData, isLoading: isCustomerTableLoading } = useGet("customer-ratings", "/api/restaurant/ratings/customer-ratings");

  // --- دوال وحالات التاب الأول (التقييمات العامة) ---
  const [startDateGeneral, setStartDateGeneral] = useState("");
  const [endDateGeneral, setEndDateGeneral] = useState("");

  const stats = statsData?.data?.data || {};
  const ratings = ratingsData?.data?.data || [];

  // فلترة بيانات التقييمات العامة
  const filteredGeneralRatings = ratings.filter((item) => {
    if (!item.createdAt) return true;
    const itemDate = new Date(item.createdAt).toISOString().split("T")[0];
    if (startDateGeneral && itemDate < startDateGeneral) return false;
    if (endDateGeneral && itemDate > endDateGeneral) return false;
    return true;
  });

  // أعمدة التقييمات العامة (General Ratings)
  const generalColumns = [
    { accessorKey: "customer.name", header: t("customerName") || "Customer Name" },
    { accessorKey: "order.orderNumber", header: t("orderNumber") || "Order Number" }, // افتراض وجود بيانات الطلب داخل التقييم العام
    { 
      accessorKey: "rating", 
      header: t("rating") || "Rating",
      cell: ({ row }) => {
        const ratingValue = Number(row.original.rating) || 0;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-bold text-slate-700 text-xs">{ratingValue}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isFilled = starIndex <= ratingValue;
                return (
                  <Star
                    key={starIndex}
                    className={`h-4 w-4 ${isFilled ? "fill-amber-500 text-amber-500" : "fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800"}`}
                  />
                );
              })}
            </div>
          </div>
        );
      }
    },
    { accessorKey: "comment", header: t("comment") || "Comment" },
    { 
      accessorKey: "createdAt", 
      header: t("date") || "Date",
      cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "N/A"
    },
  ];

  // --- دوال وحالات التاب الثاني (الطلبات وتقييماتها) ---
  const [startDateCustomer, setStartDateCustomer] = useState("");
  const [endDateCustomer, setEndDateCustomer] = useState("");

  const customerRatingsResponse = customerRatingsData?.data?.data || customerRatingsData?.data || {};
  const customerRatingsList = customerRatingsResponse?.customers || [];
  const customerSummary = customerRatingsResponse?.summary || {};

  // تجميع وتسطيح الطلبات من بيانات العملاء
  const flattenedCustomerOrders = [];
  customerRatingsList.forEach((item) => {
    const customer = item.customer || {};
    if (item.orders && Array.isArray(item.orders)) {
      item.orders.forEach((order) => {
        flattenedCustomerOrders.push({
          id: order.orderId,
          customerName: customer.name || "N/A",
          customerPhone: customer.phone || "N/A",
          orderNumber: order.orderNumber || "N/A",
          orderCreatedAt: order.orderCreatedAt,
          orderTotalAmount: order.orderTotalAmount || "0.00",
          orderStatus: order.orderStatus || "N/A",
          rating: order.rating || 0,
          ratingComment: order.ratingComment || "",
        });
      });
    }
  });

  // فلترة بيانات الطلبات
  const filteredCustomerOrders = flattenedCustomerOrders.filter((item) => {
    if (!item.orderCreatedAt) return true;
    const orderDate = new Date(item.orderCreatedAt).toISOString().split("T")[0];
    if (startDateCustomer && orderDate < startDateCustomer) return false;
    if (endDateCustomer && orderDate > endDateCustomer) return false;
    return true;
  });

  // أعمدة تفاصيل طلبات العملاء والتقييمات
  const customerOrderColumns = [
    { accessorKey: "customerName", header: t("customerName") || "Customer Name" },
    { accessorKey: "customerPhone", header: t("phone") || "Phone Number" },
    { accessorKey: "orderNumber", header: t("orderNumber") || "Order Number" },
    { 
      accessorKey: "orderTotalAmount", 
      header: t("totalAmount") || "Total Amount",
      cell: ({ row }) => `${row.original.orderTotalAmount}`
    },
    { 
      accessorKey: "rating", 
      header: t("rating") || "Rating",
      cell: ({ row }) => {
        const ratingValue = Number(row.original.rating) || 0;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-bold text-slate-700 text-xs">{ratingValue}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isFilled = starIndex <= ratingValue;
                return (
                  <Star
                    key={starIndex}
                    className={`h-4 w-4 ${isFilled ? "fill-amber-500 text-amber-500" : "fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800"}`}
                  />
                );
              })}
            </div>
          </div>
        );
      }
    },
    { accessorKey: "ratingComment", header: t("comment") || "Comment" },
    { 
      accessorKey: "orderCreatedAt", 
      header: t("date") || "Date",
      cell: ({ row }) => row.original.orderCreatedAt ? new Date(row.original.orderCreatedAt).toLocaleString() : "N/A"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="general" className="space-y-6 w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full flex">
          <TabsTrigger value="general" className="rounded-lg font-bold text-sm p-3 flex-1">
            {t("restaurantRate") || "Restaurant Rate"}
          </TabsTrigger>
          <TabsTrigger value="customer" className="rounded-lg font-bold text-sm p-3 flex-1">
            {t("orderRate") || "Order Rate"}
          </TabsTrigger>
        </TabsList>

        {/* التاب الأول: التقييمات العامة */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm text-center">
                <h3 className="text-sm text-slate-500">{t("averageRating") || "Average Rating"}</h3>
                <p className="text-3xl font-black text-primary">{stats.averageRating || 0}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm text-center">
                <h3 className="text-sm text-slate-500">{t("totalRatings") || "Total Ratings"}</h3>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.totalRatings || 0}</p>
            </div>
          </div>

          {/* فلتر التاريخ للتقييمات العامة */}
          <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">{t("fromDate") || "From Date"}:</span>
              <input 
                type="date" 
                value={startDateGeneral} 
                onChange={(e) => setStartDateGeneral(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">{t("toDate") || "To Date"}:</span>
              <input 
                type="date" 
                value={endDateGeneral} 
                onChange={(e) => setEndDateGeneral(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-slate-800"
              />
            </div>
            {(startDateGeneral || endDateGeneral) && (
              <button 
                onClick={() => { setStartDateGeneral(""); setEndDateGeneral(""); }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                {t("clearFilter") || "Clear Filter"}
              </button>
            )}
          </div>

          <GenericDataTable
            title=""
            columns={generalColumns}
            data={filteredGeneralRatings}
            isLoading={isTableLoading}
            actions={false}
          />
        </TabsContent>

        {/* التاب الثاني: تقييمات العملاء والطلبات */}
        <TabsContent value="customer" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm text-center">
                <h3 className="text-sm text-slate-500">{t("totalRatedOrders") || "Total Rated Orders"}</h3>
                <p className="text-3xl font-black text-primary">{customerSummary.totalRatedOrders || 0}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm text-center">
                <h3 className="text-sm text-slate-500">{t("totalUniqueCustomers") || "Total Unique Customers"}</h3>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{customerSummary.totalUniqueCustomers || 0}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border shadow-sm text-center">
                <h3 className="text-sm text-slate-500">{t("overallAverageRating") || "Overall Average Rating"}</h3>
                <p className="text-3xl font-black text-amber-500">{customerSummary.overallAverageRating || 0}</p>
            </div>
          </div>

          {/* فلتر التاريخ لطلبات العملاء */}
          <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">{t("fromDate") || "From Date"}:</span>
              <input 
                type="date" 
                value={startDateCustomer} 
                onChange={(e) => setStartDateCustomer(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">{t("toDate") || "To Date"}:</span>
              <input 
                type="date" 
                value={endDateCustomer} 
                onChange={(e) => setEndDateCustomer(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm bg-transparent dark:border-slate-800"
              />
            </div>
            {(startDateCustomer || endDateCustomer) && (
              <button 
                onClick={() => { setStartDateCustomer(""); setEndDateCustomer(""); }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                {t("clearFilter") || "Clear Filter"}
              </button>
            )}
          </div>

          <GenericDataTable
            title=""
            columns={customerOrderColumns}
            data={filteredCustomerOrders}
            isLoading={isCustomerTableLoading}
            actions={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}