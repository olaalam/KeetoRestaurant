import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import { 
  ShoppingBag, Landmark, Percent, DollarSign, 
  TrendingUp, CreditCard, Utensils, Globe, AlertTriangle
} from "lucide-react";

export default function DetailedFinancialReport() {
  const { startDate, endDate } = useParams();

  // 1. جلب تقرير المطعم المالي التفصيلي من الـ API
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["detailedFinancialReport", startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/report/my-restaurant", {
        params: { startDate, endDate },
      });
      return res.data?.data?.data || null;
    },
  });

  // استخراج الكائنات المساعدة لتسهيل القراءة وتجنب تكرار Optional Chaining
  const restaurantInfo = reportData?.restaurant;
  const financials = reportData?.financials;
  const overview = reportData?.overview;

  // 2. تحضير الكروت المالية العلوية الأساسية
  const statsCards = [
    {
      title: "Grand Total Sales",
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

  // 3. بناء أعمدة جدول "تفاصيل أداء الفروع"
  const branchColumns = [
    {
      accessorKey: "branchName",
      header: "Branch Name",
      cell: ({ row }) => <div className="font-bold text-slate-800">{row.getValue("branchName") || "N/A"}</div>,
    },
    {
      accessorKey: "totalOrders",
      header: "Total Orders",
      cell: ({ row }) => <span className="font-medium font-mono">{row.getValue("totalOrders") ?? 0}</span>,
    },
    {
      accessorKey: "deliveredOrders",
      header: "Delivered Orders",
      cell: ({ row }) => <span className="font-medium text-green-600 font-mono">{row.getValue("deliveredOrders") ?? 0}</span>,
    },
    {
      accessorKey: "cancelledOrders",
      header: "Cancelled Orders",
      cell: ({ row }) => <span className="font-medium text-rose-600 font-mono">{row.getValue("cancelledOrders") ?? 0}</span>,
    },
    {
      accessorKey: "totalAmount",
      header: "Total Volume",
      cell: ({ row }) => <span className="font-semibold text-slate-700 font-mono">{row.getValue("totalAmount")} E£</span>,
    },
    {
      accessorKey: "deliveredAmount",
      header: "Delivered Revenue",
      cell: ({ row }) => <span className="font-bold text-emerald-600 font-mono">{row.getValue("deliveredAmount")} E£</span>,
    },
  ];

  // 4. بناء أعمدة الجداول الصغيرة التحليلية (لحالة الطلب، الدفع، المصدر، والنوع)
  const breakdownColumns = [
    {
      accessorKey: "typeLabel", // حقل وهمي سنقوم بدمجه ديناميكياً بناءً على نوع الجدول
      header: "Category",
      cell: ({ row }) => <span className="font-semibold text-slate-700 capitalize">{row.getValue("typeLabel")}</span>,
    },
    {
      accessorKey: "count",
      header: "Orders Count",
      cell: ({ row }) => <span className="font-medium font-mono">{row.getValue("count") ?? 0}</span>,
    },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      cell: ({ row }) => <span className="font-bold text-slate-950 font-mono">{row.getValue("totalAmount") ?? "0.00"} E£</span>,
    },
  ];

  // تحضير البيانات الفرعية وتوحيد مسمى حقل الفئة (Category) لتتناسب مع الـ breakdownColumns
  const ordersByStatusData = reportData?.ordersByStatus?.map(item => ({ ...item, typeLabel: item.status.replace(/_/g, ' ') })) || [];
  const ordersByPaymentData = reportData?.ordersByPayment?.map(item => ({ ...item, typeLabel: item.paymentMethod.replace(/_/g, ' ') })) || [];
  const ordersByTypeData = reportData?.ordersByType?.map(item => ({ ...item, typeLabel: item.orderType.replace(/_/g, ' ') })) || [];
  const ordersBySourceData = reportData?.ordersBySource?.map(item => ({ ...item, typeLabel: item.orderSource.replace(/_/g, ' ') })) || [];

  // فحص ما إذا كان صافي الربح سالباً أم موجباً لتغيير اللون تبعا للـ JSON المرفق (صافي الربح فيه سالب -163.50)
  const isNetNegative = parseFloat(financials?.netRevenue || "0") < 0;

  return (
    <div className="container mx-auto py-10 space-y-8">
      
      {/* هيدر التقرير ومعلومات المطعم */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          {restaurantInfo?.logo && (
            <img 
              src={restaurantInfo.logo} 
              alt="logo" 
              className="w-14 h-14 rounded-full object-cover border shadow-sm"
            />
          )}
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Detailed Financial Report</h1>
            <p className="text-sm text-slate-500 font-medium">
              Reviewing complete analytics for <span className="text-slate-800 font-bold">{restaurantInfo?.name || "your restaurant"}</span>
            </p>
          </div>
        </div>
        
        {/* شارة حالة المطعم */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-400">Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${restaurantInfo?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {restaurantInfo?.status || "Unknown"}
          </span>
        </div>
      </div>

      {/* 5. رندر الكروت العلوية الأربعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white border rounded-2xl shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</p>
                <h2 className="text-2xl font-black mt-1 text-slate-800 font-mono">{card.value}</h2>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgIcon}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. قسم تفاصيل الأرباح الإضافية وصافي الربح (Financial Breakdown & Net Revenue) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" /> Additional Financial Metrics
          </h3>
          <div className="divide-y text-sm">
            <div className="flex justify-between py-2"><span className="text-slate-500">Subtotal</span><span className="font-semibold font-mono">{financials?.totalSubtotal ?? "0.00"} E£</span></div>
            <div className="flex justify-between py-2"><span className="text-slate-500">Delivery Fees</span><span className="font-semibold font-mono">{financials?.totalDeliveryFees ?? "0.00"} E£</span></div>
            <div className="flex justify-between py-2"><span className="text-slate-500">Service Fees</span><span className="font-semibold font-mono">{financials?.totalServiceFees ?? "0.00"} E£</span></div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-500" /> Operational Overview
          </h3>
          <div className="divide-y text-sm">
            <div className="flex justify-between py-2"><span className="text-slate-500">Avg Order Value</span><span className="font-semibold font-mono">{overview?.avgOrderValue ?? "0.00"} E£</span></div>
            <div className="flex justify-between py-2"><span className="text-slate-500">Cancellation Rate</span><span className="font-semibold text-rose-600 font-mono">{overview?.cancellationRate ?? "0%"}</span></div>
            <div className="flex justify-between py-2"><span className="text-slate-500">Cancelled Orders</span><span className="font-semibold text-rose-600 font-mono">{overview?.cancelledOrders ?? 0}</span></div>
          </div>
        </div>

        {/* كارت صافي الربح الملون ديناميكياً */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-center items-center text-center shadow-sm ${isNetNegative ? 'bg-rose-50/60 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${isNetNegative ? 'text-rose-600' : 'text-emerald-600'}`}>Net Revenue (After Commission)</p>
          <h2 className={`text-3xl font-black mt-2 font-mono ${isNetNegative ? 'text-rose-700' : 'text-emerald-700'}`}>
            {financials?.netRevenue ?? "0.00"} E£
          </h2>
          <p className="text-xs text-slate-400 mt-1">Total revenue minus app commission & expenses</p>
        </div>
      </div>

      {/* 7. المحور الجديد: شبكة الجداول التحليلية المتقدمة المصاحبة للـ Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* جدول الطلبات بحسب الحالة */}
        <GenericDataTable
          title="Orders by Status"
          columns={breakdownColumns}
          data={ordersByStatusData}
          isLoading={isLoading}
          queryKey="ordersByStatus"
          onEdit={false}
          actions={false}
        />

        {/* جدول الطلبات بحسب طريقة الدفع */}
        <GenericDataTable
          title="Orders by Payment Method"
          columns={breakdownColumns}
          data={ordersByPaymentData}
          isLoading={isLoading}
          queryKey="ordersByPayment"
          onEdit={false}
          actions={false}
        />

        {/* جدول الطلبات بحسب نوع الطلب */}
        <GenericDataTable
          title="Orders by Type"
          columns={breakdownColumns}
          data={ordersByTypeData}
          isLoading={isLoading}
          queryKey="ordersByType"
          onEdit={false}
          actions={false}
        />

        {/* جدول الطلبات بحسب مصدر الطلب */}
        <GenericDataTable
          title="Orders by Source"
          columns={breakdownColumns}
          data={ordersBySourceData}
          isLoading={isLoading}
          queryKey="ordersBySource"
          onEdit={false}
          actions={false}
        />

      </div>

      {/* 8. جدول تفاصيل الفروع التابع للمطعم (الأساسي) */}
      <div className="pt-4">
        <GenericDataTable
          title="Branches Performance Breakdown"
          columns={branchColumns}
          data={reportData?.branchBreakdown || []}
          isLoading={isLoading}
          queryKey="detailedFinancialReportBranches"
          onEdit={false}
          actions={false}
        />
      </div>

    </div>
  );
}