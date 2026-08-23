import React from "react";
import { useGet } from "@/hooks/useGet";
import GenericDataTable from "@/components/GenericDataTable";
import { Star } from "lucide-react";

export default function Rating() {
  // جلب البيانات
  const { data: statsData, isLoading: isStatsLoading } = useGet("rating-stats", "/api/restaurant/ratings/stats");
  const { data: ratingsData, isLoading: isTableLoading } = useGet("ratings", "/api/restaurant/ratings");

  const stats = statsData?.data?.data || {};
  const ratings = ratingsData?.data?.data || [];

  // تعريف الأعمدة للجدول
  const columns = [
    { accessorKey: "customer.name", header: "اسم العميل" },
    { 
      accessorKey: "rating", 
      header: "التقييم",
      cell: ({ row }) => {
        const ratingValue = Number(row.original.rating) || 0;
        
        return (
          <div className="flex items-center justify-center gap-1.5">
            {/* عرض رقم التقييم اختياري بجانب النجوم */}
            <span className="font-bold text-slate-700 text-xs">{ratingValue}</span>
            
            {/* رسم 5 نجوم */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isFilled = starIndex <= ratingValue;
                return (
                  <Star
                    key={starIndex}
                    className={`h-4 w-4 ${
                      isFilled 
                        ? "fill-amber-500 text-amber-500" 
                        : "fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        );
      }
    },
    { accessorKey: "comment", header: "التعليق" },
    { 
      accessorKey: "createdAt", 
      header: "التاريخ",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* قسم الإحصائيات (Header Summary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border shadow-sm text-center">
            <h3 className="text-sm text-slate-500">متوسط التقييم</h3>
            <p className="text-3xl font-black text-primary">{stats.averageRating || 0}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border shadow-sm text-center">
            <h3 className="text-sm text-slate-500">إجمالي التقييمات</h3>
            <p className="text-3xl font-black text-slate-800">{stats.totalRatings || 0}</p>
        </div>
      </div>

      {/* الجدول */}
      <GenericDataTable
        title="التقييمات"
        columns={columns}
        data={ratings}
        isLoading={isTableLoading}
        actions={false}
      />
    </div>
  );
}