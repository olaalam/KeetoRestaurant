import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GenericDataTable from '@/components/GenericDataTable';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ListTree, PlusCircle, CheckCircle2, Pencil } from "lucide-react"; // 💡 أضفنا أيقونة القلم
import { usePost } from '@/hooks/usePost';
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // 💡 أضفنا الـ Input لتعديل السعر
import { useTranslation } from "@/hooks/useTranslation";

const Foods = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [selectedVariations, setSelectedVariations] = useState(null);
    const location = useLocation();

    // حالات إدارة المكونات
    const [ingredientsDialogOpen, setIngredientsDialogOpen] = useState(false);
    const [currentFoodId, setCurrentFoodId] = useState(null);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [highlightedId, setHighlightedId] = useState(null);

    // 💡 حالات إدارة تعديل السعر السريع
    const [priceDialogOpen, setPriceDialogOpen] = useState(false);
    const [foodToUpdatePrice, setFoodToUpdatePrice] = useState(null); // هنيشيل فيه الـ id والـ name
    const [newPrice, setNewPrice] = useState('');
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 15,
    });

    // جلب بيانات الأطعمة للجدول
    const { data: foods = [], isLoading, refetch } = useQuery({ // 💡 أضفنا refetch لتحديث الجدول بعد تعديل السعر
        queryKey: ['foods'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/food');
            return res.data.data.data;
        }
    });

    // جلب قائمة المكونات المتاحة
    const { data: ingredientsOptions = [] } = useQuery({
        queryKey: ['ingredients-select'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/food/select');
            return res.data.data.data.ingredients || [];
        }
    });

    // هوك الإرسال للمكونات
    const assignMutation = usePost(
        `/api/restaurant/food/assign-ingredients/${currentFoodId}`,
        'post',
        'foods'
    );

    // 💡 هوك إرسال السعر الجديد للباك إند
    // ملحوظة: لو الباك إند بيحتاج مسار ديناميكي زي /update-price/${id}، تقدري تستخدمي api.patch مباشرة جوا دالة الحفظ
    const updatePriceMutation = usePost(
        `/api/restaurant/food/update-price/${foodToUpdatePrice?.id}`, // تأكدي من المسار الصحيح من الباك إند عندك
        'post', // أو 'patch' / 'put' حسب الـ API
        'foods'
    );
// 1. دالة لقراءة اللغة الحالية بشكل صحيح من LocalStorage أو i18n
const getActualLanguage = (i18n) => {
    // محاولة قراءة اللغة من الـ localStorage الخاصة بـ keeto
    try {
        const storedLangData = localStorage.getItem('keeto-language');
        if (storedLangData) {
            const parsedData = JSON.parse(storedLangData);
            if (parsedData?.state?.language) {
                return parsedData.state.language; // هترجع "en" أو "ar"
            }
        }
    } catch (error) {
        console.error("Error reading language from local storage", error);
    }
    
    // لو فشلت المحاولة، نعتمد على i18n أو الافتراضي "ar"
    return i18n?.language || "ar";
};

// 2. دالة جلب الاسم حسب اللغة 
const getLocalizedName = (item, currentLang) => {
    if (!item) return '-';
    
    const isArabic = currentLang?.startsWith('ar');

    if (isArabic) {
        return item.nameAr || item.name || '-';
    } else {
        return item.name || item.nameAr || '-';
    }
};

    useEffect(() => {
        if (location.state?.highlightedId && foods) {
            const index = foods.findIndex(item => String(item.id) === String(location.state.highlightedId));

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

    const handleRemovableToggle = (ingredientId) => {
        setSelectedIngredients(prev =>
            prev.map(i => i.ingredientId === ingredientId ? { ...i, isRemovable: !i.isRemovable } : i)
        );
    };

    const handleSaveIngredients = () => {
        assignMutation.mutate({
            ingredientsList: selectedIngredients
        }, {
            onSuccess: () => setIngredientsDialogOpen(false)
        });
    };

    // 💡 دالة حفظ السعر الجديد
    const handleSavePrice = async () => {
        if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) return;

        // لو الـ usePost عندك مش بتدعم تغيير الـ URL ديناميكياً بسهولة لكل طلب، يفضل نعملها بـ api.put/post مباشرة هنا:
        try {
            // هنبعت الطلب للباك إند (عدلي المسار والـ Method بناءً على الـ API Documentation عندك)
            await api.put(`/api/restaurant/food/${foodToUpdatePrice.id}`, {
                price: Number(newPrice)
                // لو الباك بيطلب بقية الداتا، يفضل تبعتي السعر بس لو المسار مخصص لتحديث السعر السريع
            });

            // عمل تحديث للبيانات في الجدول بعد النجاح
            refetch();
            setPriceDialogOpen(false);
        } catch (error) {
            console.error("Error updating price:", error);
        }
    };

    const columns = [
        {
            accessorKey: 'image',
            header: t('image'),
            cell: ({ row }) => {
                const imageUrl = row.original.image;
                return (
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                        {imageUrl ? (
                            <img src={imageUrl} alt={row.original.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-xs text-gray-400">{t('noImg')}</div>
                        )}
                    </div>
                );
            }
        },
{
    id: 'foodName',
    header: t('foodName'),
    cell: ({ row }) => {
        const food = row.original;
        const currentLang = getActualLanguage(i18n); // 💡 هنا استخدام الدالة الجديدة
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
            cell: ({ row }) => (
                // 💡 جعلنا منطقة السعر قابلة للضغط ويوضح للمستخدم إنها تفاعلية عن طريق الـ hover وايقونة القلم الصغيرة
                <div
                    className="flex items-center gap-2 font-medium text-green-600 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors w-fit"
                    onClick={() => {
                        setFoodToUpdatePrice(row.original); // تمرير عنصر الطعام كاملاً
                        setNewPrice(row.original.price);
                        setPriceDialogOpen(true);
                    }}
                    title={t('editPrice') || 'تعديل السعر'}
                >
                    <span>{row.original.price} EGP</span>
                    <Pencil className="h-3 w-3 text-gray-400 hover:text-green-600" />
                </div>
            )
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
    cell: ({ row }) => {
        const category = row.original.category;
        const currentLang = getActualLanguage(i18n); // 💡
        const catName = getLocalizedName(category, currentLang);

        return (
            <Badge variant="secondary" className="capitalize">
                {catName}
            </Badge>
        );
    }
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
                            isRemovable: ing.pivot?.isRemovable ?? true
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
        {
            accessorKey: 'status',
            header: t('status'),
        },
    ];

    return (
        <div className="p-6">
            <GenericDataTable
                title={t('foodsMenu')}
                columns={columns}
                data={foods || []}
                isLoading={isLoading}
                queryKey={['foods']}
                editApiUrl="/api/restaurant/food"
                deleteApiUrl="/api/restaurant/food"
                onAdd={() => navigate('/foods/add')}
                highlightedId={highlightedId}
                onEdit={(row) => navigate(`/foods/edit/${row.id}`)}
                pagination={pagination}
                setPagination={setPagination}
            />

            {/* 💡 Quick Edit Price Dialog */}
            <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-primary" />
                            {t('editPrice') || 'تعديل السعر'}
                        </DialogTitle>
                        <DialogDescription>
                            {t('updatePriceFor') || 'تعديل سعر المنتج:'} {' '}
                            <span className="font-bold text-slate-900">
                                {(i18n?.language === 'ar' ? foodToUpdatePrice?.nameAr : foodToUpdatePrice?.name) || foodToUpdatePrice?.name}
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 my-4">
                        <Label htmlFor="quick-price">{t('price') || 'السعر'} (EGP)</Label>
                        <Input
                            id="quick-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            placeholder="0.00"
                            className="text-left font-medium"
                        />
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-4">
                        <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={handleSavePrice}
                            disabled={!newPrice}
                        >
                            {t('save') || 'حفظ'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Variations Dialog */}
            <Dialog open={!!selectedVariations} onOpenChange={() => setSelectedVariations(null)}>
                {/* ... كود الـ Variations Dialog الحالي بدون تغيير ... */}
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

                                // 💡 تحديد اسم المكون بناءً على اللغة الحالية
                                const currentLang = i18n?.language || "ar";
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
                                                {/* 💡 هنا بيتم عرض الاسم بحسب اللغة */}
                                                {ingName}
                                            </Label>
                                        </div>

                                        {isSelected && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground font-bold">{t('removable')}</span>
                                                <Switch
                                                    checked={isSelected.isRemovable}
                                                    onCheckedChange={() => handleRemovableToggle(ing.id)}
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
        </div>
    );
};

export default Foods;