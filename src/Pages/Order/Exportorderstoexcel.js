/**
 * يصدّر الأوردرات (بعد تطبيق الفلاتر) إلى ملف Excel.
 * دعم ديناميكي للأعمدة مع استخراج مباشر للبيانات لضمان عدم نزول ملفات فارغة.
 */
export async function exportOrdersToExcel({ orders, columns, summary, t, fileName, rtl = false }) {
  const XLSX = await import("xlsx");

  const rows = orders.map((o) => {
    const rowData = {};

    // 1. إذا تم تمرير columns وكان لها تعريف، نحاول القراءة منها أولاً
    if (columns && columns.length > 0) {
      columns.forEach((col) => {
        if (col.id === "actions" || !col.header) return;

        const headerName = typeof col.header === "string" ? col.header : col.id || col.accessorKey;
        if (!headerName) return;

        let val = "";

        // جلب القيمة مباشرة من accessorKey إذا توفرت
        if (col.accessorKey && o[col.accessorKey] !== undefined) {
          val = o[col.accessorKey];
        } else if (col.id && o[col.id] !== undefined) {
          val = o[col.id];
        } else if (col.accessorFn) {
          try {
            val = col.accessorFn(o);
          } catch {
            val = "";
          }
        }

        // معالجة خاصة لبعض الأعمدة المعروفة في حال كانت القيمة كائن أو غير نصية
        if (col.accessorKey === "paymentMethod") {
          val = t(o.paymentMethodName) || o.paymentMethodName || "-";
        } else if (col.accessorKey === "discountAmount") {
          val = Number(o.discountAmount || o.discount?.discountAmount || 0);
        } else if (col.accessorKey === "createdAt" && o.createdAt) {
          const d = new Date(o.createdAt);
          val = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
        } else if (col.accessorKey === "orderType" || col.accessorKey === "status") {
          val = t(val) || val;
        }

        rowData[headerName] = val ?? "";
      });
    } else {
      // 2. إذا لم تُمرر columns أو كانت مفرغة، نستخدم الأعمدة الأساسية الافتراضية
      const d = o.createdAt ? new Date(o.createdAt) : null;
      const discountVal = o.discountAmount || o.discount?.discountAmount || 0;

      return {
        [t("orderNumber") || "Order Number"]: o.dailyOrderNumber || o.orderNumber || o.id,
        [t("customerName") || "Customer Name"]: o.customerName || "-",
        [t("phone") || "Phone"]: o.customerPhone || "-",
        [t("orderType") || "Order Type"]: t(o.orderType) || o.orderType || "-",
        [t("orderSource") || "Order Source"]: o.orderSource || "-",
        [t("branch") || "Branch"]: o.branchName || "-",
        [t("zone") || "Zone"]: o.zoneName || "-",
        [t("rating") || "Rating"]: t(o.rating) || o.rating || "-",
        [t("ratingComment") || "Rating Comment"]: o.ratingComment || "-",
        [t("discount") || "Discount"]: Number(discountVal),
        [t("paymentMethod") || "Payment Method"]: t(o.paymentMethodName) || o.paymentMethodName || "-",
        [t("status") || "Status"]: t(o.status) || o.status || "-",
        [t("totalAmount") || "Total Amount"]: Number(o.totalAmount || 0),
        [t("date") || "Date"]: d ? d.toLocaleDateString() : "-",
        [t("time") || "Time"]: d ? d.toLocaleTimeString() : "-",
      };
    }

    return rowData;
  });

  // إضافة صف الإجماليات في آخر الشيت
  const firstColKey = Object.keys(rows[0] || {})[0] || t("orderNumber") || "Order Number";
  const amountColKey =
    Object.keys(rows[0] || {}).find(
      (k) => k.includes(t("totalAmount")) || k.toLowerCase().includes("total") || k.includes("إجمالي")
    ) || t("totalAmount") || "Total Amount";

  rows.push({});
  rows.push({
    [firstColKey]: `${t("totalOrders") || "Total Orders"}: ${summary?.totalOrders ?? orders.length}`,
    [amountColKey]: Number(summary?.totalAmount ?? 0),
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({
    wch: Math.max(16, k.length + 5),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  if (rtl) wb.Workbook = { Views: [{ RTL: true }] };

  XLSX.writeFile(wb, fileName);
}