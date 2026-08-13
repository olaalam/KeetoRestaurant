import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GenericDataTable from "@/components/GenericDataTable";
import AddPage from "@/components/AddPage";
import { useGet } from "@/hooks/useGet";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DeliveryMan() {
  // للتبديل بين صفحة الجدول وصفحة الإضافة/التعديل
  const [view, setView] = useState("list"); 
  const [selectedItem, setSelectedItem] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [highlightedId, setHighlightedId] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  
  const { t, isRTL } = useTranslation();

  // إعدادات الـ API بناءً على صورتك image_7bdf00.png
  const apiUrl = "/api/restaurant/delivery-men";
  const queryKey = "delivery-men";

  // 1. جلب البيانات باستخدام useGet
  const { data, isLoading } = useGet(queryKey, apiUrl);
  
  // استخراج المصفوفة من الرد (عدليها بناءً على شكل الرد الفعلي من الباك إند لديكِ)
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
    }
  ];

  // 3. إعداد حقول الفورم لـ AddPage بناءً على الـ JSON المرفق
  const formFields = [
    { 
      name: "name", 
      label: t("name") || "الاسم", 
      type: "text", 
      required: true 
    },
    { 
      name: "phone", 
      label: t("phone") || "رقم الهاتف", 
      type: "text", 
      required: true 
    },
    { 
      name: "email", 
      label: t("email") || "البريد الإلكتروني", 
      type: "email", 
      required: true 
    },
    { 
      name: "password", 
      label: t("password") || "كلمة المرور", 
      type: "password", 
      // جعل كلمة المرور مطلوبة في حالة الإضافة فقط، واختيارية في حالة التعديل
      required: !selectedItem 
    },
    { 
      name: "image", 
      label: t("image") || "الصورة الشخصية", 
      type: "file", 
      // AddPage يدعم نوع file وسيحوله تلقائياً لـ Base64 
      required: !selectedItem 
    },
  ];



  // 4. عرض فورم الإضافة / التعديل
  if (view === "form") {
    return (
      <div className="space-y-4 w-full">


        <AddPage
          title={t("deliveryMan") || "عامل التوصيل"}
          apiUrl={apiUrl}
          queryKey={queryKey}
          method={selectedItem ? "PUT" : "POST"}
          fields={formFields}
          initialData={selectedItem}

        />
      </div>
    );
  }

  // 5. عرض الجدول الأساسي
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
      // تفعيل زر الإضافة
      onAdd={() => {
        setSelectedItem(null);
        setView("form");
      }}
      // تفعيل زر التعديل (أيقونة القلم)
      onEdit={(row) => {
        setSelectedItem(row);
        setView("form");
      }}
      // تمرير رابط الحذف لتفعيل أيقونة سلة المهملات
      deleteApiUrl={apiUrl}
    />
  );
}