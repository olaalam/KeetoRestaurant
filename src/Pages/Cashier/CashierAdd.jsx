import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";

const CashierAdd = () => {
  const { id } = useParams(); // التقاط الـ ID من الرابط لمعرفة إذا كنا في وضع التعديل (Edit)
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 1. جلب بيانات الكاشير (في حالة التعديل) وتنسيقها لتطابق الحقول بدقة مع الريسبونس المرسل
  const { data: cashierData, isLoading: isFetching } = useQuery({
    queryKey: ["cashier", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurant/cashiers/${id}`);

      // بناءً على ريسبونس السينجل كاشير: البيانات تكون داخل data.data.data مباشرة
      const resData = data?.data?.data;

      // إذا كانت البيانات تحتوي على كائن فرعي باسم cashiers نقوم بفكها ومطابقة الحقول
      if (resData && resData.cashiers) {
        return {
          ...resData.cashiers,
          branch_id: resData.cashiers.branchid, // تحويل branchid ليتطابق مع اسم الحقل المتوقع في الـ combobox
        };
      }

      // حالة احتياطية إذا جاءت البيانات بشكل مباشر ومسطح
      if (resData) {
        return {
          ...resData,
          branch_id: resData.branch_id || resData.branchid
        };
      }
      return null;
    },
    enabled: !!id && !state?.cashierData, // يتم التفعيل فقط في صفحة التعديل (عند وجود ID)
  });

  // 2. جلب قائمة الفروع
  const { data: branches = [], isLoading: isBranchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data } = await api.get("/api/restaurant/branches");
      // التحقق الآمن لضمان عدم إرجاع undefined
      return data?.data?.data || data?.data || data || [];
    },
  });

  // 3. جلب قائمة الحسابات المالية وتعديلها لتتناسب مع الريسبونس الجديد
  const { data: financialAccounts = [], isLoading: isAccountsLoading } = useQuery({
    queryKey: ["financialAccounts"],
    queryFn: async () => {
      const { data } = await api.get("/api/restaurant/FinancialAccount");

      // استخراج المصفوفة الأساسية (data.data) بناءً على الريسبونس المرسل
      const rawAccounts = data?.data || [];

      // تحويل البيانات لفك كائن account الداخلي وجلب الاسم والمعرف منه
      return rawAccounts.map(item => ({
        id: item.account?.id,
        name: item.account?.name
      }));
    },
  });

  const rawData = state?.cashierData || cashierData;

  // إعداد البيانات الافتراضية للتعديل أو الإضافة الجديدة
  const initialData = rawData
    ? { ...rawData }
    : { status: "active", cashier_active: true };

  // تجهيز خيارات الفروع
  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  // تجهيز خيارات الحسابات المالية
  const accountOptions = financialAccounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  const statusOptions = [
    { value: "active", label: t("active") },
    { value: "inactive", label: t("inactive") },
  ];

  // بناء حقول الاستمارة
  const cashierFields = [
    { name: "name", label: t("name"), required: true },
    { name: "ar_name", label: t("ar_name"), required: true },
    {
      name: "status",
      label: t("status"),
      type: "combobox",
      required: true,
      options: statusOptions,
    },
    {
      name: "branch_id",
      label: t("branch_id"),
      type: "combobox",
      required: true,
      options: branchOptions,
    },
    {
      name: "financialAccountId",
      label: t("financialAccountId"),
      type: "combobox",
      required: true,
      options: accountOptions,
    },
  ];

  // عرض الـ Spinner أثناء جلب البيانات الأساسية لمنع الـ Render ببيانات ناقصة
  if ((id && isFetching) || isBranchesLoading || isAccountsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AddPage
      title={id ? t("editCashier") : t("addCashier")} // يتغير العنوان تلقائياً بناءً على وضع التعديل
      apiUrl={`/api/restaurant/cashiers`} // إرسال الرابط الصحيح (رابط التعديل بالـ ID أو الإضافة بدون ID)
      method={id ? "PUT" : "POST"} // تحديد نوع الطلب لتحديث البيانات عند التعديل
      queryKey="cashiers"
      fields={cashierFields}
      initialData={initialData} // البيانات المعبأة مسبقاً التي تم فكها من الريسبونس الجديد لتملأ المدخلات تلقائياً
      onSuccessAction={(res) => {
        const targetId = res?.data?.data?.id || res?.data?.id || res?.id || initialData?.id;
        navigate("/cashiers", { state: { highlightedId: targetId } });
      }}
    />
  );
};

export default CashierAdd;