import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";

const CashierAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 1. جلب بيانات الكاشير (في حالة التعديل)
  const { data: cashierData, isLoading: isFetching } = useQuery({
    queryKey: ["cashier", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurant/cashiers/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.cashierData,
  });

  // 2. جلب قائمة الفروع
  const { data: branches = [], isLoading: isBranchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data } = await api.get("/api/restaurant/branches");
      return data.data.data;
    },
  });

  // 3. جلب قائمة الحسابات المالية
  const { data: financialAccounts = [], isLoading: isAccountsLoading } = useQuery({
    queryKey: ["financialAccounts"],
    queryFn: async () => {
      const { data } = await api.get("/api/restaurant/FinancialAccount");
      return data.data.data;
    },
  });

  const rawData = state?.cashierData || cashierData;

  // إعداد البيانات الافتراضية بحيث تكون مطابقة للـ JSON المطلوب
  const initialData = rawData 
    ? { ...rawData } 
    : { status: "active", cashier_active: true };

  // تجهيز الخيارات للحقول المنسدلة (Combobox)
  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: branch.name, // تأكد أن الاسم موجود في الرد الخاص بالباك اند
  }));

  const accountOptions = financialAccounts.map((account) => ({
    value: account.id,
    label: account.name, // افترضت أن الحساب له 'name'.. عدلها لو كان اسم الحقل مختلف في الباك اند
  }));

  const statusOptions = [
    { value: "active", label: t("active") },
    { value: "inactive", label: t("inactive") },
  ];

  // بناء الحقول بناءً على الـ JSON المطلوب
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
    // {
    //   name: "cashier_active",
    //   label: t("cashierActive"),
    //   type: "checkbox", // افترضت أن كمبوننت AddPage يدعم نوع checkbox للقيم المنطقية (Boolean)
    //   required: false,
    // },
  ];

  // عرض الـ Spinner حتى يتم تحميل كافة البيانات المطلوبة للـ dropdowns
  if ((id && isFetching) || isBranchesLoading || isAccountsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AddPage
      title={id ? t("editCashier") : t("addCashier")}
      apiUrl="/api/restaurant/cashiers"
      queryKey="cashiers"
      fields={cashierFields}
      initialData={initialData}
      onSuccessAction={(res) => {
        // التقاط الـ ID الراجع للتوجيه والإضاءة (Highlighting)
        const targetId = res?.data?.data?.id || res?.data?.id || res?.id || initialData?.id;
        
        // التوجيه لصفحة الكاشير
        navigate("/cashiers", { state: { highlightedId: targetId } });
      }}
    />
  );
};

export default CashierAdd;