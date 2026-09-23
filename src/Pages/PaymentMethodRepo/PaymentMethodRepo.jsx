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
  Calendar,
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

export default function PaymentMethodRepo() {
  const params = useParams();
  const { t } = useTranslation();

  // الـ States الخاصة بالفلترة
  const [startDate, setStartDate] = useState(
    params.startDate || getTodayDateString()
  );
  const [endDate, setEndDate] = useState(params.endDate || "");
  const [paymentMethodName, setPaymentMethodName] = useState(
    params.paymentMethodName || ""
  );
  const [branchId, setBranchId] = useState(params.branchId || "");

  // 1. جلب التقرير المالي من الباك إند
  const { data: responseData, isLoading } = useQuery({
    queryKey: [
      "paymentMethodReport",
      startDate,
      endDate,
      paymentMethodName,
      branchId,
    ],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/report/payment-method", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          paymentMethodName: paymentMethodName || undefined,
          branchId: branchId || undefined,
        },
      });
      // الوصول للبيانات داخل res.data.data.data
      return res.data?.data?.data || res.data?.data || null;
    },
  });

  // استخراج البيانات المحدثة
  const summary = responseData?.summary || {};
  const paymentSummary = summary?.paymentSummary || {};
  const rawOrders = responseData?.orders || [];

  // 2. تجهيز قائمة الطلبات للجدول
  const ordersTableData = rawOrders.map((order) => ({
    ...order,
    paymentMethodFormatted:
      t(order.paymentMethodName) || order.paymentMethodName?.replace(/_/g, " "),
    totalAmountFormatted: `${parseFloat(order.totalAmount || 0).toFixed(2)} ${
      t("currency") || "EGP"
    }`,
    formattedDate: order.createdAt
      ? new Date(order.createdAt).toLocaleString("ar-EG", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "N/A",
  }));

  // 3. استخراج كروت الإحصائيات الديناميكية
  const totalAmountSum = summary?.totalAmount || "0.00";
  const totalOrdersCount = summary?.totalOrders || 0;

  const cashStats = paymentSummary?.cash_on_delivery || {
    count: 0,
    totalAmount: "0.00",
  };
  const visaStats = paymentSummary?.visa || { count: 0, totalAmount: "0.00" };
  const walletStats = paymentSummary?.wallet || {
    count: 0,
    totalAmount: "0.00",
  };

  const statsCards = [
    {
      title: t("totalPaymentAmount") || "Total Revenue",
      value: `${totalAmountSum} ${t("currency") || "EGP"}`,
      subText: `${totalOrdersCount} ${t("orders") || "Orders"}`,
      icon: DollarSign,
      bgIcon: "bg-emerald-100 text-emerald-600",
    },
    {
      title: t("cashOnDelivery") || "Cash On Delivery",
      value: `${cashStats.totalAmount} ${t("currency") || "EGP"}`,
      subText: `${cashStats.count} ${t("orders") || "Orders"}`,
      icon: Banknote,
      bgIcon: "bg-amber-100 text-amber-600",
    },
    {
      title: t("visaCard") || "Visa / Online Card",
      value: `${visaStats.totalAmount} ${t("currency") || "EGP"}`,
      subText: `${visaStats.count} ${t("orders") || "Orders"}`,
      icon: CreditCard,
      bgIcon: "bg-blue-100 text-blue-600",
    },
    {
      title: t("wallet") || "Wallet",
      value: `${walletStats.totalAmount} ${t("currency") || "EGP"}`,
      subText: `${walletStats.count} ${t("orders") || "Orders"}`,
      icon: Wallet,
      bgIcon: "bg-purple-100 text-purple-600",
    },
  ];

  // 4. أعمدة جدول الطلبات (Orders Table)
  const columns = [
    {
      accessorKey: "orderNumber",
      header: t("orderNumber") || "Order #",
    },
    {
      accessorKey: "userName",
      header: t("customer") || "Customer",
    },
    {
      accessorKey: "branchName",
      header: t("branch") || "Branch",
    },
    {
      accessorKey: "paymentMethodFormatted",
      header: t("paymentMethod") || "Payment Method",
    },
    {
      accessorKey: "totalAmountFormatted",
      header: t("totalAmount") || "Total Amount",
    },
    {
      accessorKey: "status",
      header: t("status") || "Status",
    },
    {
      accessorKey: "formattedDate",
      header: t("date") || "Date",
    },
  ];

  // 5. تصدير قائمة الطلبات لـ PDF
  const exportPDF = () => {
    const doc = new jsPDF("portrait");

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 220, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Payment Method Orders Report", 14, 16);

    doc.setTextColor(120);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, 14, 35);

    autoTable(doc, {
      startY: 45,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Order #", "Customer", "Branch", "Payment", "Amount", "Status"]],
      body: ordersTableData.map((item) => [
        item.orderNumber,
        item.userName,
        item.branchName,
        item.paymentMethodName,
        `${item.totalAmount} EGP`,
        item.status,
      ]),
    });

    doc.save(`Payment_Orders_Report.pdf`);
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("paymentMethodReport") || "Payment Method Report"}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {t("reviewingAnalyticsFor") || "Reviewing payment breakdown and orders"}
          </p>
        </div>

        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition flex items-center gap-2 font-bold shadow text-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> {t("exportPDF")}
        </button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-wrap items-end gap-4 bg-white border rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 text-slate-500 self-center">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {t("filterBy") || "Filter"}
          </span>
        </div>

        {/* Start Date */}
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

        {/* End Date */}
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

        {/* Payment Method Filter */}
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t("paymentMethod") || "Payment Method"}
          </label>
          <select
            value={paymentMethodName}
            onChange={(e) => setPaymentMethodName(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="">
              {t("allMethods") || "All Payment Methods"}
            </option>
            <option value="cash_on_delivery">
              {t("cashOnDelivery") || "Cash On Delivery"}
            </option>
            <option value="visa">{t("visa") || "Visa / Online Card"}</option>
            <option value="wallet">{t("wallet") || "Wallet"}</option>
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

      {/* Orders Data Table */}
      <div className="border rounded-2xl bg-white p-4 shadow-sm">
        <GenericDataTable
          title={t("ordersList") || "Orders List"}
          columns={columns}
          data={ordersTableData}
          isLoading={isLoading}
          queryKey="paymentMethodReportOrders"
          onEdit={false}
          actions={false}
        />
      </div>
    </div>
  );
}