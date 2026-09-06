import React, { useState } from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import { useGet } from '@/hooks/useGet';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function OutOfStockFoods() {
    const { t, isRTL } = useTranslation();
    const navigate = useNavigate();
    const [branchId, setBranchId] = useState('all');

    // جلب قائمة الفروع للفلترة مع معالجة هيكل الـ API بأمان
    const { data: branchesResponse } = useGet('restaurantBranches', '/api/restaurant/branches');
    const branches = Array.isArray(branchesResponse?.data) 
        ? branchesResponse.data 
        : (Array.isArray(branchesResponse?.data?.data) ? branchesResponse.data.data : []);

    // جلب البيانات مع تمرير الـ branchId في الـ query params بناءً على الاختيار
    const { data: response, isLoading } = useGet(
        ['outOfStockFoods', branchId], 
        '/api/restaurant/food/out-of-stock',
        branchId !== 'all' ? { branchId } : {}
    );

    // استخراج المصفوفة بناءً على هيكل الـ JSON[cite: 2]
    const foods = response?.data?.data || [];

    // تعريف الأعمدة[cite: 2]
    const columns = [
        { 
            accessorKey: 'name', 
            header: t('nameEn') || 'English Name'
        },
        { 
            accessorKey: 'nameAr', 
            header: t('nameAr') || 'Arabic Name'
        },
        {
            id: 'category',
            header: t('category') || 'Category',
            cell: ({ row }) => {
                const category = row.original.category;
                return isRTL ? (category?.nameAr || category?.name) : (category?.name || category?.nameAr);
            }
        },
        { 
            accessorKey: 'price', 
            header: t('price') || 'Price'
        },
        {
            id: 'unavailableBranches',
            header: t('unavailableBranches') || (isRTL ? 'الفروع غير المتاحة' : 'Unavailable Branches'),
            cell: ({ row }) => {
                const branchesList = row.original.unavailableBranches || [];

                if (branchesList.length === 0) {
                    return (
                        <span className="text-gray-500 font-medium text-xs sm:text-sm">
                            {t('noUnavailableBranches') || (isRTL ? 'لا توجد فروع غير متاحة' : 'No unavailable branches')}
                        </span>
                    );
                }

                return (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                {t('viewBranches') || (isRTL ? 'عرض الفروع' : 'View Branches')} ({branchesList.length})
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {t('unavailableBranches') || (isRTL ? "الفروع غير المتاحة" : "Unavailable Branches")}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 max-h-60 overflow-y-auto">
                                <ul className="space-y-2">
                                    {branchesList.map((branch) => (
                                        <li 
                                            key={branch.id} 
                                            className="p-2 rounded-md bg-muted text-sm border"
                                        >
                                            {isRTL ? (branch.nameAr || branch.name) : (branch.name || branch.nameAr)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            }
        }
    ];

    return (
        <div className="container mx-auto py-10">
            {/* فلتر الفروع */}
            <div className="mb-6 flex items-center gap-4">
                <select 
                    value={branchId} 
                    onChange={(e) => setBranchId(e.target.value)} 
                    className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm text-sm text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                    <option value="all">{t('allBranches') || (isRTL ? 'جميع الفروع' : 'All Branches')}</option>
                    {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                            {isRTL ? (b.nameAr || b.name) : (b.name || b.nameAr)}
                        </option>
                    ))}
                </select>
            </div>

            <GenericDataTable
                title={t("outOfStockFoods") || (isRTL ? "الأطعمة غير المتاحة" : "Out of Stock Foods")}
                columns={columns}
                data={foods}
                isLoading={isLoading}
                queryKey="outOfStockFoods"
                actions={false}
            />
        </div>
    );
}