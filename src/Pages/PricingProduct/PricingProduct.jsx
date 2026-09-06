import React, { useState, useMemo } from "react";
import { useGet } from "@/hooks/useGet";
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
  Store,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

const ICONS_BY_MODULE = {
  takeaway: ShoppingBag,
  delivery: Bike,
  dine_in: UtensilsCrossed,
};
const getStoredBranchId = () => {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (!authStorage) return null;
    const parsed = JSON.parse(authStorage);
    // التعديل هنا: الوصول إلى user ثم branchId
    return parsed?.state?.user?.branchId || null;
  } catch (error) {
    console.error("Error reading auth-storage from localStorage", error);
    return null;
  }
};

export default function PricingProduct({ branchId: branchIdProp }) {
  const { t, isRTL } = useTranslation();

  const [search, setSearch] = useState("");
// استخدام الـ branchId القادم من الـ prop أو من الـ localStorage
  const currentBranchId = branchIdProp || getStoredBranchId();

  // ---- multi-select branches state ----
  const [selectedBranchIds, setSelectedBranchIds] = useState(
    currentBranchId ? [currentBranchId] : ["all"]
  );


  // ---- multi-select modules state (default: all) ----
  const [selectedModules, setSelectedModules] = useState(["all"]);

  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);

  // ---- price edit modal state ----
  const [priceModalItem, setPriceModalItem] = useState(null);
  const [mainItemEdit, setMainItemEdit] = useState({ price: "", status: true });
  const [variantsEdit, setVariantsEdit] = useState({});
  const [isSaving, setIsSaving] = useState(false);

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
    ];
  }, [apiServiceModules]);

// ---- helper: toggle a branch in the single-select ----
  const toggleBranch = (id) => {
    setSelectedBranchIds([id]);
  };

  // ---- helper: toggle a module in the single-select ----
  const toggleModule = (id) => {
    setSelectedModules([id]);
  };

  const isAllBranches = selectedBranchIds.includes("all");
  const isAllModules = selectedModules.includes("all");

  const branchIdsParam = isAllBranches ? "all" : selectedBranchIds.join(",");
  const modulesParam = isAllModules ? "all" : selectedModules.join(",");

  // ---- fetch subcategories for the left sidebar filter ----
  const { data: subCategoriesRes } = useGet(
    "pricing-subcategories",
    "/api/restaurant/subcategories"
  );
  const subCategories = subCategoriesRes?.data?.data?.subcategories || subCategoriesRes?.data?.data || [];

  // 💡 تكوين الرابط الديناميكي بناءً على اختيار القسم الفرعي والفروع والوحدات
  const queryParams = new URLSearchParams();

  if (!isAllBranches && branchIdsParam) {
    queryParams.append("branchId", branchIdsParam);
  }
  if (!isAllModules && modulesParam) {
    queryParams.append("serviceModule", modulesParam);
  }
  if (selectedSubCategoryId) {
    queryParams.append("subCategoryId", selectedSubCategoryId);
  }

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/api/restaurant/pricing/dynamic-menu?${queryString}`
    : `/api/restaurant/pricing/dynamic-menu`;

  const productsQueryKey = ["products", modulesParam || "all", selectedSubCategoryId || "all", branchIdsParam || "all"];

  const { data: productsRes, isLoading, refetch } = useGet(
    productsQueryKey,
    endpoint
  );

  const items = useMemo(() => {
    const resData = productsRes?.data?.data;
    if (!resData) return [];
    if (Array.isArray(resData.menu)) return resData.menu;
    if (Array.isArray(resData.items)) return resData.items;
    if (Array.isArray(resData)) return resData;
    return [];
  }, [productsRes]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter((item) => (item.name || item.nameAr || "").toLowerCase().includes(lower));
  }, [items, search]);

  const getDisplayPrice = (item) => {
    return item.finalCalculatedPrice ?? item.mainBasePrice ?? item.price ?? "0.00";
  };

  // 💡 جلب حالة الـ Out of Stock (من الـ Food مباشرة لو الكل محدد، أو من الـ channelPricing عند الفلترة)
  const getIsOutOfStock = (item) => {
    if (isAllBranches && isAllModules) {
      return Boolean(
        item.isOutOfStock ??
        item.outOfStock ??
        (item.isAvailable !== undefined ? !item.isAvailable : false)
      );
    } else {
      if (item.channelPricing && item.channelPricing.length > 0) {
        const matchingCp = item.channelPricing.find((cp) =>
          (selectedBranchIds.includes("all") || selectedBranchIds.includes(cp.branchId)) &&
          (selectedModules.includes("all") || selectedModules.includes(cp.serviceModule))
        );
        if (matchingCp) {
          return matchingCp.status === "inactive";
        }
      }
      return Boolean(
        item.isOutOfStock ??
        item.outOfStock ??
        (item.isAvailable !== undefined ? !item.isAvailable : false)
      );
    }
  };

  // 💡 جلب السعر المناسب حسب حالة الفلترة أو الـ channelPricing
  const getItemPriceForChannel = (item) => {
    if (isAllBranches && isAllModules) {
      return Number(getDisplayPrice(item) || 0);
    } else {
      if (item.channelPricing && item.channelPricing.length > 0) {
        const matchingCp = item.channelPricing.find((cp) =>
          (selectedBranchIds.includes("all") || selectedBranchIds.includes(cp.branchId)) &&
          (selectedModules.includes("all") || selectedModules.includes(cp.serviceModule))
        );
        if (matchingCp && matchingCp.price) {
          return Number(matchingCp.price);
        }
      }
      return Number(getDisplayPrice(item) || 0);
    }
  };

  // ---- Price & Variants Modal Logic ----
  const openPriceModal = (item) => {
    setPriceModalItem(item);

    // Set Main Product Initial State
    setMainItemEdit({
      price: String(getItemPriceForChannel(item) ?? ""),
      status: !getIsOutOfStock(item)
    });

    // Set Variations Initial State
    const vEdit = {};
    if (item.variations && item.variations.length > 0) {
      item.variations.forEach(variation => {
        if (variation.options && variation.options.length > 0) {
          variation.options.forEach(opt => {
            vEdit[opt.id] = {
              price: String(opt.price || "0"),
              status: opt.isAvailable ?? true
            };
          });
        }
      });
    }
    setVariantsEdit(vEdit);
  };

  const closePriceModal = () => {
    setPriceModalItem(null);
    setMainItemEdit({ price: "", status: true });
    setVariantsEdit({});
  };

  const handleVariantChange = (optId, field, value) => {
    setVariantsEdit(prev => ({
      ...prev,
      [optId]: {
        ...prev[optId],
        [field]: value
      }
    }));
  };

  const savePriceModal = async () => {
    if (!priceModalItem) return;
    setIsSaving(true);

    const serviceModuleToSend = isAllModules ? ["all"] : selectedModules;
    const branchToSend = isAllBranches ? ["all"] : selectedBranchIds;

    const promises = [];

    // 1. Prepare Main Product Payload
    const mainPayload = {
      foodId: priceModalItem.id,
      branchId: branchToSend,
      serviceModule: serviceModuleToSend,
      price: Number(mainItemEdit.price),
      status: mainItemEdit.status ? "active" : "inactive"
    };

    promises.push(api.post("/api/restaurant/pricing/product-channel", mainPayload));

    // 2. Prepare Variants Payload
    if (priceModalItem.variations?.length) {
      priceModalItem.variations.forEach(variation => {
        variation.options?.forEach(opt => {
          const editedOpt = variantsEdit[opt.id];
          if (editedOpt) {
            const varPayload = {
              variantId: opt.id,
              branchId: branchToSend,
              serviceModule: serviceModuleToSend,
              price: Number(editedOpt.price),
              status: editedOpt.status ? "active" : "inactive"
            };
            promises.push(api.post("/api/restaurant/pricing/variant-channel", varPayload));
          }
        });
      });
    }

    try {
      await Promise.all(promises);
      toast.success(t('statusUpdatedSuccessfully') || 'تم تحديث البيانات بنجاح');
      closePriceModal();
      refetch();
    } catch (err) {
      console.error("Error updating prices/variants:", err);
      toast.error(t('failedToUpdateStatus') || 'فشل في تحديث البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOutOfStock = async (foodId, currentStockStatus) => {
    try {
      if (isAllBranches && isAllModules) {
        // لو الكل محدد (All)، بنعدل على الـ Food API العام مباشرة
        await api.put(`/api/restaurant/food/${foodId}`, {
          isOutOfStock: currentStockStatus
        });
      } else {
        // لو فيه فرع أو خدمة محددة، بنستخدم الـ product-channel
        const item = items.find((i) => i.id === foodId);
        const currentPrice = getItemPriceForChannel(item);

        await api.post("/api/restaurant/pricing/product-channel", {
          foodId: foodId,
          branchId: selectedBranchIds,
          serviceModule: selectedModules,
          price: currentPrice,
          status: currentStockStatus ? "inactive" : "active"
        });
      }
      toast.success(t('statusUpdatedSuccessfully') || 'تم تحديث الحالة بنجاح');
      refetch();
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

{/* BRANCHES ROW (multi-select) - التعديل هنا: استخدام currentBranchId */}
      {!currentBranchId && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isAllBranches ? "default" : "outline"}
            onClick={() => toggleBranch("all")}
            className={cn(
              "h-10 rounded-xl font-medium gap-2 transition-all",
              isAllBranches
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span>{t("all") || "All"}</span>
          </Button>

          {branches.map((b) => {
            const isActive = !isAllBranches && selectedBranchIds.includes(b.id);
            return (
              <Button
                key={b.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => toggleBranch(b.id)}
                className={cn(
                  "h-10 rounded-xl font-medium gap-2 transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <Store className="h-4 w-4" />
                <span>{b.name}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* TABS (Modules Multi-select) + SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedModules.includes(tab.key);
            return (
              <Button
                key={tab.key}
                variant={isActive ? "default" : "outline"}
                onClick={() => toggleModule(tab.key)}
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
                              checked={getIsOutOfStock(item)}
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

      {/* PRICE & VARIANTS EDIT MODAL */}
      <Dialog open={!!priceModalItem} onOpenChange={(open) => !open && closePriceModal()}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editPriceAndVariants") || "تعديل السعر والمتغيرات"}</DialogTitle>
          </DialogHeader>

          {priceModalItem && (
            <div className="space-y-6 mt-2">
              {/* Main Product Edit */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  {priceModalItem.name || priceModalItem.nameAr}
                  <span className="text-xs font-normal text-slate-500 block">({t("mainProduct") || "المنتج الأساسي"})</span>
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">
                      {t("priceEgp") || "Price (EGP)"}
                    </label>
                    <Input
                      type="number"
                      value={mainItemEdit.price}
                      onChange={(e) => setMainItemEdit(prev => ({ ...prev, price: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col items-center pt-5">
                    <label className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      {t("available") || "متاح"}
                    </label>
                    <Switch
                      checked={mainItemEdit.status}
                      onCheckedChange={(checked) => setMainItemEdit(prev => ({ ...prev, status: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Variations Edit */}
              {priceModalItem.variations && priceModalItem.variations.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 border-b pb-2">
                    {t("variations") || "الإضافات / المتغيرات"}
                  </h4>

                  {priceModalItem.variations.map((variation) => (
                    <div key={variation.id} className="space-y-3">
                      <p className="text-sm font-medium text-primary">
                        {isRTL ? (variation.nameAr || variation.name) : (variation.name || variation.nameAr)}
                      </p>

                      <div className="space-y-2 pl-2 border-l-2 border-slate-100 dark:border-slate-800">
                        {variation.options?.map(opt => (
                          <div key={opt.id} className="flex items-center gap-3 bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                            <span className="flex-1 text-sm text-slate-600 dark:text-slate-300 truncate">
                              {isRTL ? (opt.nameAr || opt.name) : (opt.name || opt.nameAr)}
                            </span>

                            <Input
                              type="number"
                              value={variantsEdit[opt.id]?.price ?? ""}
                              onChange={(e) => handleVariantChange(opt.id, 'price', e.target.value)}
                              className="w-24 h-8 text-sm"
                              placeholder="Price"
                            />

                            <Switch
                              checked={variantsEdit[opt.id]?.status ?? true}
                              onCheckedChange={(checked) => handleVariantChange(opt.id, 'status', checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={closePriceModal} disabled={isSaving}>
              {t("cancel") || "Cancel"}
            </Button>
            <Button onClick={savePriceModal} disabled={isSaving}>
              {isSaving ? <LoadingSpinner className="h-4 w-4 mr-2" /> : null}
              {t("save") || "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}