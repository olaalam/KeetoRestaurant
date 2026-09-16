import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";

const FoodListDialog = ({ restaurantId, foods, isOpen, onClose }) => {
    const { t } = useTranslation();

    // يتم تفعيل طلب الـ API فقط إذا تم تمرير restaurantId ولم يتم تمرير مصفوفة foods جاهزة
    const { data: fetchedFoodItems = [], isLoading } = useQuery({
        queryKey: ['restaurant-food', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/branchemenu/${restaurantId}`);
            return res.data?.data?.data || res.data?.data || [];
        },
        enabled: !!restaurantId && !foods && isOpen,
    });

    // اختيار البيانات الممررة كـ prop أو المجلوبة من الـ API
    const foodItems = foods || fetchedFoodItems;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('restaurantMenu')}</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-10"><LoadingSpinner /></div>
                ) : foodItems.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 mt-4">
                        {foodItems.map((item) => (
                            <div key={item.id} className="flex border rounded-lg p-3 items-center gap-4">
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-16 h-16 rounded-md object-cover bg-gray-100"
                                    />
                                )}
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm">{item.name}</h4>
                                    
                                    {item.description && (
                                        <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                    )}

                                    {/* عرض الترجمات أو الأسماء البديلة إن وجدت */}
                                    {(item.nameAr || item.nameFr) && (
                                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                            {item.nameAr && <span>العربية: {item.nameAr}</span>}
                                            {item.nameFr && <span>الفرنسية: {item.nameFr}</span>}
                                        </div>
                                    )}

                                    {/* السعر والحالة إن وجدا */}
                                    {(item.price || item.status) && (
                                        <div className="flex justify-between items-center mt-2">
                                            {item.price && (
                                                <span className="text-orange-600 font-bold text-sm">{item.price} EGP</span>
                                            )}
                                            {item.status && (
                                                item.status === 'active' ? (
                                                    <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">{t('active')}</span>
                                                ) : (
                                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{t('inactive')}</span>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center text-gray-500">{t('noFoodItems')}</div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default FoodListDialog;