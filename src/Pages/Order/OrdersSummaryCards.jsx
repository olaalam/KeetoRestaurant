import React from "react";
import { ShoppingBag, Wallet } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const formatAmount = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function StatCard({ icon: Icon, label, value, isLoading, iconClass }) {
  return (
    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconClass}`}>
        <Icon size={22} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </span>
        {isLoading ? (
          <span className="mt-1 h-7 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ) : (
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</span>
        )}
      </div>
    </div>
  );
}

export default function OrdersSummaryCards({ summary, isLoading }) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatCard
        icon={ShoppingBag}
        label={t("totalOrders") || "Total Orders"}
        value={Number(summary?.totalOrders || 0).toLocaleString()}
        isLoading={isLoading}
        iconClass="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
      />
      <StatCard
        icon={Wallet}
        label={t("totalAmount") || "Total Amount"}
        value={`${formatAmount(summary?.totalAmount)} ${t("currency") || ""}`}
        isLoading={isLoading}
        iconClass="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300"
      />
    </div>
  );
}