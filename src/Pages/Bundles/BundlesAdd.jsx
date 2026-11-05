import { useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BundlesAdd = () => {
    const { t, isRTL } = useTranslation();
    const { id } = useParams();
    const { state } = useLocation();
    const [foodSelections, setFoodSelections] = useState({});

    const { data: foodsData, isLoading: isFoodsLoading } = useQuery({
        queryKey: ['bundle-foods-select'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/pos/bundles/foods');
            return res.data?.data?.data ?? res.data?.data ?? [];
        }
    });

    const { data: branchesData, isLoading: isBranchesLoading } = useQuery({
        queryKey: ['bundle-branches-select'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/pos/bundles/branches');
            return res.data?.data?.data ?? res.data?.data ?? [];
        }
    });

    const { data: addonsData, isLoading: isAddonsLoading } = useQuery({
        queryKey: ['bundle-addons-select'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/addons');
            return res.data?.data?.data ?? res.data?.data ?? [];
        }
    });

    const { data: BundleData, isLoading: isFetching } = useQuery({
        queryKey: ['Bundle', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/pos/bundles/${id}`);
            return data.data?.data ?? data.data;
        },
        enabled: !!id,
    });

    const initialFoodSelections = useMemo(() => {
        const currentBundle = BundleData || state?.BundleData;
        if (currentBundle?.foods && Array.isArray(currentBundle.foods)) {
            const selections = {};
            currentBundle.foods.forEach(f => {
                if (typeof f === 'object' && f !== null) {
                    const foodId = String(f.foodId?.id || f.foodId || f.id);
                    const variations = {};
                    (Array.isArray(f.variations) ? f.variations : []).forEach((variation) => {
                        const variationId = String(variation.variationId || variation.variation?.id || "");
                        const optionIds = [
                            variation.optionId || variation.option?.id,
                            ...(Array.isArray(variation.options) ? variation.options.map((option) => option.optionId || option.id) : []),
                        ].filter(Boolean);
                        if (variationId && optionIds.length) {
                            variations[variationId] = optionIds.map(String);
                        }
                    });
                    selections[foodId] = {
                        quantity: Number(f.quantity) || 1,
                        variations,
                    };
                }
            });
            return selections;
        }
        return {};
    }, [BundleData, state]);

    let initialData = BundleData || state?.BundleData;
    if (initialData) {
        let preparedFoods = [];
        if (initialData.foods && Array.isArray(initialData.foods)) {
            preparedFoods = initialData.foods.map(f => typeof f === 'object'
                ? String(f.foodId?.id || f.foodId || f.id)
                : String(f));
        }

        let preparedBranches = [];
        if (initialData.branchIds && Array.isArray(initialData.branchIds)) {
            preparedBranches = initialData.branchIds.map(b => String(b));
        } else if (initialData.branches && Array.isArray(initialData.branches)) {
            preparedBranches = initialData.branches.map(b => typeof b === 'object' ? String(b.id) : String(b));
        }

        let preparedAddons = [];
        if (initialData.addonIds && Array.isArray(initialData.addonIds)) {
            preparedAddons = initialData.addonIds.map(a => typeof a === 'object' ? String(a.id || a.addonsId) : String(a));
        } else if (initialData.addons && Array.isArray(initialData.addons)) {
            preparedAddons = initialData.addons.map(a => typeof a === 'object' ? String(a.id || a.addonsId) : String(a));
        } else if (initialData.foods && Array.isArray(initialData.foods) && initialData.foods[0]?.addonIds) {
            preparedAddons = initialData.foods[0].addonIds.map(a => typeof a === 'object' ? String(a.id || a.addonsId) : String(a));
        }

        initialData = {
            ...initialData,
            selectedFoods: preparedFoods,
            branchIds: preparedBranches,
            addonIds: preparedAddons
        };
    }

    const BundleFields = [
        { name: 'name', label: t('name') || 'Name', required: true },
        { name: 'nameAr', label: t('nameAr') || 'Name (Ar)', required: true },
        { name: 'nameFr', label: t('nameFr') || 'Name (Fr)', required: true },
        { name: 'image', label: t('image') || 'Image', type: 'file', required: false },
        { name: 'price', label: t('price') || 'Price', type: 'number', required: true },
        {
            name: 'module',
            label: t('module') || 'Modules',
            required: true,
            type: 'multi-select',
            options: [
                { value: 'pos', label: 'POS' },
                { value: 'web', label: 'Web' },
                { value: 'app', label: 'App' }
            ]
        },
        {
            name: 'selectedFoods',
            label: t('foods') || 'Foods',
            required: false,
            type: 'multi-select',
            hideSelectedValues: true,
            options: (foodsData || []).map(f => ({
                value: String(f.id),
                label: f.name || f.nameAr || f.title,
                food: f,
            }))
        },
        {
            name: 'branchIds',
            label: t('branches') || 'Branches',
            required: false,
            type: 'multi-select',
            options: (branchesData || []).map(b => ({
                value: String(b.id),
                label: b.name || b.nameAr || b.title
            }))
        },
        {
            name: 'addonIds',
            label: t('addons') || 'Addons',
            required: false,
            type: 'multi-select',
            options: (addonsData || []).map(a => ({
                value: String(a.id),
                label: a.name || a.nameAr || a.title
            }))
        },
        { name: 'startDate', label: t('startDate') || 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: t('endDate') || 'End Date', type: 'date', required: true },
    ];

    const getFoodSelection = (foodId) =>
        foodSelections[foodId] || initialFoodSelections[foodId] || { quantity: 1, variations: {} };

    const handleTransformPayload = (data) => {
        const payload = { ...data };
        
        const globalAddons = payload.addonIds ? payload.addonIds.map(String) : [];

        if (payload.selectedFoods && Array.isArray(payload.selectedFoods)) {
            payload.foods = payload.selectedFoods.map(foodId => ({
                foodId,
                quantity: getFoodSelection(foodId).quantity,
                addonIds: globalAddons,
                variations: Object.entries(getFoodSelection(foodId).variations)
                    .flatMap(([variationId, optionIds]) => optionIds.map(optionId => ({
                        variationId,
                        optionId,
                    }))),
            }));
            delete payload.selectedFoods;
            delete payload.selectedFoodsWithQuantities;
        }

        delete payload.addonIds;
        delete payload['addonIds[]'];

        return payload;
    };

    if ((id && isFetching) || isFoodsLoading || isBranchesLoading || isAddonsLoading) {
        return <LoadingSpinner />;
    }

    return (
        <AddPage
            title={id ? "Edit Bundle" : "Add Bundle"} 
            apiUrl="/api/restaurant/pos/bundles" 
            queryKey="bundles"
            fields={BundleFields}
            initialData={initialData} 
            transformPayload={handleTransformPayload}
            onSuccessAction={() => {
                window.history.back();
            }}
        >
            {({ watch, setValue }) => {
                const selectedFoods = watch('selectedFoods') || [];

                if (selectedFoods.length === 0) return null;

                const updateFoodSelection = (foodId, update) => {
                    setFoodSelections((current) => ({
                        ...current,
                        [foodId]: {
                            quantity: 1,
                            variations: {},
                            ...initialFoodSelections[foodId],
                            ...current[foodId],
                            ...update,
                        },
                    }));
                };

                const removeFood = (foodId) => {
                    const updated = selectedFoods.filter(id => id !== foodId);
                    setValue('selectedFoods', updated);
                    setFoodSelections((current) => {
                        const next = { ...current };
                        delete next[foodId];
                        return next;
                    });
                };

                return (
                    <div className="col-span-full space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                                    {t('selectedFoodsQuantities') || "Selected foods"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {selectedFoods.length} {t('foods') || "foods"} {t('selected') || "selected"}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {selectedFoods.map(foodId => {
                                const foodObj = foodsData?.find(f => String(f.id) === String(foodId));
                                const foodName = foodObj
                                    ? (isRTL
                                        ? foodObj.nameAr || foodObj.name || foodObj.title
                                        : foodObj.name || foodObj.nameAr || foodObj.title)
                                    : foodId;
                                const selection = getFoodSelection(foodId);
                                const variations = foodObj?.variations || [];

                                const toggleVariationOption = (variation, optionId) => {
                                    const variationId = String(variation.id);
                                    const currentIds = selection.variations[variationId] || [];
                                    const isMulti = ["multiple", "multi"].includes(
                                        String(variation.selectionType).toLowerCase(),
                                    );
                                    let nextIds;

                                    if (currentIds.includes(String(optionId))) {
                                        nextIds = currentIds.filter((currentId) => currentId !== String(optionId));
                                    } else if (isMulti) {
                                        const max = Number(variation.max) || Infinity;
                                        nextIds = currentIds.length < max
                                            ? [...currentIds, String(optionId)]
                                            : currentIds;
                                    } else {
                                        nextIds = [String(optionId)];
                                    }

                                    updateFoodSelection(foodId, {
                                        variations: { ...selection.variations, [variationId]: nextIds },
                                    });
                                };

                                return (
                                    <section
                                        key={foodId}
                                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
                                    >
                                        <div className="flex items-center gap-3 border-b bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                                            {foodObj?.image ? (
                                                <img src={foodObj.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                                                    {foodName?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-slate-900 dark:text-slate-100" title={foodName}>
                                                    {foodName}
                                                </p>
                                                {foodObj?.price != null && (
                                                    <p className="text-xs text-muted-foreground">{foodObj.price}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 rounded-lg border bg-white p-1 dark:border-slate-700 dark:bg-slate-950">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    disabled={selection.quantity <= 1}
                                                    onClick={() => updateFoodSelection(foodId, { quantity: Math.max(1, selection.quantity - 1) })}
                                                    aria-label={t("decreaseQuantity") || "Decrease quantity"}
                                                >
                                                    <Minus className="h-3.5 w-3.5" />
                                                </Button>
                                                <span className="min-w-7 text-center text-sm font-semibold">{selection.quantity}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => updateFoodSelection(foodId, { quantity: selection.quantity + 1 })}
                                                    aria-label={t("increaseQuantity") || "Increase quantity"}
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => removeFood(foodId)}
                                                aria-label={t("remove") || "Remove food"}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-3 p-3">
                                            {variations.length > 0 ? variations.map((variation) => {
                                                const variationId = String(variation.id);
                                                const selectedOptionIds = selection.variations[variationId] || [];
                                                const isMulti = ["multiple", "multi"].includes(
                                                    String(variation.selectionType).toLowerCase(),
                                                );
                                                const options = variation.options || [];

                                                return (
                                                    <div key={variationId} className="space-y-2">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                                {isRTL
                                                                    ? variation.nameAr || variation.name || variation.nameFr
                                                                    : variation.name || variation.nameAr || variation.nameFr}
                                                            </p>
                                                            <span className={cn(
                                                                "rounded-full px-2 py-0.5 text-[11px]",
                                                                variation.isRequired
                                                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                            )}>
                                                                {variation.isRequired ? t("required") : t("optional")}
                                                                {isMulti && ` · ${t("max")}: ${variation.max || options.length}`}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {options.map((option) => {
                                                                const optionId = String(option.id);
                                                                const isSelected = selectedOptionIds.includes(optionId);
                                                                const optionName = isRTL
                                                                    ? option.optionNameAr || option.optionName || option.nameAr || option.name
                                                                    : option.optionName || option.name || option.optionNameAr || option.nameAr;
                                                                const additionalPrice = Number(option.additionalPrice) || 0;
                                                                return (
                                                                    <button
                                                                        key={optionId}
                                                                        type="button"
                                                                        aria-pressed={isSelected}
                                                                        onClick={() => toggleVariationOption(variation, optionId)}
                                                                        className={cn(
                                                                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-start text-sm transition-colors",
                                                                            isSelected
                                                                                ? "border-primary bg-primary/5 text-primary"
                                                                                : "border-slate-200 hover:border-primary/50 dark:border-slate-700"
                                                                        )}
                                                                    >
                                                                        {isMulti && (
                                                                            <span className={cn(
                                                                                "flex h-4 w-4 items-center justify-center rounded border text-[10px]",
                                                                                isSelected ? "border-primary bg-primary text-white" : "border-slate-400"
                                                                            )}>
                                                                                {isSelected ? "✓" : ""}
                                                                            </span>
                                                                        )}
                                                                        <span>{optionName}</span>
                                                                        {additionalPrice > 0 && (
                                                                            <span className="text-xs text-muted-foreground">+{additionalPrice}</span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <p className="text-xs text-muted-foreground">
                                                    {t("noVariationsFound") || "No variations for this food"}
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                );
            }}
        </AddPage>
    );
};

export default BundlesAdd;