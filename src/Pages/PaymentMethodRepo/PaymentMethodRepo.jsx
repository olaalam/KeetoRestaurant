import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import {
  CreditCard,
  Banknote,
  Wallet,
  Download,
  DollarSign,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "@/hooks/useTranslation";

// هيلبر بسيط عشان نجيب تاريخ النهاردة بصيغة YYYY-MM-DD (المطلوبة لـ <input type="date" />)
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function PaymentMethodRepo() {
  // لو الصفحة بتتفتح بلينك فيه params جاهزة هنستخدمها كقيمة ابتدائية،
  // ولو مفيش هنرجع لـ default: start = النهاردة, end = فاضي
  const params = useParams();
  const { t } = useTranslation();

  const [startDate, setStartDate] = useState(
    params.startDate || getTodayDateString()
  );
  const [endDate, setEndDate] = useState(params.endDate || "");

  // 1. جلب التقرير المالي من الـ API
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["paymentMethodReport", startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/report/my-restaurant", {
        params: { startDate, endDate },
      });
      return res.data?.data?.data || null;
    },
    // لو حابب متجيبش داتا غير لما اليوزر يحدد الـ endDate، سيبها enabled: !!endDate
    // حاليًا سايبها شغالة بس بالـ startDate عشان تجيب داتا يوم بيوم لحد ما يحدد end
  });

  const restaurantInfo = reportData?.restaurant;
  const rawPaymentData = reportData?.ordersByPayment || [];

  // 2. تجهيز بيانات الجدول
  const paymentTableData = rawPaymentData.map((item) => ({
    ...item,
    paymentMethodLabel: t(item.paymentMethod) || item.paymentMethod,
    totalAmountFormatted: `${item.totalAmount} ${t("currency") || "EGP"}`,
  }));

  // 3. حساب الإحصائيات الإجمالية لطرق الدفع
  const totalAmountSum = rawPaymentData
    .reduce((acc, curr) => acc + parseFloat(curr.totalAmount || 0), 0)
    .toFixed(2);

  const totalOrdersCount = rawPaymentData.reduce(
    (acc, curr) => acc + (curr.count || 0),
    0
  );

  const getMethodStats = (methodKey) => {
    const item = rawPaymentData.find((i) => i.paymentMethod === methodKey);
    return {
      count: item?.count || 0,
      amount: item?.totalAmount || "0.00",
    };
  };

  const cashStats = getMethodStats("cash_on_delivery");
  const visaStats = getMethodStats("visa");
  const walletStats = getMethodStats("wallet");

  // 4. كروت الإحصائيات
  const statsCards = [
    {
      title: t("totalPaymentAmount") || "Total Payment Revenue",
      value: `${totalAmountSum} ${t("currency") || "EGP"}`,
      subText: `${totalOrdersCount} ${t("orders") || "Orders"}`,
      icon: DollarSign,
      bgIcon: "bg-emerald-100 text-emerald-600",
    },
    {
      title: t("cashOnDelivery") || "Cash On Delivery",
      value: `${cashStats.amount} ${t("currency") || "EGP"}`,
      subText: `${cashStats.count} ${t("orders") || "Orders"}`,
      icon: Banknote,
      bgIcon: "bg-amber-100 text-amber-600",
    },
    {
      title: t("visaCard") || "Visa / Online Card",
      value: `${visaStats.amount} ${t("currency") || "EGP"}`,
      subText: `${visaStats.count} ${t("orders") || "Orders"}`,
      icon: CreditCard,
      bgIcon: "bg-blue-100 text-blue-600",
    },
    {
      title: t("wallet") || "Wallet",
      value: `${walletStats.amount} ${t("currency") || "EGP"}`,
      subText: `${walletStats.count} ${t("orders") || "Orders"}`,
      icon: Wallet,
      bgIcon: "bg-purple-100 text-purple-600",
    },
  ];

  // 5. أعمدة الجدول
  const columns = [
    { accessorKey: "paymentMethodLabel", header: t("paymentMethod") || "Payment Method" },
    { accessorKey: "count", header: t("ordersCount") || "Orders Count" },
    { accessorKey: "totalAmountFormatted", header: t("totalAmount") || "Total Amount" },
  ];

  // 6. تصدير التقرير بصيغة PDF
  const exportPDF = () => {
    const doc = new jsPDF("portrait");

    // Header Background
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 220, 25, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(
      `${restaurantInfo?.name || "Restaurant"} - Payment Method Report`,
      14,
      16
    );

    // Period Metadata
    doc.setTextColor(120);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, 14, 35);

    // Summary Table in PDF
    autoTable(doc, {
      startY: 45,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Payment Method", "Orders Count", "Total Amount"]],
      body: paymentTableData.map((item) => [
        item.paymentMethodLabel,
        item.count,
        `${item.totalAmount} EGP`,
      ]),
    });

    doc.save(`Payment_Method_Report.pdf`);
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Page Header */}
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
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t("paymentMethodReport") || "Payment Method Report"}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {t("reviewingAnalyticsFor") || "Reviewing payment breakdown for"}{" "}
              <span className="text-slate-800 font-bold">
                {restaurantInfo?.name || t("yourRestaurant") || "Your Restaurant"}
              </span>
            </p>
          </div>
        </div>

        {/* Download PDF Button */}
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition flex items-center gap-2 font-bold shadow text-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> {t("exportPDF")}
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 bg-white border rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {t("filterByDate") || "Filter by date"}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t("startDate") || "Start Date"}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t("endDate") || "End Date"}
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white border rounded-2xl shadow-sm p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <h2 className="text-2xl font-black mt-1 text-slate-800 font-mono">
                  {card.value}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
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

      {/* Payment Method Data Table */}
      <div className="border rounded-2xl bg-white p-4 shadow-sm">
        <GenericDataTable
          title={t("ordersByPaymentMethod") || "Orders by Payment Method"}
          columns={columns}
          data={paymentTableData}
          isLoading={isLoading}
          queryKey="paymentMethodReportTable"
          onEdit={false}
          actions={false}
        />
      </div>
    </div>
  );
}