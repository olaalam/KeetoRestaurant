import React, { useState, useMemo } from "react";
import { useGet } from "@/hooks/useGet";
import { usePost } from "@/hooks/usePost";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  ShoppingBag,
  Bike,
  UtensilsCrossed,
  Building2,
  Search,
  Pencil,
  Save,
  X,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

const ICONS_BY_MODULE = {
  takeaway: ShoppingBag,
  delivery: Bike,
  dine_in: UtensilsCrossed,
};

export default function PricingProduct({ branchId: branchIdProp }) {
  const { t, isRTL } = useTranslation();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState(branchIdProp || "");

  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editChannels, setEditChannels] = useState({
    takeaway: true,
    delivery: true,
    dine_in: true,
  });

  // ---- fetch branches + service modules for tabs/select ----
  const { data: selectRes } = useGet("pricing-select", "/api/restaurant/pricing/select");

  const branches = selectRes?.data?.data?.activeBranches || [];
  const apiServiceModules = selectRes?.data?.data?.serviceModules || [];

  const TABS = useMemo(() => {
    const moduleTabs = apiServiceModules.map((sm) => ({
      key: sm.id,
      label: sm.name,
      icon: ICONS_BY_MODULE[sm.id] || LayoutGrid,
      serviceModule: sm.id,
    }));

    return [
      { key: "all", label: "All", icon: LayoutGrid, serviceModule: null },
      ...moduleTabs,
      { key: "branch_pricing", label: "Branch Pricing", icon: Building2, serviceModule: null },
    ];
  }, [apiServiceModules]);

  const activeTabDef = TABS.find((tab) => tab.key === activeTab);
  const isBranchPricing = activeTab === "branch_pricing";

  // ---- fetch list ----
  const queryParams = useMemo(() => {
    const params = {};
    if (branchId) params.branchId = branchId;
    if (activeTabDef?.serviceModule) params.serviceModule = activeTabDef.serviceModule;
    return params;
  }, [branchId, activeTabDef]);

  const { data, isLoading } = useGet(
    "dynamic-menu",
    "/api/restaurant/pricing/dynamic-menu",
    queryParams
  );

  const items = data?.data?.data?.menu || [];

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter((item) => (item.name || "").toLowerCase().includes(lower));
  }, [items, search]);

  // ---- update mutation (POST) ----
  const updateMutation = usePost("/api/restaurant/pricing/product-channel", "post", "dynamic-menu");

  const getDisplayPrice = (item) => item.finalCalculatedPrice ?? item.mainBasePrice;

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditPrice(String(getDisplayPrice(item) ?? ""));
    setEditChannels({
      takeaway: true,
      delivery: true,
      dine_in: true,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };

  const saveToAll = async (item) => {
    const foodId = item.id;
    const price = Number(editPrice);
    if (!foodId || !price || price <= 0) return;

    const selectedModules = Object.entries(editChannels)
      .filter(([, checked]) => checked)
      .map(([mod]) => mod);

    if (selectedModules.length === 0) return;

    try {
      await Promise.all(
        selectedModules.map((serviceModule) =>
          updateMutation.mutateAsync({
            foodId,
            ...(branchId ? { branchId } : {}),
            serviceModule,
            price,
          })
        )
      );
      cancelEdit();
    } catch (err) {
      // toast error handling
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight dark:text-slate-100">
          {t("productPosPricing") || "Product POS Pricing"}
        </h2>
      </div>

      {/* TABS + SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                variant={isActive ? "default" : "outline"}
                onClick={() => {
                  setActiveTab(tab.key);
                  cancelEdit();
                }}
                className={cn(
                  "h-10 rounded-xl font-medium gap-2 transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(tab.key) || tab.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400",
              isRTL ? "right-3" : "left-3"
            )}
          />
          <Input
            placeholder={t("searchByProductName") || "Search by product name..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "h-10 rounded-xl border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-sm focus-visible:ring-primary transition-all text-sm",
              isRTL ? "pr-9 pl-4" : "pl-9 pr-4"
            )}
          />
        </div>
      </div>

      {/* BRANCH SELECTOR */}
      {isBranchPricing && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("branch") || "Branch"}:
          </span>
          <Select
            value={branchId || undefined}
            onValueChange={(value) => setBranchId(value)}
          >
            <SelectTrigger className="h-10 w-56 rounded-xl border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 shadow-sm">
              <SelectValue placeholder={t("selectBranch") || "Select branch"} />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="h-14 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-4 px-6 text-center">
                  {t("sl") || "SL"}
                </TableHead>
                <TableHead className="h-14 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-4 px-6 text-center">
                  {t("productName") || "Product Name"}
                </TableHead>
                <TableHead className="h-14 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-4 px-6 text-center">
                  {t("price") || "Price"}
                </TableHead>
                <TableHead className="h-14 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-4 px-6 text-center">
                  {t("actionsCol") || "Action"}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-48">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner className="h-6 w-6 text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length ? (
                filteredItems.map((item, index) => {
                  const rowId = item.id;
                  const isEditing = editingId === rowId;
                  const name = item.name || item.nameAr || "-";

                  return (
                    <TableRow
                      key={rowId}
                      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/40 dark:hover:bg-slate-900/40 transition-all"
                    >
                      <TableCell className="py-4 px-6 text-center text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {index + 1}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center text-sm font-medium text-slate-700 dark:text-slate-200">
                        {name}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        {isEditing ? (
                          <div className="flex flex-col items-center gap-2">
                            <Input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="h-10 w-28 text-center rounded-lg border-primary focus-visible:ring-primary dark:bg-slate-900 dark:text-slate-100"
                              autoFocus
                            />
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <Checkbox
                                  checked={editChannels.takeaway}
                                  onCheckedChange={(checked) =>
                                    setEditChannels((prev) => ({ ...prev, takeaway: !!checked }))
                                  }
                                />
                                {t("takeAway") || "TAKE AWAY"}
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <Checkbox
                                  checked={editChannels.delivery}
                                  onCheckedChange={(checked) =>
                                    setEditChannels((prev) => ({ ...prev, delivery: !!checked }))
                                  }
                                />
                                {t("delivery") || "DELIVERY"}
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <Checkbox
                                  checked={editChannels.dine_in}
                                  onCheckedChange={(checked) =>
                                    setEditChannels((prev) => ({ ...prev, dine_in: !!checked }))
                                  }
                                />
                                {t("dineIn") || "DINE IN"}
                              </label>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-primary">
                            {getDisplayPrice(item)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveToAll(item)}
                              disabled={updateMutation.isPending}
                              className="h-9 rounded-lg gap-1.5 bg-primary text-primary-foreground"
                            >
                              <Save className="h-4 w-4" />
                              {t("saveToAll") || "Save to All"}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-9 w-9 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(item)}
                            className="h-9 rounded-lg gap-1.5 border-primary/30 text-primary hover:bg-primary/5 dark:border-primary/40"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {t("update") || "Update"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center h-48 text-sm text-slate-400 font-medium"
                  >
                    {t("noDataFound") || "No data found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}