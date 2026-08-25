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

  const stats = statsData?.data?.data || {};
  const ratings = ratingsData?.data?.data || [];
  
  // استخراج البيانات بناءً على هيكل الـ Response
  const customerRatingsResponse = customerRatingsData?.data?.data || customerRatingsData?.data || {};
  const customerRatingsList = customerRatingsResponse?.customers || [];
  const customerSummary = customerRatingsResponse?.summary || {};

  // أعمدة التقييمات العامة (مترجمة)
  const generalColumns = [
    { accessorKey: "customer.name", header: t("customerName") || "Customer Name" },
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

  // أعمدة تقييمات العملاء (مترجمة)
  const customerColumns = [
    { accessorKey: "name", header: t("customerName") || "Customer Name" },
    { accessorKey: "phone", header: t("phone") || "Phone Number" },
    { accessorKey: "totalOrders", header: t("totalOrders") || "Total Orders" },
    { 
      accessorKey: "averageRating", 
      header: t("averageRating") || "Average Rating",
      cell: ({ row }) => {
        const ratingValue = Number(row.original.averageRating) || 0;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-bold text-slate-700 text-xs">{ratingValue.toFixed(1)}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isFilled = starIndex <= Math.round(ratingValue);
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
  ];

  return (
    <div className="p-6 space-y-6">
      {/* استخدام Shadcn Tabs للتبديل بين القسمين */}
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

          <GenericDataTable
            title=""
            columns={generalColumns}
            data={ratings}
            isLoading={isTableLoading}
            actions={false}
          />
        </TabsContent>

        {/* التاب الثاني: تقييمات العملاء */}
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

          <GenericDataTable
            title=""
            columns={customerColumns}
            data={customerRatingsList}
            isLoading={isCustomerTableLoading}
            actions={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}