/**
 * يصدّر الأوردرات (بعد تطبيق الفلاتر) إلى ملف Excel.
 * مكتبة xlsx بتتحمّل وقت الضغط بس (dynamic import) عشان متزوّدش حجم الـ bundle.
 */
export async function exportOrdersToExcel({ orders, summary, t, fileName, rtl = false }) {
  const XLSX = await import("xlsx");

  const rows = orders.map((o) => {
    const d = o.createdAt ? new Date(o.createdAt) : null;
    return {
      [t("orderNumber")]: o.dailyOrderNumber,
      [t("customerName") || "Customer"]: o.customerName || "",
      [t("phone") || "Phone"]: o.customerPhone || "",
      [t("orderType")]: t(o.orderType) || o.orderType || "",
      [t("orderSource")]: o.orderSource || "",
      [t("branch") || "Branch"]: o.branchName || "",
      [t("zone") || "Zone"]: o.zoneName || "",
      [t("paymentMethod")]: t(o.paymentMethodName) || o.paymentMethodName || "",
      [t("status")]: t(o.status) || o.status || "",
      [t("totalAmount")]: Number(o.totalAmount || 0),
      [t("date") || "Date"]: d ? d.toLocaleDateString() : "",
      [t("time") || "Time"]: d ? d.toLocaleTimeString() : "",
    };
  });

  // صف الإجمالي في آخر الشيت
  const amountKey = t("totalAmount");
  rows.push({});
  rows.push({
    [t("orderNumber")]: `${t("totalOrders") || "Total Orders"}: ${summary?.totalOrders ?? orders.length}`,
    [amountKey]: Number(summary?.totalAmount ?? 0),
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(14, k.length + 4) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  if (rtl) wb.Workbook = { Views: [{ RTL: true }] };

  XLSX.writeFile(wb, fileName);
}