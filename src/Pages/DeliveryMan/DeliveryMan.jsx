import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GenericDataTable from "@/components/GenericDataTable";
import { useGet } from "@/hooks/useGet";
import { useTranslation } from "@/hooks/useTranslation";

export default function DeliveryMan() {
  const location = useLocation();
  const navigate = useNavigate();
  const [highlightedId, setHighlightedId] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  
  const { t } = useTranslation();

  // إعدادات الـ API
  const apiUrl = "/api/restaurant/delivery-men";
  const queryKey = "delivery-men";

  // 1. جلب البيانات باستخدام useGet
  const { data, isLoading } = useGet(queryKey, apiUrl);
  
  // استخراج المصفوفة من الرد
  const deliveryMenList = data?.data?.data || data?.data || [];

  useEffect(() => {
    if (location.state?.highlightedId && deliveryMenList.length) {
      const index = deliveryMenList.findIndex(item => String(item.id) === String(location.state.highlightedId));

      if (index !== -1) {
        const pageIndex = Math.floor(index / pagination.pageSize);
        setPagination(prev => ({ ...prev, pageIndex }));
        setHighlightedId(location.state.highlightedId);

        const timer = setTimeout(() => {
          setHighlightedId(null);
          navigate(location.pathname, { replace: true, state: {} });
        }, 3500);

        return () => clearTimeout(timer);
      }
    }
  }, [location.state, deliveryMenList, pagination.pageSize, navigate, location.pathname]);

  // 2. إعداد أعمدة الجدول لـ GenericDataTable
  const columns = [
    {
      accessorKey: "image",
      header: t("image") || "صورة",
      cell: ({ row }) => {
        const imageUrl = row.original.image;
        return imageUrl ? (
          <img 
            src={imageUrl} 
            alt="delivery man" 
            className="w-10 h-10 rounded-full object-cover border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs">
            N/A
          </div>
        );
      }
    },
    {
      accessorKey: "name",
      header: t("name") || "الاسم",
    },
    {
      accessorKey: "phone",
      header: t("phone") || "رقم الهاتف",
    },
    {
      accessorKey: "email",
      header: t("email") || "البريد الإلكتروني",
    },
    {
      accessorKey: "isActive",
      header: t("status") || "الحالة",
      cell: ({ row }) => {
        const active = row.original.isActive;
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {active ? (t("active") || "نشط") : (t("inactive") || "غير نشط")}
          </span>
        );
      }
    }
  ];

  // 3. عرض الجدول الأساسي مع التوجيه لصفحات الإضافة والتعديل عبر المسارات
  return (
    <GenericDataTable
      title={t("deliveryMen") || "عمال التوصيل"}
      columns={columns}
      data={deliveryMenList}
      isLoading={isLoading}
      queryKey={queryKey}
      editApiUrl={apiUrl}
      highlightedId={highlightedId}
      pagination={pagination}
      setPagination={setPagination}
      onAdd={() => {
        navigate("add"); // الانتقال إلى مسار الإضافة: delivery-man/add
      }}
      onEdit={(row) => {
        navigate(`edit/${row.id}`); // الانتقال إلى مسار التعديل: delivery-man/edit/:id
      }}
      deleteApiUrl={apiUrl}
    />
  );
}