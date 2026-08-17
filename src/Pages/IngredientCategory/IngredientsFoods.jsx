import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useParams } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";
import { X } from 'lucide-react';

export default function IngredientsFoods() {
    const { categoryId } = useParams(); // تمثل هنا ingredientId
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // حالة الطعام المحدد للتحكم في الفروع
    const [selectedFood, setSelectedFood] = useState(null);

    // 1. جلب الأطعمة المربوطة بالمكون
    const { data: ingredientFoods = [], isLoading } = useQuery({
        queryKey: ['ingredient-food', categoryId],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/ingredients/foods/${categoryId}`);
            return res.data.data.data;
        }
    });

    // 2. جلب توافر الطعام في الفروع (Availability) - تم إرجاع مصفوفة الفروع مباشرة
    const { data: branchesData = [], isLoading: isAvailabilityLoading } = useQuery({
        queryKey: ['food-lock-availability', selectedFood?.foodId, categoryId],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/food-locks/availability', {
                params: {
                    foodId: selectedFood?.foodId,
                    ingredientId: categoryId
                }
            });
            return res.data.data.data; // مصفوفة الفروع الموجودة في الاستجابة
        },
        enabled: !!selectedFood
    });

    // 3. Mutation لتغيير حالة قفل/توافر المكون للطعام في الفرع (PUT)
    const toggleLockMutation = useMutation({
        mutationFn: async ({ branchId, isLocked }) => {
            return await api.put(
                `/api/restaurant/food-locks/food/${selectedFood.foodId}/ingredient/${categoryId}/lock`,
                { branchId, isLocked }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['food-lock-availability', selectedFood?.foodId, categoryId]);
        }
    });

    // معالج تغيير التبديل (Switch Toggle)
    const handleToggle = (branch) => {
        const currentIsAvailable = branch.isAvailable;
        toggleLockMutation.mutate({
            branchId: branch.branchId,
            isLocked: currentIsAvailable // إذا كان متاحاً حالياً، فالضغط سيقوم بقفله (isLocked: true) والعكس صحيح
        });
    };

    // الأعمدة
    const columns = [
        { accessorKey: 'foodName', header: t('nameEn') },
        {
            accessorKey: 'foodStatus',
            header: t('status'),
            cell: ({ row }) => {
                const status = row.original.foodStatus;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {status === 'active' ? t('active') : t('inactive')}
                    </span>
                );
            }
        },
        {
            accessorKey: 'isRemovable',
            header: t('isRemovable'),
            cell: ({ row }) => (
                <span>{row.original.isRemovable ? 'Yes' : 'No'}</span>
            )
        },
        {
            id: 'actions',
            header: t('actions') || 'التحكم',
            cell: ({ row }) => (
                <button
                    onClick={() => setSelectedFood(row.original)}
                    className="px-3 py-1 bg-primary hover:bg-primary/60 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                    {t('branchProductControl') || 'branchProductControl'}
                </button>
            )
        }
    ];

    const totalBranches = branchesData.length;

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("foods")}
                columns={columns}
                data={ingredientFoods}
                isLoading={isLoading}
                queryKey="ingredient-food"
                actions={false}
            />

            {/* نافذة التحكم بالفروع */}
            {selectedFood && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative border border-gray-100">
                        
                        {/* الهيدر */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    branchProductControl
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    totalBranches: {totalBranches}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedFood(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* محتوى قائمة الفروع */}
                        {isAvailabilityLoading ? (
                            <div className="py-8 text-center text-xs text-gray-400">
                                جاري التحميل...
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                                {branchesData.map((branch) => (
                                    <div
                                        key={branch.branchId}
                                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/70 rounded-xl transition-colors"
                                    >
                                        <span className="text-xs font-semibold text-gray-700">
                                            {branch.branchNameAr || branch.branchName}
                                        </span>

                                        {/* زر التبديل (Toggle Switch) */}
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={branch.isAvailable}
                                                onChange={() => handleToggle(branch)}
                                                disabled={toggleLockMutation.isPending}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#f59e0b]"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}