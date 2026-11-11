import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GenericDataTable from '@/components/GenericDataTable';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ListTree, PlusCircle, CheckCircle2, Pencil, Store, Filter, X, Plus, Download, Upload, Loader2 } from "lucide-react";
import { usePost } from '@/hooks/usePost';
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from 'sonner';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const Foods = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [selectedVariations, setSelectedVariations] = useState(null);
    const location = useLocation();

    // 💡 حالات الفلترة (Server-Side Filter) - قراءة القيم السابقة لو متوفرة
    const [selectedCategory, setSelectedCategory] = useState(location.state?.category || 'all');
    const [selectedSubCategory, setSelectedSubCategory] = useState(location.state?.subCategory || 'all');

    // 💡 حالات البحث داخل الـ Select
    const [categorySearch, setCategorySearch] = useState('');
    const [subCategorySearch, setSubCategorySearch] = useState('');

    // حالات إدارة المكونات
    const [ingredientsDialogOpen, setIngredientsDialogOpen] = useState(false);
    const [currentFoodId, setCurrentFoodId] = useState(null);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [highlightedId, setHighlightedId] = useState(null);

    // حالات إدارة تعديل السعر السريع
    const [priceDialogOpen, setPriceDialogOpen] = useState(false);
    const [foodToUpdatePrice, setFoodToUpdatePrice] = useState(null);
    const [newPrice, setNewPrice] = useState('');

    // حالات إدارة تحكم الفروع
    const [branchControlOpen, setBranchControlOpen] = useState(false);
    const [selectedFoodForBranch, setSelectedFoodForBranch] = useState(null);

    // حالات الاستيراد / القالب
    const importInputRef = useRef(null);
    const [importFile, setImportFile] = useState(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);

    const savedSize = localStorage.getItem("tablePageSize");
    const initialPageSize = savedSize ? Number(savedSize) : 15;

    const [pagination, setPagination] = useState({
        pageIndex: location.state?.pageIndex ?? location.state?.fromPage ?? 0,
        pageSize: initialPageSize
    });

    const getActualLanguage = (i18n) => {
        try {
            const storedLangData = localStorage.getItem('keeto-language');
            if (storedLangData) {
                const parsedData = JSON.parse(storedLangData);
                if (parsedData?.state?.language) {
                    return parsedData.state.language;
                }
            }
        } catch (error) {
            console.error("Error reading language from local storage", error);
        }
        return i18n?.language || "ar";
    };

    const getLocalizedName = (item, currentLang) => {
        if (!item) return '-';
        const isArabic = currentLang?.startsWith('ar');
        if (isArabic) {
            return item.nameAr || item.name || '-';
        } else {
            return item.name || item.nameAr || '-';
        }
    };

    const currentLang = getActualLanguage(i18n);

    // 💡 جلب بيانات الأطعمة مع تمرير الـ queryParams للباك إند
    const { data: foods = [], isLoading, refetch } = useQuery({
        queryKey: ['foods', selectedCategory, selectedSubCategory],
        queryFn: async () => {
            const params = {};
            if (selectedCategory !== 'all') params.categoryId = selectedCategory;
            if (selectedSubCategory !== 'all') params.subCategoryId = selectedSubCategory;

            const res = await api.get('/api/restaurant/food', { params });
            return res.data.data.data;
        }
    });

    // جلب بيانات الـ Select
    const { data: selectData = {} } = useQuery({
        queryKey: ['food-select-data'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/food/select');
            return res.data.data.data || {};
        }
    });

    const subcategoriesList = selectData.subcategories || [];
    const ingredientsOptions = selectData.ingredients || [];

    // 💡 تصفية الأقسام الفرعية بناءً على القسم الرئيسي المحدد
    const availableSubCategories = useMemo(() => {
        if (selectedCategory === 'all') return subcategoriesList;
        return subcategoriesList.filter(sub => String(sub.categoryId) === String(selectedCategory));
    }, [subcategoriesList, selectedCategory]);

    // 💡 الأقسام الفرعية المفلترة حسب نص البحث
    const filteredSubCategories = useMemo(() => {
        if (!subCategorySearch.trim()) return availableSubCategories;
        return availableSubCategories.filter(sub => {
            const name = getLocalizedName(sub, currentLang).toLowerCase();
            return name.includes(subCategorySearch.toLowerCase());
        });
    }, [availableSubCategories, subCategorySearch, currentLang]);

    const handleClearFilter = () => {
        setSelectedCategory('all');
        setSelectedSubCategory('all');
        setCategorySearch('');
        setSubCategorySearch('');
    };

    // جلب حالة توفر المنتج في الفروع
    const { data: branchAvailability = [], isLoading: isLoadingBranches, refetch: refetchBranches } = useQuery({
        queryKey: ['branch-availability', selectedFoodForBranch?.id],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/food-locks/availability', {
                params: { foodId: selectedFoodForBranch.id }
            });
            return res.data.data?.data || [];
        },
        enabled: branchControlOpen && !!selectedFoodForBranch?.id,
    });

    // هوك الإرسال للمكونات
    const assignMutation = usePost(
        `/api/restaurant/food/assign-ingredients/${currentFoodId}`,
        'post',
        'foods'
    );

    const handleBranchLockToggle = async (branchId, currentIsAvailable) => {
        try {
            await api.put(`/api/restaurant/food-locks/${branchId}/food/${selectedFoodForBranch.id}/lock`, {
                isLocked: currentIsAvailable
            });
            toast.success(t('statusUpdatedSuccessfully') || 'تم تحديث حالة الفروع بنجاح');
            refetchBranches();
        } catch (error) {
            console.error("Error updating branch lock status:", error);
            toast.error(t('failedToUpdateStatus') || 'فشل تحديث حالة الفرع');
        }
    };

    const handleStockToggle = async (foodId, currentStockStatus) => {
        try {
            await api.put(`/api/restaurant/food/${foodId}`, {
                isOutOfStock: !currentStockStatus
            });
            toast.success(t('statusUpdatedSuccessfully') || 'تم تحديث الحالة بنجاح');
            refetch();
        } catch (error) {
            console.error("Error updating stock status:", error);
            toast.error(t('failedToUpdateStatus') || 'فشل تحديث الحالة');
        }
    };

    // ===== تحميل القالب =====
    const handleDownloadTemplate = async () => {
        try {
            setIsDownloadingTemplate(true);
            const res = await api.get('/api/restaurant/import/template', {
                responseType: 'blob',
            });

            // محاولة قراءة اسم الملف من الـ header
            const disposition = res.headers?.['content-disposition'] || '';
            const match = disposition.match(/filename="?([^"]+)"?/);
            const fileName = match?.[1] || 'import-template.xlsx';

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading template:', error);
            toast.error(t('failedToDownloadTemplate') || 'فشل تحميل القالب');
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    // ===== اختيار الملف + فحصه (validate) =====
    const handleImportFileSelected = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // عشان نقدر نختار نفس الملف تاني
        if (!file) return;

        try {
            setIsValidating(true);
            setImportFile(file);
            setValidationResult(null);

            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/api/restaurant/import/validate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setValidationResult(res.data?.data ?? res.data);
            setImportDialogOpen(true);
        } catch (error) {
            console.error('Error validating import file:', error);
            toast.error(
                error?.response?.data?.message || t('failedToValidateFile') || 'فشل فحص الملف'
            );
            setImportFile(null);
        } finally {
            setIsValidating(false);
        }
    };

    // ===== تأكيد الاستيراد (commit) =====
    const handleCommitImport = async () => {
        if (!importFile) return;
        try {
            setIsCommitting(true);
            const formData = new FormData();
            formData.append('file', importFile);

            await api.post('/api/restaurant/import/commit', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success(t('importSuccess') || 'تم استيراد البيانات بنجاح');
            setImportDialogOpen(false);
            setImportFile(null);
            setValidationResult(null);
            refetch();
        } catch (error) {
            console.error('Error committing import:', error);
            toast.error(
                error?.response?.data?.message || t('importFailed') || 'فشل استيراد البيانات'
            );
        } finally {
            setIsCommitting(false);
        }
    };

    const closeImportDialog = () => {
        setImportDialogOpen(false);
        setImportFile(null);
        setValidationResult(null);
    };

    // أخطاء الفحص (عدّل الأسماء حسب رد الـ API الفعلي)
    const importErrors = validationResult?.errors || [];
    const canCommit = !!validationResult && importErrors.length === 0;

    useEffect(() => {
        if (location.state?.highlightedId && foods.length) {
            const sortedFoods = [...foods].sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bTime - aTime;
            });

            const index = sortedFoods.findIndex(item => String(item.id) === String(location.state.highlightedId));

            if (index !== -1) {
                const pageIndex = Math.floor(index / pagination.pageSize);
                setPagination(prev => ({ ...prev, pageIndex }));
                setHighlightedId(location.state.highlightedId);

                const timer = setTimeout(() => {
                    setHighlightedId(null);
                    window.history.replaceState({}, document.title);
                }, 3000);

                return () => clearTimeout(timer);
            }
        } else if (location.state?.pageIndex !== undefined && foods.length) {
            setPagination(prev => ({ ...prev, pageIndex: location.state.pageIndex }));
        }
    }, [location.state, foods, pagination.pageSize]);

    const handleIngredientToggle = (ingredientId) => {
        setSelectedIngredients(prev => {
            const exists = prev.find(i => i.ingredientId === ingredientId);
            if (exists) {
                return prev.filter(i => i.ingredientId !== ingredientId);
            } else {
                return [...prev, { ingredientId, isRemovable: true }];
            }
        });
    };

    const handleRemovableToggle = (ingredientId, checked) => {
        setSelectedIngredients(prev =>
            prev.map(i => i.ingredientId === ingredientId ? { ...i, isRemovable: checked } : i)
        );
    };

    const handleSaveIngredients = () => {
        assignMutation.mutate({
            ingredientsList: selectedIngredients
        }, {
            onSuccess: () => setIngredientsDialogOpen(false)
        });
    };

    const handleSavePrice = async () => {
        if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) return;

        try {
            await api.put(`/api/restaurant/food/${foodToUpdatePrice.id}`, {
                price: Number(newPrice)
            });

            refetch();
            setPriceDialogOpen(false);
            toast.success(t('statusUpdatedSuccessfully') || 'تم تحديث السعر بنجاح');
        } catch (error) {
            console.error("Error updating price:", error);
            toast.error(t('failedToUpdateStatus') || 'فشل تحديث السعر');
        }
    };

    const columns = [
        {
            accessorKey: 'image',
            header: t('image'),
            cell: ({ row }) => {
                const item = row.original;
                const imageUrl = item.image;
                const fileInputRef = React.useRef(null);
                const [uploading, setUploading] = useState(false);

                const handleImageChange = (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // تحويل الصورة إلى Base64
                    const reader = new FileReader();
                    reader.readAsDataURL(file);

                    reader.onload = async () => {
                        const base64String = reader.result;

                        try {
                            setUploading(true);

                            // إرسال الـ Base64 كـ JSON باستخدام api.put المباشر
                            // (تأكد من تعديل الـ URL حسب الصفحة سواء Subcategories أو Foods)
                            const endpoint = window.location.pathname.includes('sub-categories')
                                ? `/api/restaurant/subcategories/${item.id}`
                                : `/api/restaurant/food/${item.id}`;

                            await api.put(endpoint, {
                                image: base64String
                            });

                            toast.success(t('statusUpdatedSuccessfully') || 'تم تحديث الصورة بنجاح');
                            refetch();
                        } catch (error) {
                            console.error("Error updating image:", error);
                            toast.error(t('failedToUpdateStatus') || 'فشل تحديث الصورة');
                        } finally {
                            setUploading(false);
                        }
                    };

                    reader.onerror = (error) => {
                        console.error("Error reading file:", error);
                        toast.error('فشل قراءة الملف');
                    };
                };

                return (
                    <div className="relative group w-12 h-12 rounded-md overflow-hidden bg-gray-100 border shrink-0">
                        {imageUrl ? (
                            <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-xs text-gray-400">
                                {t('noImg')}
                            </div>
                        )}

                        {/* زر الـ (+) يظهر عند المرور بالماوس */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                            title={t('updateImage') || 'تعديل الصورة'}
                        >
                            {uploading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Plus className="w-5 h-5 font-bold" />
                            )}
                        </div>

                        {/* إدخال ملف مخفي */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                );
            }
        },
        {
            id: 'foodName',
            header: t('foodName'),
            accessorFn: (row) => `${row.name || ''} ${row.nameAr || ''}`,
            cell: ({ row }) => {
                const food = row.original;
                const displayName = getLocalizedName(food, currentLang);

                return (
                    <span className="capitalize font-medium">
                        {displayName}
                    </span>
                );
            }
        },
        {
            accessorKey: 'price',
            header: t('price'),
        },
        {
            accessorKey: 'points',
            header: t('points'),
            cell: ({ row }) => (
                <span className="font-medium text-slate-700">
                    {row.original.points ?? '-'}
                </span>
            )
        },
        {
            accessorKey: 'category',
            header: t('category'),
            accessorFn: (row) => `${row.category?.name || ''} ${row.category?.nameAr || ''}`,
            cell: ({ row }) => {
                const category = row.original.category;
                const catName = getLocalizedName(category, currentLang);

                return (
                    <Badge variant="secondary" className="capitalize">
                        {catName}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'isOutOfStock',
            header: t('isOutOfStock') || 'غير متوفر',
            cell: ({ row }) => {
                const food = row.original;
                const isOutOfStock = Boolean(food.isOutOfStock);

                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={isOutOfStock}
                            onCheckedChange={() => handleStockToggle(food.id, isOutOfStock)}
                        />
                        <span className={`text-xs font-medium ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                            {isOutOfStock ? (t('outOfStock') || 'غير متاح') : (t('available') || 'متاح')}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'branchControl',
            header: t('branchControl') || 'فروع المنتج',
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setSelectedFoodForBranch(row.original);
                        setBranchControlOpen(true);
                    }}
                    className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
                >
                    <Store className="h-4 w-4" />
                    {t('branches') || 'الفروع'}
                </Button>
            )
        },
        {
            accessorKey: 'assign_ingredients',
            header: t('ingredients'),
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setCurrentFoodId(row.original.id);
                        const existing = row.original.ingredients?.map(ing => ({
                            ingredientId: ing.id,
                            isRemovable: ing.pivot?.isRemovable !== undefined && ing.pivot?.isRemovable !== null
                                ? Boolean(Number(ing.pivot.isRemovable))
                                : true
                        })) || [];
                        setSelectedIngredients(existing);
                        setIngredientsDialogOpen(true);
                    }}
                    className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
                >
                    <PlusCircle className="h-4 w-4" />
                    {t('assign')}
                </Button>
            )
        },
        {
            accessorKey: 'variations',
            header: t('variations'),
            cell: ({ row }) => {
                const variations = row.original.variations || [];
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVariations(variations)}
                        className="flex items-center gap-2"
                    >
                        <ListTree className="h-4 w-4" />
                        {t('viewVariations')} ({variations.length})
                    </Button>
                );
            }
        },
    ];

    return (
        <div className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 shrink-0">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <span className="font-bold text-slate-700 text-sm">
                            {t('filters') || 'الفلاتر'}:
                        </span>
                    </div>

                    <div className="w-full sm:w-56">
                        <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('subcategory') || 'القسم الفرعي'} />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                    <Input
                                        placeholder={t('search') || 'بحث...'}
                                        value={subCategorySearch}
                                        onChange={(e) => setSubCategorySearch(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <SelectItem value="all">
                                    {t('allSubcategories') || 'كل الأقسام الفرعية'}
                                </SelectItem>
                                {filteredSubCategories.map((sub) => (
                                    <SelectItem key={sub.id} value={String(sub.id)}>
                                        {getLocalizedName(sub, currentLang)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {(selectedSubCategory !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilter}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
                        >
                            <X className="h-3.5 w-3.5" />
                            {t('clearFilter') || 'إلغاء الفلاتر'}
                        </Button>
                    )}

                    {/* أزرار القالب والاستيراد */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        disabled={isDownloadingTemplate}
                        className="flex items-center gap-2"
                    >
                        {isDownloadingTemplate ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        {t('downloadTemplate') || 'تحميل القالب'}
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => importInputRef.current?.click()}
                        disabled={isValidating}
                        className="flex items-center gap-2"
                    >
                        {isValidating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        {t('importFile') || 'استيراد ملف'}
                    </Button>

                    <input
                        ref={importInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={handleImportFileSelected}
                    />
                </div>
            </div>

            <GenericDataTable
                title={t('foodsMenu')}
                columns={columns}
                data={foods || []}
                isLoading={isLoading}
                queryKey={['foods']}
                editApiUrl="/api/restaurant/food"
                deleteApiUrl="/api/restaurant/food"
                onAdd={() => navigate('/foods/add', {
                    state: {
                        fromPage: pagination.pageIndex,
                        category: selectedCategory,
                        subCategory: selectedSubCategory
                    }
                })}
                highlightedId={highlightedId}
                onEdit={(row) => {
                    navigate(location.pathname + location.search, {
                        replace: true,
                        state: {
                            highlightedId: row.id,
                            pageIndex: pagination.pageIndex,
                            category: selectedCategory,
                            subCategory: selectedSubCategory
                        }
                    });
                    navigate(`/foods/edit/${row.id}`, {
                        state: {
                            fromPage: pagination.pageIndex,
                            returnId: row.id,
                            category: selectedCategory,
                            subCategory: selectedSubCategory
                        }
                    });
                }}
                pagination={pagination}
                setPagination={setPagination}
            />

            {/* Branch Product Control Dialog */}
            <Dialog open={branchControlOpen} onOpenChange={setBranchControlOpen}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {t('branchProductControl') || 'Branch Product Control'}
                        </DialogTitle>
                        <DialogDescription>
                            {t('totalBranches') || 'Total branches'}: {branchAvailability.length}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 mt-4">
                        {isLoadingBranches ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('loading') || 'جار تحميل الفروع...'}
                            </div>
                        ) : branchAvailability.length > 0 ? (
                            branchAvailability.map((branch) => {
                                const isAvailable = Boolean(branch.isAvailable);
                                const branchName = currentLang === 'ar'
                                    ? (branch.branchNameAr || branch.branchName)
                                    : (branch.branchName || branch.branchNameAr);

                                return (
                                    <div key={branch.branchId} className="flex items-center justify-between p-3.5 border rounded-xl bg-slate-50 shadow-sm">
                                        <span className="font-semibold text-slate-800">
                                            {branchName || 'فرع بدون اسم'}
                                        </span>
                                        <Switch
                                            checked={isAvailable}
                                            onCheckedChange={() => handleBranchLockToggle(branch.branchId, isAvailable)}
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-muted-foreground py-8">
                                {t('noBranchesFound') || 'لا توجد فروع متاحة'}
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Variations Dialog */}
            <Dialog open={!!selectedVariations} onOpenChange={() => setSelectedVariations(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('productVariationsTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('variationsDescription')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        {selectedVariations?.map((v, idx) => (
                            <div key={idx} className="border p-4 rounded-lg bg-slate-50">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-bold text-lg">{v.name}</h4>
                                    <div className="flex gap-2">
                                        <Badge>{v.selectionType}</Badge>
                                        {v.isRequired && <Badge variant="destructive">{t('required')}</Badge>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {v.options?.map((opt, i) => (
                                        <div key={i} className="flex justify-between bg-white p-2 rounded border text-sm">
                                            <span>{opt.optionName}</span>
                                            <span className="text-green-600">+{opt.additionalPrice} EGP</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {(!selectedVariations || selectedVariations.length === 0) && (
                            <p className="text-center text-muted-foreground py-8">
                                {t('noVariationsFound')}
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Assign Ingredients Dialog */}
            <Dialog open={ingredientsDialogOpen} onOpenChange={setIngredientsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            {t('assignIngredients')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('assignIngredientsDesc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 my-4 max-h-[50vh] overflow-y-auto pr-2">
                        {ingredientsOptions.length > 0 ? (
                            ingredientsOptions.map((ing) => {
                                const isSelected = selectedIngredients.find(i => i.ingredientId === ing.id);
                                const ingName = currentLang === 'ar'
                                    ? (ing.nameAr || ing.name)
                                    : (ing.name || ing.nameAr);

                                return (
                                    <div
                                        key={ing.id}
                                        className={`flex items-center justify-between p-3 border rounded-xl ${isSelected ? 'border-primary bg-primary/5' : 'bg-card'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={`ing-${ing.id}`}
                                                checked={!!isSelected}
                                                onCheckedChange={() => handleIngredientToggle(ing.id)}
                                            />
                                            <Label htmlFor={`ing-${ing.id}`} className="font-semibold cursor-pointer">
                                                {ingName}
                                            </Label>
                                        </div>
                                        {isSelected && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground font-bold">{t('removable')}</span>
                                                <Switch
                                                    checked={Boolean(isSelected.isRemovable)}
                                                    onCheckedChange={(checked) => handleRemovableToggle(ing.id, checked)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-muted-foreground py-4">{t('noIngredientsAvailable')}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-4">
                        <Button variant="outline" onClick={() => setIngredientsDialogOpen(false)}>
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={handleSaveIngredients}
                            disabled={assignMutation.isPending}
                        >
                            {assignMutation.isPending ? t('savingSelection') : t('saveSelection')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Import Validation Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={(open) => !open && closeImportDialog()}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {t('importPreview') || 'نتيجة فحص الملف'}
                        </DialogTitle>
                        <DialogDescription>{importFile?.name}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 mt-2">
                        {importErrors.length > 0 ? (
                            <>
                                <p className="text-sm font-semibold text-red-600">
                                    {t('importErrorsFound') || 'يوجد أخطاء لازم تتصلح قبل الاستيراد:'}
                                </p>
                                <ul className="space-y-2">
                                    {importErrors.map((err, i) => (
                                        <li key={i} className="text-sm p-2 rounded-md border border-red-200 bg-red-50 text-red-700">
                                            {typeof err === 'string' ? err : JSON.stringify(err)}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                                {t('importValid') || 'الملف سليم وجاهز للاستيراد'}
                            </p>
                        )}

                        {/* ملخص الفحص لو الـ API بيرجعه */}
                        {validationResult?.summary && (
                            <pre className="text-xs bg-slate-50 border rounded-md p-3 overflow-x-auto">
                                {JSON.stringify(validationResult.summary, null, 2)}
                            </pre>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={closeImportDialog} disabled={isCommitting}>
                            {t('cancel') || 'إلغاء'}
                        </Button>
                        <Button onClick={handleCommitImport} disabled={!canCommit || isCommitting}>
                            {isCommitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {t('confirmImport') || 'تأكيد الاستيراد'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Foods;