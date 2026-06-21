import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import {
  ShoppingBag,
  Landmark,
  Percent,
  DollarSign,
  TrendingUp,
  CreditCard,
  Utensils,
  Globe,
  AlertTriangle,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "@/hooks/useTranslation"; 

export default function DetailedFinancialReport() {
  const { startDate, endDate } = useParams();
  const { t } = useTranslation(); 

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

  // دالة تصدير أي جدول منفرد بصيغة PDF ديناميكياً
  const exportSingleTablePDF = (tableTitle, columns, data) => {
    const doc = new jsPDF("portrait");
    
    // الهيدر الخاص بالملف
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 220, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`${restaurantInfo?.name || t("yourRestaurant")} - ${tableTitle}`, 14, 13);

    // تجهيز رأس الجدول (Headers)
    const headers = columns.map(col => col.header);

    // تجهيز صفوف الجدول (Rows)
    const body = data.map(row => 
      columns.map(col => {
        const val = row[col.accessorKey];
        return val !== undefined && val !== null ? String(val) : "0";
      })
    );

    autoTable(doc, {
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [headers],
      body: body,
    });

    doc.save(`${tableTitle.replace(/\s+/g, "_")}.pdf`);
  };

  // 2. دالة تصدير التقرير الكامل بصيغة PDF لجميع الجداول
  const exportPDF = () => {
    const doc = new jsPDF("landscape");

    // Header Background
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, 300, 25, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(restaurantInfo?.name || "Restaurant Financial Report", 14, 16);

    // Metadata
    doc.setTextColor(120);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, 14, 35);

    // Financial Cards Summary in PDF
    const cards = [
      {
        title: "Total Sales",
        value: `${financials?.totalRevenue ?? "0.00"} EGP`,
      },
      {
        title: "Delivered Revenue",
        value: `${financials?.deliveredRevenue ?? "0.00"} EGP`,
      },
      {
        title: "Commission",
        value: `${financials?.totalAppCommission ?? "0.00"} EGP`,
      },
    ];

    let x = 14;
    cards.forEach((card) => {
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.roundedRect(x, 45, 80, 25, 3, 3, "F");

      // Title
      doc.setTextColor(100);
      doc.setFontSize(9);
      doc.text(card.title, x + 4, 53);

      // Value
      doc.setTextColor(30);
      doc.setFontSize(14);
      doc.text(String(card.value), x + 4, 64);

      x += 90;
    });

    // 1. Financial Overview Table
    autoTable(doc, {
      startY: 85,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Metric", "Value"]],
      body: [
        ["Net Revenue", `${financials?.netRevenue ?? 0} EGP`],
        ["Subtotal", `${financials?.totalSubtotal ?? 0} EGP`],
        ["Delivery Fees", `${financials?.totalDeliveryFees ?? 0} EGP`],
        ["Service Fees", `${financials?.totalServiceFees ?? 0} EGP`],
        ["Average Order Value", `${overview?.avgOrderValue ?? 0}`],
        ["Cancelled Orders", overview?.cancelledOrders ?? 0],
      ],
    });

    // 2. Branches Performance Breakdown Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [
        [
          "Branch",
          "Orders",
          "Delivered",
          "Cancelled",
          "Total Volume",
          "Delivered Revenue",
        ],
      ],
      body: (reportData?.branchBreakdown || []).map((branch) => [
        branch.branchName || "N/A",
        branch.totalOrders || 0,
        branch.deliveredOrders || 0,
        branch.cancelledOrders || 0,
        `${branch.totalAmount || 0} EGP`,
        `${branch.deliveredAmount || 0} EGP`,
      ]),
    });

    // Add a new page for categorical charts data
    doc.addPage();

    // 3. Orders By Status Table
    autoTable(doc, {
      startY: 20,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Status", "Orders", "Amount"]],
      body: ordersByStatusData.map((item) => [
        item.typeLabel,
        item.count,
        `${item.totalAmount} EGP`,
      ]),
    });

    // 4. Orders By Payment Method Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Payment Method", "Orders", "Amount"]],
      body: ordersByPaymentData.map((item) => [
        item.typeLabel,
        item.count,
        `${item.totalAmount} EGP`,
      ]),
    });

    // Add another page
    doc.addPage();

    // 5. Orders By Type Table
    autoTable(doc, {
      startY: 20,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Order Type", "Orders", "Amount"]],
      body: ordersByTypeData.map((item) => [
        item.typeLabel,
        item.count,
        `${item.totalAmount} EGP`,
      ]),
    });

    // 6. Orders By Source Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      head: [["Source", "Orders", "Amount"]],
      body: ordersBySourceData.map((item) => [
        item.typeLabel,
        item.count,
        `${item.totalAmount} EGP`,
      ]),
    });

    // Add Page Numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        `Page ${i} of ${totalPages}`,
        250,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(`${restaurantInfo?.name || "Restaurant"}_Detailed_Report.pdf`);
  };

  // 3. كروت الإحصائيات (الحسابات المباشرة)
  const statsCards = [
    {
      title: t("grandTotalSales"),
      value: `${financials?.totalRevenue ?? "0.00"} ${t("currency")}`,
      icon: ShoppingBag,
      bgIcon: "bg-orange-100 text-orange-600",
    },
    {
      title: t("deliveredRevenue"),
      value: `${financials?.deliveredRevenue ?? "0.00"} ${t("currency")}`,
      icon: DollarSign,
      bgIcon: "bg-green-100 text-green-600",
    },
    {
      title: t("appCommissionKeeto"),
      value: `${financials?.totalAppCommission ?? "0.00"} ${t("currency")}`,
      icon: Percent,
      bgIcon: "bg-rose-100 text-rose-600",
    },
    {
      title: t("totalOrdersCount"),
      value: overview?.totalAttemptedOrders ?? 0,
      icon: Landmark,
      bgIcon: "bg-blue-100 text-blue-600",
    },
    {
      title: t("AvgOrderValue"),
      value: overview?.avgOrderValue ?? "0.00",
      icon: Landmark,
      bgIcon: "bg-blue-100 text-blue-600",
    },
    {
      title: t("cancelledOrders"),
      value: overview?.cancelledOrders ?? 0,
      icon: Landmark,
      bgIcon: "bg-blue-100 text-blue-600",
    },
  ];

  // 4. الأعمدة الخاصة بجدول الفروع التحليلي
  const branchColumns = [
    { accessorKey: "branchName", header: t("branchName") },
    { accessorKey: "totalOrders", header: t("totalOrders") },
    { accessorKey: "deliveredOrders", header: t("deliveredOrders") },
    { accessorKey: "cancelledOrders", header: t("cancelledOrders") },
    { accessorKey: "totalAmount", header: t("totalVolume") },
    { accessorKey: "deliveredAmount", header: t("deliveredRevenue") },
  ];

  // الأعمدة الخاصة بالجداول الفرعية الأخرى (أعمدة موحدة للـ breakdown)
  const breakdownColumns = [
    { accessorKey: "typeLabel", header: t("category") },
    { accessorKey: "count", header: t("ordersCount") },
    { accessorKey: "totalAmount", header: t("totalAmount") },
  ];

  // 5. إعداد وتعيين البيانات للجداول بشكل موحد ومتناسق مع الـ accessorKey
  const ordersByStatusData =
    reportData?.ordersByStatus?.map((item) => ({
      ...item,
      typeLabel: item.status,
    })) || [];

  const ordersByPaymentData =
    reportData?.ordersByPayment?.map((item) => ({
      ...item,
      typeLabel: item.paymentMethod,
    })) || [];

  const ordersByTypeData =
    reportData?.ordersByType?.map((item) => ({
      ...item,
      typeLabel: item.orderType,
    })) || [];

  const ordersBySourceData =
    reportData?.ordersBySource?.map((item) => ({
      ...item,
      typeLabel: item.orderSource,
    })) || [];

  // التحقق من صافي الأرباح بالسالب لإعطاء لون تحذيري مناسب
  const isNetNegative = parseFloat(financials?.netRevenue || "0") < 0;

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* 6. هيدر التقرير مع اسم وشعار المطعم */}
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
              {t("detailedFinancialReport")}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {t("reviewingAnalyticsFor")}{" "}
              <span className="text-slate-800 font-bold">
                {restaurantInfo?.name || t("yourRestaurant")}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-400">
            {t("status")}:
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              restaurantInfo?.status === "active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {restaurantInfo?.status ? t(restaurantInfo.status) : t("unknown")}
          </span>
        </div>
      </div>

      {/* 7. عرض شبكة الكروت التحليلية العلوية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* تفاصيل صافي الأرباح وباقي الرسوم المالية الفرعية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />{" "}
            {t("additionalFinancialMetrics")}
          </h3>
          <div className="divide-y text-sm">
            <div className="flex justify-between py-2">
              <span className="text-slate-500">{t("subtotal")}</span>
              <span className="font-semibold font-mono">
                {financials?.totalSubtotal ?? "0.00"} {t("currency")}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">{t("deliveryFees")}</span>
              <span className="font-semibold font-mono">
                {financials?.totalDeliveryFees ?? "0.00"} {t("currency")}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">{t("serviceFees")}</span>
              <span className="font-semibold font-mono">
                {financials?.totalServiceFees ?? "0.00"} {t("currency")}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`border rounded-2xl p-5 flex flex-col justify-center items-center text-center shadow-sm ${
            isNetNegative
              ? "bg-rose-50/60 border-rose-200"
              : "bg-emerald-50/60 border-emerald-200"
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wider ${
              isNetNegative ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {t("netRevenueAfterCommission")}
          </p>
          <h2
            className={`text-3xl font-black mt-2 font-mono ${
              isNetNegative ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {financials?.netRevenue ?? "0.00"} {t("currency")}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t("netRevenueDescription")}
          </p>
        </div>
      </div>

      {/* شبكة الجداول التحليلية الأربعة مع إضافة زر التصدير لكل جدول */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* جدول الطلبات بحسب حالة الطلب */}
        <div className="relative pt-12 border rounded-2xl bg-white p-4 shadow-sm">
          <button 
            onClick={() => exportSingleTablePDF(t("ordersByStatus"), breakdownColumns, ordersByStatusData)} 
            className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 flex items-center gap-1 text-xs font-bold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <GenericDataTable
            title={t("ordersByStatus")}
            columns={breakdownColumns}
            data={ordersByStatusData}
            isLoading={isLoading}
            queryKey="ordersByStatus"
            onEdit={false}
            actions={false}
          />
        </div>

        {/* جدول الطلبات بحسب طريقة الدفع */}
        <div className="relative pt-12 border rounded-2xl bg-white p-4 shadow-sm">
          <button 
            onClick={() => exportSingleTablePDF(t("ordersByPaymentMethod"), breakdownColumns, ordersByPaymentData)} 
            className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 flex items-center gap-1 text-xs font-bold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <GenericDataTable
            title={t("ordersByPaymentMethod")}
            columns={breakdownColumns}
            data={ordersByPaymentData}
            isLoading={isLoading}
            queryKey="ordersByPayment"
            onEdit={false}
            actions={false}
          />
        </div>

        {/* جدول الطلبات بحسب نوع الطلب */}
        <div className="relative pt-12 border rounded-2xl bg-white p-4 shadow-sm">
          <button 
            onClick={() => exportSingleTablePDF(t("ordersByType"), breakdownColumns, ordersByTypeData)} 
            className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 flex items-center gap-1 text-xs font-bold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <GenericDataTable
            title={t("ordersByType")}
            columns={breakdownColumns}
            data={ordersByTypeData}
            isLoading={isLoading}
            queryKey="ordersByType"
            onEdit={false}
            actions={false}
          />
        </div>

        {/* جدول الطلبات بحسب مصدر الطلب */}
        <div className="relative pt-12 border rounded-2xl bg-white p-4 shadow-sm">
          <button 
            onClick={() => exportSingleTablePDF(t("ordersBySource"), breakdownColumns, ordersBySourceData)} 
            className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 flex items-center gap-1 text-xs font-bold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <GenericDataTable
            title={t("ordersBySource")}
            columns={breakdownColumns}
            data={ordersBySourceData}
            isLoading={isLoading}
            queryKey="ordersBySource"
            onEdit={false}
            actions={false}
          />
        </div>
      </div>

      {/* زر تحميل التقرير الكامل مجمع */}
      <div className="flex justify-end">
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-bold shadow"
        >
          <Download className="w-4 h-4" /> Export Complete PDF
        </button>
      </div>

      {/* 8. جدول تفاصيل الفروع مع زر تصدير مخصص */}
      <div className="relative pt-12 border rounded-2xl bg-white p-4 shadow-sm">
        <button 
          onClick={() => exportSingleTablePDF(t("branchesPerformanceBreakdown"), branchColumns, reportData?.branchBreakdown || [])} 
          className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 flex items-center gap-1 text-xs font-bold shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Export PDF
        </button>
        <GenericDataTable
          title={t("branchesPerformanceBreakdown")}
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