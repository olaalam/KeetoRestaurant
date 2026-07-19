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

  const { data: deliveryManData, isLoading: isFetching } = useQuery({
    queryKey: ["delivery-man", id],
    queryFn: async () => {
      const { data } = await api.get(`${apiUrl}/${id}`);
      return data?.data?.data || data?.data || data;
    },
    enabled: !!id && !state?.deliveryManData,
  });

  const rawData = state?.deliveryManData || deliveryManData;

  // التأكد من أن القيمة المبدئية يتم تمريرها كـ Boolean
  const initialData = rawData ? {
    ...rawData,
    isActive: rawData.isActive === true || rawData.isActive === "true" || rawData.isActive === 1
  } : {
    isActive: true // القيمة الافتراضية عند الإضافة
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

  if (id && isFetching) return <LoadingSpinner />;

  return (
    <div className="space-y-4 w-full">
      <AddPage
        title={t("deliveryMan") || "عامل التوصيل"}
        apiUrl={apiUrl}
        queryKey={queryKey}
        method={id ? "PUT" : "POST"}
        fields={deliveryManFields}
        initialData={initialData}
        // إضافة دالة تحويل البيانات قبل الإرسال (تأكد من اسم الـ prop في مكونة AddPage عندك، قد تكون transformData أو formatPayload)
        transformData={(submitData) => {
          // إذا كانت AddPage تستخدم FormData بسبب وجود ملف (صورة)
          if (submitData instanceof FormData) {
            const isActiveValue = submitData.get('isActive');
            const isBoolTrue = isActiveValue === 'true' || isActiveValue === true || isActiveValue === '1';
            // في حالة FormData لا يمكن إرسال boolean صريح، لذا نرسلها كـ 1 أو 0 (وهي الطريقة الصحيحة للـ Backend)
            submitData.set('isActive', isBoolTrue ? 1 : 0);
            return submitData;
          }

          // إذا كانت AddPage ترسل البيانات كـ JSON
          return {
            ...submitData,
            isActive: submitData.isActive === 'true' || submitData.isActive === true || submitData.isActive === 1
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