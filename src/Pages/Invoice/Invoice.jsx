import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import { 
  FileText, Eye, Percent, DollarSign, 
  ArrowUpRight, ArrowDownLeft, Calendar, ShieldAlert
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Invoice() {
  const { startDate, endDate } = useParams();
  const { t } = useTranslation(); // تفعيل هوك الترجمة

  // 1. جلب بيانات الفواتير من الـ API
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["restaurantInvoices", startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/report/my-invoices", {
        params: { startDate, endDate },
      });
      return res.data?.data?.data || [];
    },
  });

  // الحماية هنا لضمان عدم انهيار التطبيق أثناء الـ Loading
  const currentInvoice = invoicesData?.[0] || {};

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const response = await api.get(`/api/restaurant/report/my-restaurant/${invoiceId}/invoice`, {
        responseType: 'blob' 
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoiceId}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download invoice PDF:", error);
      alert(t("downloadErrorAlert")); // تنبيه معرب ومترجم عند الفشل
    }
  };

  // 2. تحضير الكروت المالية بناءً على بيانات الفاتورة الجديدة
  const statsCards = [
    {
      title: t("totalGrossSales"),
      value: `${currentInvoice?.totalGrossSales ?? "0.00"} ${t("currency")}`,
      icon: DollarSign,
      bgIcon: "bg-orange-100 text-orange-600",
    },
    {
      title: t("totalCommission"),
      value: `${currentInvoice?.totalCommission ?? "0.00"} ${t("currency")}`,
      icon: Percent,
      bgIcon: "bg-rose-100 text-rose-600",
    },
    {
      title: t("platformOwesRestaurant"),
      value: `${currentInvoice?.platformOwesRestaurant ?? "0.00"} ${t("currency")}`,
      icon: ArrowDownLeft,
      bgIcon: "bg-green-100 text-green-600",
    },
    {
      title: t("restaurantOwesPlatform"),
      value: `${currentInvoice?.restaurantOwesPlatform ?? "0.00"} ${t("currency")}`,
      icon: ArrowUpRight,
      bgIcon: "bg-amber-100 text-amber-600",
    },
  ];

  // 3. بناء أعمدة جدول الفواتير (Invoices Columns)
  const invoiceColumns = [
    {
      accessorKey: "invoiceNumber",
      header: t("invoiceNumber"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          {row.getValue("invoiceNumber")}
        </div>
      ),
    },
    {
      accessorKey: "totalOrders",
      header: t("totalOrders"),
      cell: ({ row }) => <span className="font-medium font-mono">{row.getValue("totalOrders") ?? 0}</span>,
    },
    {
      accessorKey: "totalCashCollected",
      header: t("cashCollected"),
      cell: ({ row }) => <span className="font-medium text-slate-700 font-mono">{row.getValue("totalCashCollected")} {t("currency")}</span>,
    },
    {
      accessorKey: "totalDigitalCollected",
      header: t("digitalPaid"),
      cell: ({ row }) => <span className="font-medium text-blue-600 font-mono">{row.getValue("totalDigitalCollected")} {t("currency")}</span>,
    },
    {
      accessorKey: "netBalance",
      header: t("netBalance"),
      cell: ({ row }) => {
        const val = parseFloat(row.getValue("netBalance") || "0");
        return (
          <span className={`font-bold font-mono ${val < 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {row.getValue("netBalance")} {t("currency")}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => {
        const status = row.getValue("status");
        const isPaid = status === "paid";
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
            {status ? t(status) : t("unknown")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const invoiceId = row.original.id;
        return (
          <button
            onClick={() => handleDownloadPDF(invoiceId)}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-colors duration-200 shadow-sm"
            title={t("viewDownloadPDF")}
          >
            <Eye className="w-4 h-4" />
          </button>
        );
      },
    },
  ];

  // فحص ما إذا كان صافي الرصيد الإجمالي سالباً أم موجباً
  const isNetNegative = parseFloat(currentInvoice?.netBalance || "0") < 0;

  return (
    <div className="container mx-auto py-10 space-y-8">
      
      {/* هيدر الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t("invoicesFinancialReports")}</h1>
          <p className="text-sm text-slate-500 font-medium">
            {t("invoicesSubtitle")}
          </p>
        </div>
      </div>

      {/* 4. عرض الكروت العلوية الأربعة المحدثة */}
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

      {/* 5. تفاصيل الفاتورة الحالية والـ Net Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" /> {t("invoicePeriod")}
          </h3>
          <div className="divide-y text-sm">
            <div className="flex justify-between py-2">
              <span className="text-slate-500">{t("startDate")}</span>
              <span className="font-semibold font-mono">
                {currentInvoice?.startDate ? new Date(currentInvoice.startDate).toLocaleDateString() : t("na")}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">{t("endDate")}</span>
              <span className="font-semibold font-mono">
                {currentInvoice?.endDate ? new Date(currentInvoice.endDate).toLocaleDateString() : t("na")}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500" /> {t("feesBreakdown")}
          </h3>
          <div className="divide-y text-sm">
            <div className="flex justify-between py-2"><span className="text-slate-500">{t("serviceFee")}</span><span className="font-semibold font-mono">{currentInvoice?.totalServiceFee ?? "0.00"} {t("currency")}</span></div>
            <div className="flex justify-between py-2"><span className="text-slate-500">{t("cashCollected")}</span><span className="font-semibold font-mono">{currentInvoice?.totalCashCollected ?? "0.00"} {t("currency")}</span></div>
          </div>
        </div>

        {/* كارت صافي الحساب النهائي الملون ديناميكياً */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-center items-center text-center shadow-sm ${isNetNegative ? 'bg-rose-50/60 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${isNetNegative ? 'text-rose-600' : 'text-emerald-600'}`}>{t("netBalance")}</p>
          <h2 className={`text-3xl font-black mt-2 font-mono ${isNetNegative ? 'text-rose-700' : 'text-emerald-700'}`}>
            {currentInvoice?.netBalance ?? "0.00"} {t("currency")}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t("finalSettlementDescription")}</p>
        </div>
      </div>

      {/* 6. جدول الفواتير الرئيسي السفلي */}
      <div className="pt-4">
        <GenericDataTable
          title={t("invoicesHistoryStatements")}
          columns={invoiceColumns}
          data={invoicesData}
          isLoading={isLoading}
          queryKey="restaurantInvoicesTable"
          onEdit={false}
          actions={false}
        />
      </div>

    </div>
  );
}