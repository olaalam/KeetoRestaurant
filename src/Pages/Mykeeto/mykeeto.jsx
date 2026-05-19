import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import { ShoppingBag, Landmark, Percent, DollarSign } from "lucide-react";

export default function DetailedFinancialReport() {
  // 1. استخراج فلاتر التاريخ من الـ URL إن وجدت
  const { startDate, endDate } = useParams();

  // 2. جلب تقرير المطعم المالي التفصيلي
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["detailedFinancialReport", startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/report/my-restaurant", {
        params: {
          startDate,
          endDate,
        },
      });
      // الوصول للـ Object الداخلي المليء بالبيانات مباشرة
      return res.data?.data?.data || res.data?.data;
    },
  });

  // استخراج الكائنات المساعدة لتسهيل القراءة وتجنب الأخطاء
  const restaurantInfo = reportData?.restaurant;
  const financials = reportData?.financials;
  const overview = reportData?.overview;

  // 3. تحضير الكروت العلوية بناءً على الحقول الفعلية في الـ JSON
  const statsCards = [
    {
      title: `Grand Total Sales (${restaurantInfo?.name || "Restaurant"})`,
      value: `${financials?.totalRevenue ?? "0.00"} E£`,
      icon: ShoppingBag,
      bgIcon: "bg-orange-100 text-orange-600",
    },
    {
      title: "Delivered Revenue",
      value: `${financials?.deliveredRevenue ?? "0.00"} E£`,
      icon: DollarSign,
      bgIcon: "bg-green-100 text-green-600",
    },
    {
      title: "App Commission (Keeto)",
      value: `${financials?.totalAppCommission ?? "0.00"} E£`,
      icon: Percent,
      bgIcon: "bg-rose-100 text-rose-600",
    },
    {
      title: "Total Orders Count",
      value: overview?.totalOrders ?? 0,
      icon: Landmark,
      bgIcon: "bg-blue-100 text-blue-600",
    },
  ];

  // 4. بناء أعمدة الجدول لتعرض تفاصيل مبيعات الفروع (branchBreakdown) المتواجدة في الـ JSON
  const columns = [
    {
      accessorKey: "branchName",
      header: "Branch Name",
      cell: ({ row }) => (
        <div className="font-bold text-slate-800">
          {row.getValue("branchName")}
        </div>
      ),
    },
    {
      accessorKey: "totalOrders",
      header: "Total Orders",
      cell: ({ row }) => (
        <span className="font-medium font-mono">
          {row.getValue("totalOrders")}
        </span>
      ),
    },
    {
      accessorKey: "deliveredOrders",
      header: "Delivered Orders",
      cell: ({ row }) => (
        <span className="font-medium text-green-600 font-mono">
          {row.getValue("deliveredOrders")}
        </span>
      ),
    },
    {
      accessorKey: "cancelledOrders",
      header: "Cancelled Orders",
      cell: ({ row }) => (
        <span className="font-medium text-rose-600 font-mono">
          {row.getValue("cancelledOrders")}
        </span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total Volume",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-700 font-mono">
          {row.getValue("totalAmount")} E£
        </span>
      ),
    },
    {
      accessorKey: "deliveredAmount",
      header: "Delivered Revenue",
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 font-mono">
          {row.getValue("deliveredAmount")} E£
        </span>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* عرض عنوان التقرير مع اسم المطعم ولوجو المطعم إن وجد */}
      <div className="flex items-center gap-4 mb-4">
        {restaurantInfo?.logo && (
          <img 
            src={restaurantInfo.logo} 
            alt="logo" 
            className="w-12 h-12 rounded-full object-cover border shadow-sm"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Report</h1>
          <p className="text-sm text-slate-500">Reviewing metrics for {restaurantInfo?.name || "your restaurant"}</p>
        </div>
      </div>

      {/* 5. رندر الكروت العلوية الأربعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white border rounded-2xl shadow-sm p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <h2 className="text-2xl font-black mt-1 text-slate-800">
                  {card.value}
                </h2>
              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgIcon}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. جدول تفاصيل الفروع التابع للمطعم */}
      <GenericDataTable
        title="Branches Performance Breakdown"
        columns={columns}
        data={reportData?.branchBreakdown || []}
        isLoading={isLoading}
        queryKey="detailedFinancialReport"
        onEdit={false}
        actions={false}
      />
    </div>
  );
}