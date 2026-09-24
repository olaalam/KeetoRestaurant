import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import {
  CreditCard,
  Download,
  DollarSign,
  Calendar,
  Activity,
  CheckCircle2,
  XCircle
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "@/hooks/useTranslation";

// هيلبر بسيط لتاريخ اليوم بصيغة YYYY-MM-DD
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function VisaRepo() {
  const params = useParams();
  const { t } = useTranslation();

  // الـ States الخاصة بالفلترة
  const [startDate, setStartDate] = useState(params.startDate || getTodayDateString());
  const [endDate, setEndDate] = useState(params.endDate || "");
  const [branchId, setBranchId] = useState(params.branchId || "");
  const [status, setStatus] = useState(params.status || "all");

  // 1. جلب تقرير الفيزا من الباك إند
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["visaReport", startDate, endDate, branchId, status],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/report/visa", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          branchId: branchId || undefined,
          status: status !== "all" ? status : undefined,
        },
      });
      // الوصول للبيانات داخل res.data.data بناءً على استجابة الـ API
      return res.data?.data || null;
    },
  });


  // استخراج البيانات
  const summary = responseData?.data?.summary || {};
  const rawOrders = responseData?.data?.orders || [];
  
  // 2. تجهيز قائمة الطلبات للجدول
  const ordersTableData = rawOrders.map((order) => ({
    ...order,
    totalAmountFormatted: `${parseFloat(order.totalAmount || 0).toFixed(2)} ${
      t("currency", "ج.م")
    }`,
    formattedDate: order.createdAt
      ? new Date(order.createdAt).toLocaleString("ar-EG", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "N/A",
  }));

  // 3. استخراج كروت الإحصائيات (تتضمن تفاصيل النجاح والفشل من الـ JSON)
  const totalAmountSum = summary?.totalAmount || "0.00";
  const totalOrdersCount = summary?.totalOrders || 0;
  
  const successStats = summary?.success || { count: 0, totalAmount: "0.00" };
  const failedStats = summary?.failed || { count: 0, totalAmount: "0.00" };

  const statsCards = [
    {
      title: t("totalVisaRevenue", "إجمالي إيرادات الفيزا"),
      value: `${totalAmountSum} ${t("currency", "ج.م")}`,
      subText: `${totalOrdersCount} ${t("orders", "طلبات")}`,
      icon: DollarSign,
      bgIcon: "bg-blue-100 text-blue-600",
    },
    {
      title: t("successfulPayments", "المدفوعات الناجحة"),
      value: `${successStats.totalAmount} ${t("currency", "ج.م")}`,
      subText: `${successStats.count} ${t("orders", "طلبات")}`,
      icon: CheckCircle2,
      bgIcon: "bg-emerald-100 text-emerald-600",
    },
    {
      title: t("failedPayments", "المدفوعات المرفوضة"),
      value: `${failedStats.totalAmount} ${t("currency", "ج.م")}`,
      subText: `${failedStats.count} ${t("orders", "طلبات")}`,
      icon: XCircle,
      bgIcon: "bg-rose-100 text-rose-600",
    },
    {
      title: t("totalVisaOrders", "إجمالي الطلبات بالفيزا"),
      value: totalOrdersCount,
      subText: t("paidViaVisa", "تم الدفع عبر البطاقة"),
      icon: CreditCard,
      bgIcon: "bg-purple-100 text-purple-600",
    }
  ];

  // 4. أعمدة جدول الطلبات
  const columns = [
    {
      accessorKey: "dailyOrderNumber",
      header: t("orderNumber", "رقم الطلب"),
      cell: ({ row }) => <span className="font-semibold">{row.original.dailyOrderNumber}</span>
    },
    {
      accessorKey: "userName",
      header: t("customer", "العميل"),
    },
    {
      accessorKey: "branchName",
      header: t("branch", "الفرع"),
    },
    {
      accessorKey: "gatewayName",
      header: t("gateway", "بوابة الدفع"),
      cell: ({ row }) => (
        <span className="uppercase text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          {row.original.gatewayName || "-"}
        </span>
      )
    },
    {
      accessorKey: "totalAmountFormatted",
      header: t("totalAmount", "المبلغ الإجمالي"),
      cell: ({ row }) => <span className="font-bold">{row.original.totalAmountFormatted}</span>
    },
    {
      accessorKey: "visaStatus",
      header: t("paymentStatus", "حالة الدفع"),
      cell: ({ row }) => {
        const status = (row.original.visaStatus || "").toLowerCase();
        let badgeStyle = "bg-slate-100 text-slate-600";
        let label = status;

        if (status === "success" || status === "paid") {
          badgeStyle = "bg-emerald-50 text-emerald-600 border border-emerald-200";
          label = t("success", "ناجح");
        } else if (status === "pending") {
          badgeStyle = "bg-amber-50 text-amber-600 border border-amber-200";
          label = t("pending", "قيد الانتظار");
        } else if (status === "failed") {
          badgeStyle = "bg-rose-50 text-rose-600 border border-rose-200";
          label = t("failed", "مرفوض");
        }

        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "formattedDate",
      header: t("date", "التاريخ"),
    },
  ];

  // 5. تصدير قائمة الطلبات لـ PDF
  const exportPDF = () => {
    const doc = new jsPDF("portrait");

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 220, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Visa Orders Report", 14, 16);

    doc.setTextColor(120);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, 14, 35);

    autoTable(doc, {
      startY: 45,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Order #", "Customer", "Branch", "Gateway", "Amount", "Visa Status"]],
      body: ordersTableData.map((item) => [
        item.orderNumber,
        item.userName,
        item.branchName,
        item.gatewayName,
        `${item.totalAmount} EGP`,
        item.visaStatus,
      ]),
    });

    doc.save(`Visa_Orders_Report.pdf`);
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("visaReport", "تقرير مدفوعات البطاقات")}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {t("reviewingVisaAnalytics", "مراجعة وتحليل عمليات الدفع الإلكتروني والطلبات")}
          </p>
        </div>

        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition flex items-center gap-2 font-bold shadow text-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> {t("exportPDF", "تصدير PDF")}
        </button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-wrap items-end gap-4 bg-white border rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 text-slate-500 self-center">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {t("filterBy", "تصفية النتائج")}
          </span>
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t("startDate", "تاريخ البداية")}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t("endDate", "تاريخ النهاية")}
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3" /> {t("paymentStatus", "حالة الدفع")}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="all">{t("allStatuses", "الكل")}</option>
            <option value="success">{t("success", "ناجح")}</option>
            <option value="pending">{t("pending", "قيد الانتظار")}</option>
            <option value="failed">{t("failed", "مرفوض")}</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white border rounded-2xl shadow-sm p-5 flex items-center justify-between transition-all hover:shadow-md"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <h2 className="text-2xl font-black mt-1 text-slate-800 font-mono">
                  {card.value}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {card.subText}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgIcon}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Orders Data Table */}
      <div className="border rounded-2xl bg-white p-4 shadow-sm">
        <GenericDataTable
          title={t("ordersList", "سجل المدفوعات")}
          columns={columns}
          data={ordersTableData}
          isLoading={isLoading}
          queryKey="visaReportOrders"
          onEdit={false}
          actions={false}
        />
      </div>
    </div>
  );
}