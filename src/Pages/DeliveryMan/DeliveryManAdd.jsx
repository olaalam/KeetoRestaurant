import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";

const DeliveryManAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const apiUrl = "/api/restaurant/delivery-men";
  const queryKey = "delivery-men";

  // 1. جلب بيانات عامل التوصيل في حالة التعديل
  const { data: deliveryManData, isLoading: isFetchingDeliveryMan } = useQuery({
    queryKey: ["delivery-man", id],
    queryFn: async () => {
      const { data } = await api.get(`${apiUrl}/${id}`);
      return data?.data?.data || data?.data || data;
    },
    enabled: !!id && !state?.deliveryManData,
  });

  // 2. جلب قائمة الفروع من الـ API المذكور
  const { data: branchesRes, isLoading: isFetchingBranches } = useQuery({
    queryKey: ["restaurant-branches-select"],
    queryFn: async () => {
      const { data } = await api.get("/api/restaurant/branches");
      return data?.data?.data || data?.data || data || [];
    },
  });

  // تحويل الفروع لشكل خيارات (Options) تناسب حقل الـ select
  const branchesList = Array.isArray(branchesRes) ? branchesRes : [];
  const branchOptions = branchesList.map((branch) => ({
    value: branch.id || branch._id,
    label: branch.name || branch.nameAr || branch.branchName || String(branch.id || branch._id),
  }));

  const rawData = state?.deliveryManData || deliveryManData;

  // التأكد من أن القيم المبدئية يتم تمريرها بشكل صحيح
  const initialData = rawData ? {
    ...rawData,
    branchId: rawData.branchId || rawData.branch_id || "",
    isActive: rawData.isActive === true || rawData.isActive === "true" || rawData.isActive === 1 || rawData.isActive === "1"
  } : {
    isActive: true,
    branchId: ""
  };

  const deliveryManFields = [
    {
      name: "name",
      label: t("name") || "الاسم",
      required: true
    },
    {
      name: "phone",
      label: t("phone") || "رقم الهاتف",
      required: true
    },
    {
      name: "email",
      label: t("email") || "البريد الإلكتروني",
      type: "email",
      required: true
    },
    // إضافة حقل اختيار الفرع (Branch Select)
    {
      name: "branchId",
      label: t("branch") || "الفرع",
      type: "select",
      required: true,
      options: branchOptions,
    },
    ...(!id
      ? [
        {
          name: "password",
          label: t("password") || "كلمة المرور",
          type: "password",
          required: true,
        },
      ]
      : []),
    {
      name: "image",
      label: t("image") || "الصورة الشخصية",
      type: "file",
      required: !id
    },
    {
      name: "isActive",
      label: t("status") || "الحالة",
      type: "select",
      options: [
        { value: true, label: t("active") || "نشط" },
        { value: false, label: t("inactive") || "غير نشط" },
      ],
      required: true,
    }
  ];

  if (id && isFetchingDeliveryMan) return <LoadingSpinner />;
  if (isFetchingBranches) return <LoadingSpinner />;

  return (
    <div className="space-y-4 w-full">
      <AddPage
        title={t("deliveryMan") || "عامل التوصيل"}
        apiUrl={apiUrl}
        queryKey={queryKey}
        method={id ? "PUT" : "POST"}
        fields={deliveryManFields}
        initialData={initialData}
        
        transformPayload={(submitData) => {
          const parseBoolean = (val) => val === 'true' || val === true || val === '1' || val === 1;

          return {
            ...submitData,
            isActive: parseBoolean(submitData.isActive),
            branchId: submitData.branchId ? String(submitData.branchId) : null,
          };
        }}
        
        onSuccessAction={(res) => {
          const targetId = res?.data?.data?.id || res?.data?.id || res?.id || initialData?.id || id;
          navigate("/delivery-man", { state: { highlightedId: targetId } });
        }}
      />
    </div>
  );
};

export default DeliveryManAdd;