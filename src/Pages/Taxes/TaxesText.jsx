import { useTranslation } from "@/hooks/useTranslation";

const dict = {
  en: {
    taxes: "Taxes",
    tax: "Tax",
    name: "Name",
    nameAr: "Name (Arabic)",
    nameFr: "Name (French)",
    amount: "Amount",
    amountType: "Amount type",
    taxType: "Tax type",
    modules: "Modules",
    moduleType: "Module type",
    branches: "Branches",
    foods: "Foods",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    percentage: "Percentage",
    fixed: "Fixed",
    include: "Include",
    exclude: "Exclude",
    all: "All",
    online: "Online",
    app: "App",
    statusUpdated: "Status updated",
    loadError: "Failed to load tax data",
  },
  ar: {
    taxes: "الضرائب",
    tax: "ضريبة",
    name: "الاسم",
    nameAr: "الاسم (عربي)",
    nameFr: "الاسم (فرنسي)",
    amount: "القيمة",
    amountType: "نوع القيمة",
    taxType: "نوع الضريبة",
    modules: "الوحدات",
    moduleType: "نوع الوحدة",
    branches: "الفروع",
    foods: "الأصناف",
    status: "الحالة",
    active: "مفعل",
    inactive: "غير مفعل",
    percentage: "نسبة مئوية",
    fixed: "مبلغ ثابت",
    include: "شاملة",
    exclude: "غير شاملة",
    all: "الكل",
    online: "أونلاين",
    app: "التطبيق",
    statusUpdated: "تم تحديث الحالة",
    loadError: "فشل تحميل بيانات الضريبة",
  },
};

export const useTaxText = () => {
  const { isRTL } = useTranslation();
  const d = dict[isRTL ? "ar" : "en"];
  // لو المفتاح مش موجود (مثلاً قيمة جديدة جاية من /tax/options) يرجّع القيمة نفسها
  const tx = (key) => d[key] ?? key;
  return { tx, isRTL };
};