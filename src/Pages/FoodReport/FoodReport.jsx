import React, { useState } from "react";
import GenericDataTable from "@/components/GenericDataTable";
import { useGet } from "@/hooks/useGet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, RotateCcw, DollarSign, ShoppingBag, Layers, TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function FoodReportPage() {
  const { t, isRTL } = useTranslation();

  // 1. Initial filter parameters matching the API structure
  const defaultParams = {
    startDate: "2026-09-26",
    endDate: "2026-10-19",
    branchId: "",
    arrangedType: "desc",
    sortBy: "totalsold",
    status: "all_non_cancelled",
  };

  const [filters, setFilters] = useState(defaultParams);

  // 2. Fetch data using useGet hook
  const { data, isLoading, isFetching } = useGet(
    ["foodReport", filters],
    "/api/restaurant/report/food",
    filters
  );

  const summary = data?.data?.summary;
  const foodList = data?.data?.foods || [];

  // 3. Define table columns with multi-language support
  const columns = [
    {
      accessorKey: "image",
      header: t("image") || "Image",
      cell: ({ row }) => (
        <img
          src={row.original.image}
          alt={row.original.foodName}
          className="w-10 h-10 rounded-lg object-cover mx-auto border border-slate-100"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/40";
          }}
        />
      ),
    },
    {
      accessorKey: "foodName",
      header: t("foodName") || "Food Name",
      cell: ({ row }) => (
        <span className="font-bold text-slate-800 dark:text-slate-100">
          {isRTL ? (row.original.foodNameAr || row.original.foodName) : row.original.foodName}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: t("category") || "Category",
      cell: ({ row }) => (
        <span className="text-slate-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-xs font-medium">
          {isRTL ? (row.original.category?.nameAr || row.original.category?.name) : (row.original.category?.name || "-")}
        </span>
      ),
    },
    {
      accessorKey: "basePrice",
      header: t("basePrice") || "Base Price",
      cell: ({ row }) => `${parseFloat(row.original.basePrice || 0).toFixed(2)}`,
    },
    {
      accessorKey: "totalSoldQuantity",
      header: t("totalSoldQuantity") || "Sold Quantity",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {row.original.totalSoldQuantity || 0}
        </span>
      ),
    },
    {
      accessorKey: "totalRevenue",
      header: t("totalRevenue") || "Total Revenue",
      cell: ({ row }) => {
        const revenue = parseFloat(row.original.totalRevenue || 0);
        return (
          <span className="font-bold text-emerald-600">
            {revenue.toFixed(2)}
          </span>
        );
      },
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters(defaultParams);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{t("totalRevenue") || "Total Revenue"}</p>
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {parseFloat(summary.totalRevenue || 0).toLocaleString()}
              </h4>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{t("totalSoldQuantity") || "Total Sold Quantity"}</p>
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {summary.totalSoldQuantity}
              </h4>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{t("totalOrdersCount") || "Total Orders"}</p>
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {summary.totalOrdersCount}
              </h4>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{t("foodsWithSalesCount") || "Sold Foods"}</p>
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {summary.foodsWithSalesCount} / {summary.totalFoodsCount}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800 dark:text-slate-100 font-bold text-base">
          <Filter className="h-5 w-5 text-primary" />
          <span>{t("searchAndFilterFilters") || "Search & Report Filters"}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t("startDate") || "Start Date"}</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t("endDate") || "End Date"}</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t("sortBySales") || "Sort By Sales"}</Label>
            <Select
              value={filters.arrangedType}
              onValueChange={(val) => handleFilterChange("arrangedType", val)}
            >
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder={t("selectSorting") || "Select Sorting"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{t("highestSelling") || "Highest Selling (Desc)"}</SelectItem>
                <SelectItem value="asc">{t("lowestSelling") || "Lowest Selling (Asc)"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-10 px-4 rounded-xl gap-1 text-slate-500 hover:text-slate-700 w-full"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-xs">{t("reset") || "Reset"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <GenericDataTable
        title={t("foodReportTitle") || "Food Report"}
        columns={columns}
        data={foodList}
        isLoading={isLoading || isFetching}
        queryKey="foodReport"
        actions={false}
      />
    </div>
  );
}