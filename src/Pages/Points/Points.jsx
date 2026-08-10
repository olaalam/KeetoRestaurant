import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function Points() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // جلب بيانات نقاط المنتجات
  const { data: Points = [], isLoading } = useQuery({
    queryKey: ["points"],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/points-products");
      return res.data.data.data;
    },
  });

  // Mutation للتحكم في مفتاح التفعيل (Toggle Switch)
  const toggleMutation = useMutation({
    mutationFn: async (id) => {
      // إرسال طلب التبديل للـ API (يمكنك استبدال put بـ patch حسب المطلوب من الباك إند)
      return await api.put(`/api/restaurant/points-products/${id}/toggle`);
    },
    onSuccess: () => {
      // إعادة تحديث القائمة فور نجاح العملية
      queryClient.invalidateQueries(["points"]);
    },
  });

  const columns = [
    {
      accessorFn: (row) => {
        const currentLang = i18n?.language || "ar";
        return currentLang === "ar"
          ? row.food?.nameAr || row.food?.name
          : row.food?.name;
      },
      id: "foodName",
      header: t("Product Name"),
    },
    {
      accessorKey: "pointsRequiredForRedeem",
      header: t("Points Required"),
    },
    {
      accessorKey: "isActive",
      header: t("Status"),
      cell: ({ row }) => {
        const item = row.original;
        const isPending = toggleMutation.isPending && toggleMutation.variables === item.id;

        return (
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={item.isActive}
              disabled={isPending}
              onChange={() => toggleMutation.mutate(item.id)}
              className="sr-only peer"
            />
            {/* تصميم الـ Switch */}
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            <span className="ms-3 text-xs font-medium text-gray-700">
              {item.isActive ? t("Active") : t("Inactive")}
            </span>
          </label>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title={t("Points Products")}
        columns={columns}
        data={Points}
        isLoading={isLoading}
        queryKey="points"
        deleteApiUrl="/api/restaurant/points-products"
        onAdd={() => navigate("/points/add")}
        onEdit={(row) => {
          navigate(`/points/edit/${row.id}`);
        }}
      />
    </div>
  );
}