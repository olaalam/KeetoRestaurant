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
  const navigate = useNavigate(); // 💡 للانتقال للجدول مع تمرير المعرف المضيء
  const { t } = useTranslation();

  // 💡 جلب بيانات عامل التوصيل عند التعديل باستخدام الـ ID
  const { data: deliveryManData, isLoading: isFetching } = useQuery({
    queryKey: ["delivery-man", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurant/delivery-men/${id}`);
      return data?.data?.data || data?.data || data;
    },
    enabled: !!id && !state?.deliveryManData, // جلب البيانات فقط لو لدينا ID ولم تُمرر البيانات عبر الـ state
  });

  const rawData = state?.deliveryManData || deliveryManData;
  const initialData = rawData ? { ...rawData } : {};

  // 💡 إعداد الحقول المطلوبة لـ AddPage
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
    // 💡 كلمة المرور مطلوبة في حالة الإضافة فقط، وتُخفى أو تُترك اختيارية عند التعديل
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
      required: !id // مطلوبة في الإضافة فقط
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
    <AddPage
      title={t("deliveryMan") || "عامل التوصيل"}
      apiUrl="/api/restaurant/delivery-men"
      queryKey="delivery-men"
      fields={deliveryManFields}
      initialData={initialData}
      onSuccessAction={(res) => {
        // 💡 التقاط الـ ID الراجع من السيرفر عند الإضافة، أو الـ ID الموجود مسبقاً عند التعديل
        const targetId = res?.data?.data?.id || res?.data?.id || res?.id || initialData?.id;

        // 💡 التوجيه لصفحة عمال التوصيل وتمرير الـ ID المضيء داخل الـ state
        navigate("/delivery-man", { state: { highlightedId: targetId } });
      }}
    />
  );
};

export default DeliveryManAdd;