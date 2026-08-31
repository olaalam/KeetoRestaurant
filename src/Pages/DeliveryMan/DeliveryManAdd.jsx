import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";

const DeliveryManAdd = () => {
  const { id } = useParams(); // لو الـ id موجود يبقى إحنا ف صفحة التعديل
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const apiUrl = "/api/restaurant/delivery-men";
  const queryKey = "delivery-men";

  // جلب البيانات عند التعديل فقط في حال لم يتم تمريرها عبر الـ state
  const { data: deliveryManData, isLoading: isFetching } = useQuery({
    queryKey: ["delivery-man", id],
    queryFn: async () => {
      const { data } = await api.get(`${apiUrl}/${id}`);
      return data?.data?.data || data?.data || data;
    },
    enabled: !!id && !state?.deliveryManData,
  });

  const rawData = state?.deliveryManData || deliveryManData;
  const initialData = rawData ? { ...rawData } : {};

  // إعداد حقول الفورم
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
        method={id ? "PUT" : "POST"} // تحديد نوع الطلب بناءً على وجود الـ id
        fields={deliveryManFields}
        initialData={initialData}
        onSuccessAction={(res) => {
          const targetId = res?.data?.data?.id || res?.data?.id || res?.id || initialData?.id || id;
          // العودة للجدول الأساسي مع تمرير الـ ID لتحديد العنصر المضاف/المعدل
          navigate("/delivery-man", { state: { highlightedId: targetId } });
        }}
      />
    </div>
  );
};

export default DeliveryManAdd;