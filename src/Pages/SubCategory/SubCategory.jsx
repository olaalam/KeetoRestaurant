import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Store } from "lucide-react";
import { toast } from 'sonner';

export default function SubCategory() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // حالات إدارة تحكم الفروع (Branches availability per subcategory)
    const [branchControlOpen, setBranchControlOpen] = useState(false);
    const [selectedSubCategoryForBranch, setSelectedSubCategoryForBranch] = useState(null);

    const { data: subcategories = [], isLoading } = useQuery({
        queryKey: ['subcategories'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/subcategories');
            return res.data.data.data;
        }
    });

    const {
        data: branchAvailability = [],
        isLoading: isLoadingBranches,
        refetch: refetchBranches,
    } = useQuery({
        queryKey: ['subcategory-branches-availability', selectedSubCategoryForBranch?.id],
        queryFn: async () => {
            const res = await api.get(
                `/api/restaurant/subcategories/${selectedSubCategoryForBranch.id}/branches-availability`
            );

            // المسار الدقيق بناءً على هيكل الـ JSON المرفق
            return res.data?.data?.data?.branches || res.data?.data?.branches || [];
        },
        enabled: branchControlOpen && !!selectedSubCategoryForBranch?.id,
    });
    // تبديل حالة توفر القسم الفرعي في فرع معين
    // 💡 مفترض إن الـ payload شكله { isAvailable: boolean } - عدّليه لو الـ API عندك بيستنى اسم مختلف
    const handleBranchAvailabilityToggle = async (branchId, currentIsAvailable) => {
        try {
            await api.put(
                `/api/restaurant/subcategories/${selectedSubCategoryForBranch.id}/branch/${branchId}/status`,
                { isAvailable: !currentIsAvailable }
            );
            toast.success(t('statusUpdatedSuccessfully') || 'تم تحديث حالة الفروع بنجاح');
            refetchBranches();
        } catch (error) {
            console.error("Error updating subcategory branch status:", error);
            toast.error(t('failedToUpdateStatus') || 'فشل تحديث حالة الفرع');
        }
    };

    const columns = [
        { accessorKey: 'name', header: t('name') },
        { accessorKey: 'nameAr', header: t('nameAr') },
        { accessorKey: 'nameFr', header: t('nameFr') },
        { accessorKey: 'category.name', header: t('categoryColumn') },
        { accessorKey: 'priority', header: t('priority') },
        {
            accessorKey: 'addons',
            header: t('addonsColumn'),
            cell: ({ row }) => {
                const addons = row.original.addons || [];
                if (addons.length === 0) {
                    return <span className="text-gray-400 text-sm">-</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {addons.map((addon) => (
                            <Badge key={addon.id} variant="outline" className="text-xs">
                                {addon.name}
                            </Badge>
                        ))}
                    </div>
                );
            }
        },
        { accessorKey: 'order_level', header: t('orderLevelColumn') },
        { accessorKey: 'status', header: t('status') }, // 💡 إضافة عمود الحالة هنا
        {
            id: 'branchControl',
            header: t('branchControl') || 'فروع القسم الفرعي',
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setSelectedSubCategoryForBranch(row.original);
                        setBranchControlOpen(true);
                    }}
                    className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
                >
                    <Store className="h-4 w-4" />
                    {t('branches') || 'الفروع'}
                </Button>
            )
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('subcategoriesTitle')}
                columns={columns}
                data={subcategories}
                isLoading={isLoading}
                queryKey="subcategories"
                deleteApiUrl="/api/restaurant/subcategories"
                editApiUrl="/api/restaurant/subcategories" // 💡 مطلوب لتفعيل السويتش التلقائي لتحديث الحالة
                onAdd={() => navigate("/sub-categories/add")}
                onEdit={(city) => navigate(`/sub-categories/edit/${city.id}`)}
            />

            {/* Branch Availability Control Dialog */}
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
                                const branchName = branch.branchNameAr || branch.branchName || branch.name;

                                return (
                                    <div key={branch.branchId || branch.id} className="flex items-center justify-between p-3.5 border rounded-xl bg-slate-50 shadow-sm">
                                        <span className="font-semibold text-slate-800">
                                            {branchName || 'فرع بدون اسم'}
                                        </span>
                                        <Switch
                                            checked={isAvailable}
                                            onCheckedChange={() => handleBranchAvailabilityToggle(branch.branchId || branch.id, isAvailable)}
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
        </div>
    );
}