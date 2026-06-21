import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useParams } from "react-router-dom";
import { 
  FileText, Eye, Percent, DollarSign, 
  ArrowUpRight, ArrowDownLeft, Calendar, ShieldAlert, X, Download
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function Invoice() {
  const { startDate, endDate } = useParams();
  const { t } = useTranslation();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);

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

  const currentInvoice = invoicesData?.[0] || {};

  // دالة مخصصة لتحميل ملف الفاتورة مباشرة عند الضغط على الزر العلوي للجدول
  const handleDownloadPDFDirectly = async (invoiceId) => {
    if (!invoiceId) return;
    try {
      const response = await api.get(`/api/restaurant/report/my-restaurant/${invoiceId}/invoice`, {
        responseType: 'blob' 
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Failed to download invoice PDF:", error);
      alert(t("downloadErrorAlert"));
    }
  };

  const handleViewPDFInDialog = async (invoiceId) => {
    try {
      setIsPdfLoading(true);
      setIsPreviewOpen(true);

      const response = await api.get(`/api/restaurant/report/my-restaurant/${invoiceId}/invoice`, {
        responseType: 'blob' 
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      setPdfUrl(url);
      setIsPdfLoading(false);
    } catch (error) {
      console.error("Failed to fetch invoice PDF:", error);
      alert(t("downloadErrorAlert"));
      setIsPreviewOpen(false);
      setIsPdfLoading(false);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl("");
    }
  };

  // 2. تحضير الكروت المالية
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

  // 3. أعمدة الجدول
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
            onClick={() => handleViewPDFInDialog(invoiceId)}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-colors duration-200 shadow-sm"
            title={t("viewDownloadPDF")}
          >
            <Eye className="w-4 h-4" />
          </button>
        );
      },
    },
  ];

  const isNetNegative = parseFloat(currentInvoice?.netBalance || "0") < 0;

  return (
    <div className="container mx-auto py-10 space-y-8">
      
      {/* هيدر الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t("invoicesFinancialReports")}</h1>
          <p className="text-sm text-slate-500 font-medium">{t("invoicesSubtitle")}</p>
        </div>
      </div>

      {/* كروت الإحصائيات */}
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

      {/* تفاصيل الفاتورة والـ Net Balance */}
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

        <div className={`border rounded-2xl p-5 flex flex-col justify-center items-center text-center shadow-sm ${isNetNegative ? 'bg-rose-50/60 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
          <p className={`text-xs font-bold uppercase tracking-wider ${isNetNegative ? 'text-rose-600' : 'text-emerald-600'}`}>{t("netBalance")}</p>
          <h2 className={`text-3xl font-black mt-2 font-mono ${isNetNegative ? 'text-rose-700' : 'text-emerald-700'}`}>
            {currentInvoice?.netBalance ?? "0.00"} {t("currency")}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t("finalSettlementDescription")}</p>
        </div>
      </div>

      {/* جدول الفواتير الرئيسي - مُحاط بـ container نسبي ويحتوي على زر التحميل المباشر في الأعلى يميناً */}
      <div className="relative pt-12 border rounded-2xl bg-white p-4 shadow-sm">
        <button 
          onClick={() => handleDownloadPDFDirectly(currentInvoice?.id)} 
          disabled={!currentInvoice?.id}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700 flex items-center gap-1 text-xs font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" /> Download PDF
        </button>
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

      {/* ==================== الـ Premium Invoice PDF Preview Dialog ==================== */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
          {/* Backdrop الخلفية الداكنة المضببة */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-all"
            onClick={closePreview} 
          />
          
          {/* جسم الـ Dialog مع أنيميشن التكبير الهادئ */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-100 relative z-10 scale-in-center transform transition-transform duration-300">
            
            {/* الهيدر المحسن */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t("invoicePreview") || "Invoice Preview"}</h3>
                  <p className="text-xs text-slate-400 font-medium">Review statement and options below</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* زر تحميل إضافي واضح في الهيدر لسهولة الوصول في الشاشات المختلفة */}
                {pdfUrl && !isPdfLoading && (
                  <a 
                    href={pdfUrl} 
                    download={`Invoice.pdf`}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-200 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
                <button 
                  onClick={closePreview}
                  className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* منطقة عرض الفاتورة */}
            <div className="flex-1 bg-slate-50 relative p-4">
              {isPdfLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-600 font-bold tracking-wide animate-pulse">Generating Live Preview...</p>
                </div>
              ) : (
                pdfUrl && (
                  <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200/80 bg-white shadow-inner">
                    <iframe 
                      src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`} 
                      className="w-full h-full border-0"
                      title="Invoice PDF"
                    />
                  </div>
                )
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}