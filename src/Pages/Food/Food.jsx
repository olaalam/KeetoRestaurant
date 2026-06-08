import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GenericDataTable from '@/components/GenericDataTable';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ListTree, PlusCircle, CheckCircle2 } from "lucide-react";
import { usePost } from '@/hooks/usePost';
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/useTranslation";

const Foods = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [selectedVariations, setSelectedVariations] = useState(null);
    const location = useLocation();
    // حالات إدارة المكونات
    const [ingredientsDialogOpen, setIngredientsDialogOpen] = useState(false);
    const [currentFoodId, setCurrentFoodId] = useState(null);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [highlightedId, setHighlightedId] = useState(null);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 15,
    });
    // 💡 مراقبة ما إذا كنا راجعين من صفحة الحفظ ومعنا المعرف الخاص بالعنصر


    // جلب بيانات الأطعمة للجدول[cite: 1]
    const { data: foods = [], isLoading } = useQuery({
        queryKey: ['foods'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/food');
            return res.data.data.data;
        }
    });

    // 1. جلب قائمة المكونات المتاحة - المسار الصحيح بناءً على الـ JSON[cite: 1]
    const { data: ingredientsOptions = [] } = useQuery({
        queryKey: ['ingredients-select'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/food/select');


            return res.data.data.data.ingredients || [];
        }
    });

    // 2. هوك الإرسال للبيانات[cite: 2]
    const assignMutation = usePost(
        `/api/restaurant/food/assign-ingredients/${currentFoodId}`,
        'post',
        'foods'
    );
    // في Food.jsx
    useEffect(() => {
        if (location.state?.highlightedId && foods) {
            const index = foods.findIndex(item => item.id === location.state.highlightedId);

            if (index !== -1) {
                // 1. الانتقال للصفحة الصحيحة
                const pageIndex = Math.floor(index / pagination.pageSize);
                setPagination(prev => ({ ...prev, pageIndex }));

                // 2. تفعيل الـ highlight
                setHighlightedId(location.state.highlightedId);

                // 3. إزالة الـ highlight بعد 3 ثوانٍ
                const timer = setTimeout(() => {
                    setHighlightedId(null);
                    // مسح الـ state من الـ location حتى لا يتكرر الـ highlight عند عمل refresh
                    window.history.replaceState({}, document.title);
                }, 3000);

                return () => clearTimeout(timer);
            }
        }
    }, [location.state, foods]);

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
            accessorKey: 'name',
            header: t('foodName'),
            cell: ({ row }) => (
                <span className="capitalize font-medium">{row.original.name}</span>
            )
        },
        {
            accessorKey: 'price',
            header: t('price'),
            cell: ({ row }) => (
                <span className="font-medium text-green-600">
                    {row.original.price} EGP
                </span>
            )
        },
        {
            accessorKey: 'category',
            header: t('category'),
            cell: ({ row }) => (
                <Badge variant="secondary" className="capitalize">
                    {row.original.category?.name || '-'}
                </Badge>
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
                                                {ing.name}
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