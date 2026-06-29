import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function ExpenseCategories() {
  const navigate = useNavigate();
  const { t } = useTranslation(); // تفعيل الهوك

  const { data: ExpenseCategories = [], isLoading } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/expense-categories");
      return res.data.data.data;
    },
  });
  const columns = [
    {
      accessorKey: "name",
      header: t("Name"), // تصحيح الكلمة من Nme إلى Name
    },
      {
      accessorKey: "arName",
      header: t("ArabicName"), // تصحيح الكلمة من Nme إلى Name
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title={t("ExpenseCategories")}
        columns={columns}
        data={ExpenseCategories}
        isLoading={isLoading}
        queryKey="expense-categories"
        // editApiUrl="/api/restaurant/image"
        deleteApiUrl="/api/restaurant/expense-categories"
        onAdd={() => navigate("/expense-categories/add")}
        onEdit={(e) => navigate(`/expense-categories/edit/${e.id}`)}
      />
    </div>
  );
}
