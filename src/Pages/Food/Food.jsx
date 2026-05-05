import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GenericDataTable from '@/components/GenericDataTable';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ListTree, PlusCircle, CheckCircle2 } from "lucide-react";
import { usePost } from '@/hooks/usePost'; //[cite: 2]
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Foods = () => {
    const navigate = useNavigate();
    const [selectedVariations, setSelectedVariations] = useState(null);

    // حالات إدارة المكونات
    const [ingredientsDialogOpen, setIngredientsDialogOpen] = useState(false);
    const [currentFoodId, setCurrentFoodId] = useState(null);
    const [selectedIngredients, setSelectedIngredients] = useState([]);

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
            // الوصول للمكونات داخل data.data.ingredients
            console.log(res.data.data.data.ingredients);

            return res.data.data.data.ingredients || [];
        }
    });

    // 2. هوك الإرسال للبيانات[cite: 2]
    const assignMutation = usePost(
        `/api/restaurant/food/assign-ingredients/${currentFoodId}`,
        'post',
        'foods'
    );

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
            header: 'Image',
            cell: ({ row }) => {
                const imageUrl = row.original.image;
                return (
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                        {imageUrl ? (
                            <img src={imageUrl} alt={row.original.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-xs text-gray-400">No Img</div>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'name',
            header: 'Food Name',
            cell: ({ row }) => (
                <span className="capitalize font-medium">{row.original.name}</span>
            )
        },
        { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' },
        {
            accessorKey: 'price',
            header: 'Price',
            cell: ({ row }) => (
                <span className="font-medium text-green-600">
                    {row.original.price} EGP
                </span>
            )
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => (
                <Badge variant="secondary" className="capitalize">
                    {row.original.category?.name || '-'}
                </Badge>
            )
        },
        // عمود المكونات الجديد
        {
            accessorKey: 'assign_ingredients',
            header: 'Ingredients',
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setCurrentFoodId(row.original.id);
                        // استخراج المكونات الحالية إذا كانت مسجلة مسبقاً في الـ food
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
                    Assign
                </Button>
            )
        },
        {
            accessorKey: 'variations',
            header: 'Variations',
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
                        View ({variations.length})
                    </Button>
                );
            }
        }
    ];

    return (
        <div className="p-6">
            <GenericDataTable
                title="Foods Menu"
                columns={columns}
                data={foods || []}
                isLoading={isLoading}
                queryKey={['foods']}
                deleteApiUrl="/api/restaurant/food"
                onAdd={() => navigate('/foods/add')}
                onEdit={(row) => navigate(`/foods/edit/${row.id}`)}
            />

            {/* Dialog عرض الـ Variations[cite: 1] */}
            <Dialog open={!!selectedVariations} onOpenChange={() => setSelectedVariations(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Product Variations</DialogTitle>
                        <DialogDescription>
                            Detailed options and pricing for this food item.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        {selectedVariations?.map((v, idx) => (
                            <div key={idx} className="border p-4 rounded-lg bg-slate-50">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-bold text-lg">{v.name}</h4>
                                    <div className="flex gap-2">
                                        <Badge>{v.selectionType}</Badge>
                                        {v.isRequired && <Badge variant="destructive">Required</Badge>}
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
                                No variations found for this item.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog تعيين المكونات */}
            <Dialog open={ingredientsDialogOpen} onOpenChange={setIngredientsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            Assign Ingredients
                        </DialogTitle>
                        <DialogDescription>
                            Select ingredients and set if they are removable.
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
                                                <span className="text-[10px] text-muted-foreground font-bold">REMOVABLE</span>
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
                            <p className="text-center text-muted-foreground py-4">No ingredients available.</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-4">
                        <Button variant="outline" onClick={() => setIngredientsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveIngredients}
                            disabled={assignMutation.isPending}
                        >
                            {assignMutation.isPending ? "Saving..." : "Save Selection"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Foods;