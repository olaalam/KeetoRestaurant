// Coupon.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';

export default function Coupon() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // حالات الـ Dialog الخاصة بعرض الأطعمة
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFoods, setSelectedFoods] = useState([]);

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['coupons'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/coupons');
            return res.data.data.data;
        }
    });

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const columns = [
        { accessorKey: 'code', header: t('code') },
        { accessorKey: 'name', header: t('categoryName') },
        { accessorKey: 'discountType', header: t('discountType') },
        { accessorKey: 'discountValue', header: t('discountValue') },
        {
            accessorKey: 'foodIds',
            header: t('foods') || 'الأطعمة',
            cell: ({ row }) => {
                // استخراج الأطعمة المرتبطة (تأكد من اسم الخيار الراجع من الـ API سواء foods أو foodIds)
                const foods = row.original.foods || row.original.foodsList || row.original.foodIds || [];
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedFoods(Array.isArray(foods) ? foods : []);
                            setIsDialogOpen(true);
                        }}
                        className="rounded-xl font-bold gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                    >
                        <Eye className="h-4 w-4" />
                        {t('viewFoods') || 'عرض الأطعمة'} ({foods.length})
                    </Button>
                );
            }
        },
        { accessorKey: 'startDate', header: t('startDate'), cell: (info) => formatDate(info.getValue()) },
        { accessorKey: 'endDate', header: t('endDate'), cell: (info) => formatDate(info.getValue()) },
    ];

    return (
        <div className="container mx-auto py-2 relative">
            <GenericDataTable
                title={t('couponsTitle')}
                columns={columns}
                data={coupons}
                isLoading={isLoading}
                queryKey="coupons"
                deleteApiUrl="/api/restaurant/coupons"
                onAdd={() => navigate("/coupon/add")}
                onEdit={(coupon) => navigate(`/coupon/edit/${coupon.id}`)}
            />

            {/* Dialog عرض الأطعمة */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => setIsDialogOpen(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-4">
                            {t('associatedFoods') || 'الأطعمة المرتبطة بالكوبون'}
                        </h3>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                            {selectedFoods && selectedFoods.length > 0 ? (
                                selectedFoods.map((food, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-medium flex items-center justify-between border border-slate-100 dark:border-slate-700/50">
                                        <span className="text-slate-800 dark:text-slate-200">
                                            {typeof food === 'object' ? (food.name || food.nameAr || food.title) : food}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-6">
                                    {t('noFoodsFound') || 'لا توجد أطعمة مرتبطة بهذا الكوبون'}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button 
                                onClick={() => setIsDialogOpen(false)} 
                                className="rounded-xl px-5 h-11 font-bold bg-primary text-primary-foreground"
                            >
                                {t('close') || 'إغلاق'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}