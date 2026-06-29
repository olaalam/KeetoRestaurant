import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Expense() {
  const navigate = useNavigate();
  const { t } = useTranslation(); // تفعيل الهوك

  const { data: Expense = [], isLoading } = useQuery({
    queryKey: ["expense"],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/expenses");
      return res.data.data.data;
    },
  });
  const columns = [
    {
      accessorKey: "expensses.name",
      header: t("Name"),
    },
    {
      accessorKey: "FinancialAccounts.name",
      header: t("FinancialAccount"),
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title={t("Expense")}
        columns={columns}
        data={Expense}
        isLoading={isLoading}
        queryKey="expense"
        // editApiUrl="/api/restaurant/image"
        deleteApiUrl="/api/restaurant/expenses"
        onAdd={() => navigate("/expense/add")}
        onEdit={(row) => {
          const expenseId = row.expensses.id;
          navigate(`/expense/edit/${expenseId}`);
        }}
      />
    </div>
  );
}
