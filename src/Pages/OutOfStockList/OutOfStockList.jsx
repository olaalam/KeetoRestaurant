import React from 'react';
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

    // جلب البيانات من الـ API المحدد
    const { data: response, isLoading } = useGet(
        'outOfStockFoods', 
        '/api/restaurant/food/out-of-stock'
    );

    // استخراج المصفوفة بناءً على هيكل الـ JSON
    const foods = response?.data?.data || [];

    // تعريف الأعمدة
    const columns = [
        { 
            accessorKey: 'name', 
            header: t('nameEn') 
        },
        { 
            accessorKey: 'nameAr', 
            header: t('nameAr') 
        },
        {
            id: 'category',
            header: t('category'),
            cell: ({ row }) => {
                const category = row.original.category;
                return isRTL ? (category?.nameAr || category?.name) : (category?.name || category?.nameAr);
            }
        },
        { 
            accessorKey: 'price', 
            header: t('price') 
        },
        {
            id: 'unavailableBranches',
            header: t('unavailableBranches') || (isRTL ? 'الفروع غير المتاحة' : 'Unavailable Branches'),
            cell: ({ row }) => {
                const branches = row.original.unavailableBranches || [];

                if (branches.length === 0) {
                    return <span className="text-gray-400">-</span>;
                }

                return (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                {isRTL ? `عرض الفروع (${branches.length})` : `View Branches (${branches.length})`}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {isRTL ? "الفروع غير المتاحة" : "Unavailable Branches"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 max-h-60 overflow-y-auto">
                                <ul className="space-y-2">
                                    {branches.map((branch) => (
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
            <GenericDataTable
                title={t("outOfStockFoods") || "Out of Stock Foods"}
                columns={columns}
                data={foods}
                isLoading={isLoading}
                queryKey="outOfStockFoods"
                actions={false}
            />
        </div>
    );
}