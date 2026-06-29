import React from "react";
import { useParams, useLocation } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";

const ExpenseAdd = () => {
  // تم تعديل الاسم ليتطابق مع الـ Route (expenseId)
  const { expenseId } = useParams();
  const { state } = useLocation();
  const { t } = useTranslation();

  // جلب البيانات في حالة التعديل
  const { data: ExpenseData, isLoading: isFetching } = useQuery({
    queryKey: ["ExpenseAdd", expenseId],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurant/expenses/${expenseId}`);
      return data.data.data;
    },
    enabled: !!expenseId && !state?.ExpenseData,
  });

  // جلب الخيارات للقوائم المنسدلة (Selects)
  const { data: selectData } = useQuery({
    queryKey: ["expenseSelect"],
    queryFn: async () => {
      const { data } = await api.get("/api/restaurant/expenses/select");
      return data.data.data;
    },
  });

  const rawData = state?.ExpenseData?.expensses || ExpenseData?.expensses;

  const initialData = React.useMemo(() => {
    if (!rawData) return null;
    return {
      id: rawData.id,
      name: rawData.name,
      amount: rawData.amount,
      categoryId: rawData.categoryId,
      financialAccountId: rawData.financialAccountId,
      note: rawData.note,
    };
  }, [rawData]);

  const ExpenseFields = [
    { name: "name", label: t("Name"), type: "text", required: true },
    { name: "amount", label: t("Amount"), type: "number", required: true },
    {
      name: "categoryId",
      label: t("Category"),
      type: "select",
      required: true,
      options: selectData?.expensecategories?.map(c => ({ label: c.name, value: c.id })) || []
    },
    {
      name: "financialAccountId",
      label: t("FinancialAccount"),
      type: "select",
      required: true,
      options: selectData?.financialAccounts?.map(f => ({ label: f.name, value: f.id })) || []
    },
    { name: "note", label: t("Note"), type: "textarea" },
  ];

  if (expenseId && isFetching) return <LoadingSpinner />;

  return (
    <AddPage
      title={t("Expense")}
      apiUrl="/api/restaurant/expenses"
      queryKey="expense" // تم تحديثها لتكون نفس الـ queryKey المستخدم في القائمة للتحديث التلقائي
      fields={ExpenseFields}
      initialData={initialData}
      method={expenseId ? "PUT" : "POST"}
      onSuccessAction={() => window.history.back()}
    />
  );
};

export default ExpenseAdd;