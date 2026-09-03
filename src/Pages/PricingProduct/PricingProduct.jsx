import React, { useState, useMemo } from "react";
import { useGet } from "@/hooks/useGet";
import { usePost } from "@/hooks/usePost";
import { toast } from 'sonner';
import api from '@/api/axios';
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  ShoppingBag,
  Bike,
  UtensilsCrossed,
  Building2,
  Search,
  Pencil,
  ChevronRight,
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
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);

  // ---- price edit modal state ----
  const [priceModalItem, setPriceModalItem] = useState(null);
  const [priceModalValue, setPriceModalValue] = useState("");

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

  // ---- fetch subcategories for the left sidebar filter ----
  const { data: subCategoriesRes } = useGet(
    "pricing-subcategories",
    "/api/restaurant/subcategories"
  );
  const subCategories = subCategoriesRes?.data?.data?.subcategories || subCategoriesRes?.data?.data || [];

  // 💡 تكوين الرابط الديناميكي بناءً على اختيار القسم الفرعي أو التاب
  const queryParams = new URLSearchParams();
  if (branchId) {
    queryParams.append("branchId", branchId);
  }
  if (activeTab && activeTab !== "all" && activeTab !== "branch_pricing") {
    queryParams.append("serviceModule", activeTab);
  }

  let endpoint = "";
  if (selectedSubCategoryId) {
    queryParams.append("subCategoryId", selectedSubCategoryId);
    endpoint = `/api/restaurant/pricing/dynamic-menu?${queryParams.toString()}`;
  } else {
    const queryString = queryParams.toString();
    endpoint = queryString ? `/api/restaurant/pricing/dynamic-menu?${queryString}` : `/api/restaurant/pricing/dynamic-menu`;
  }

  const productsQueryKey = ["products", activeTab, selectedSubCategoryId || "all", branchId || "all"];
  
  // 💡 استخراج دالة refetch لإعادة إرسال طلب جلب البيانات
  const { data: productsRes, isLoading, refetch } = useGet(
    productsQueryKey,
    endpoint
  );

  // 💡 استخراج المنتجات سواء كانت قادمة من هيكل الـ dynamic-menu (menu) أو الـ food api (items)
  const items = useMemo(() => {
    const resData = productsRes?.data?.data;
    if (!resData) return [];
    if (Array.isArray(resData.menu)) return resData.menu;
    if (Array.isArray(resData.items)) return resData.items;
    if (Array.isArray(resData)) return resData;
    return [];
  }, [productsRes]);

  // 💡 فلترة المنتجات بناءً على نص البحث (Search Input)
  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter((item) => (item.name || item.nameAr || "").toLowerCase().includes(lower));
  }, [items, search]);

  // ---- price update mutation ----
  const updateMutation = usePost("/api/restaurant/pricing/product-channel", "post", "dynamic-menu");

  // 💡 دالة عرض السعر الصحيح بناءً على الـ Response الجديد
  const getDisplayPrice = (item) => {
    return item.finalCalculatedPrice ?? item.mainBasePrice ?? item.price ?? "0.00";
  };

  const openPriceModal = (item) => {
    setPriceModalItem(item);
    setPriceModalValue(String(getDisplayPrice(item) ?? ""));
  };

  const closePriceModal = () => {
    setPriceModalItem(null);
    setPriceModalValue("");
  };

  const savePriceModal = async () => {
    if (!priceModalItem) return;
    const price = Number(priceModalValue);
    if (!price || price <= 0) return;

    // 💡 إذ كان التاب "all" أوالـ serviceModule غير محدد نرسل "all"، وإلا نرسل الـ serviceModule الخاص بالتاب الحالي
    const serviceModuleToSend = (!activeTabDef?.serviceModule || activeTab === "all")
      ? "all"
      : activeTabDef.serviceModule;

    try {
      await updateMutation.mutateAsync({
        foodId: priceModalItem.id,
        ...(branchId ? { branchId } : {}),
        serviceModule: serviceModuleToSend,
        price,
      });
      closePriceModal();
      refetch(); // 👈 إعادة جلب البيانات بعد تحديث السعر
    } catch (err) {
      // toast error handling
    }
  };

  const toggleOutOfStock = async (foodId, currentStockStatus) => {
    try {
      await api.put(`/api/restaurant/food/${foodId}`, {
        isOutOfStock: currentStockStatus
      });
      
      toast.success(t('statusUpdatedSuccessfully') || 'تم تحديث الحالة بنجاح');
      refetch(); // إعادة جلب البيانات لتحديث الـ Table بالبيانات الجديدة من السيرفر
    } catch (error) {
      console.error("Error updating stock status:", error);
      toast.error(t('failedToUpdateStatus') || 'فشل تحديث الحالة');
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

      {/* SIDEBAR (subcategories) + TABLE */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* SUBCATEGORY SIDEBAR */}
        <div className="w-full md:w-64 shrink-0 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
          <div className="p-2 space-y-1 max-h-[560px] overflow-y-auto">
            <button
              onClick={() => setSelectedSubCategoryId(null)}
              className={cn(
                "w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                selectedSubCategoryId === null
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
              )}
            >
              <span>{t("all") || "All"}</span>
              <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
            </button>

            {subCategories.map((sc) => {
              const isActive = selectedSubCategoryId === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedSubCategoryId(sc.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
                  )}
                >
                  <span className="truncate">{sc.name}</span>
                  <ChevronRight className={cn("h-4 w-4 shrink-0", isRTL && "rotate-180")} />
                </button>
              );
            })}
          </div>
        </div>

        {/* TABLE */}
        <div className="flex-1 w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
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
                    {t("outOfStock") || "Out of Stock"}
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
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-bold text-primary">
                              {getDisplayPrice(item)}
                            </span>
                            <button
                              onClick={() => openPriceModal(item)}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                              title={t("update") || "Update"}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={
                                Boolean(
                                  item.isOutOfStock ?? 
                                  item.outOfStock ?? 
                                  (item.isAvailable !== undefined ? !item.isAvailable : false)
                                )
                              }
                              onCheckedChange={(checked) => {
                                toggleOutOfStock(item.id, checked);
                              }}
                            />
                          </div>
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

      {/* PRICE EDIT MODAL */}
      <Dialog open={!!priceModalItem} onOpenChange={(open) => !open && closePriceModal()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("editPrice") || "Edit Price"}</DialogTitle>
          </DialogHeader>

          {priceModalItem && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {(t("updatePriceFor") || "Update price for")}{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {priceModalItem.name || priceModalItem.nameAr}
              </span>
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("priceEgp") || "Price (EGP)"}
            </label>
            <Input
              type="number"
              value={priceModalValue}
              onChange={(e) => setPriceModalValue(e.target.value)}
              autoFocus
              className="h-10 rounded-lg border-primary focus-visible:ring-primary dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePriceModal}>
              {t("cancel") || "Cancel"}
            </Button>
            <Button onClick={savePriceModal} disabled={updateMutation.isPending}>
              {t("save") || "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}