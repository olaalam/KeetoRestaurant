import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useParams } from 'react-router-dom';
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ListTree, PlusCircle, CheckCircle2, Pencil, Store } from "lucide-react"; 
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; 
import { Button } from "@/components/ui/button";

export default function BrancheMenu() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { restaurantId } = useParams();
    const { t, i18n } = useTranslation();

    const [priceDialogOpen, setPriceDialogOpen] = useState(false);
    const [foodToUpdatePrice, setFoodToUpdatePrice] = useState(null); 
    const [newPrice, setNewPrice] = useState('');

    const { data: branchemenu = [], isLoading, refetch } = useQuery({
        queryKey: ['branchemenu', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/branchemenu/${restaurantId}`);
            return res.data?.data?.data || res.data?.data || [];
        }
    });

const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await api.put(`/api/restaurant/branchemenu/${id}`, {
                status: status
            });
        },
        onSuccess: () => {
            toast.success(t("statusUpdatedSuccessfully") || "تم تحديث الحالة بنجاح");
            queryClient.invalidateQueries({ queryKey: ['branchemenu', restaurantId] });
        },
        onError: () => {
            toast.error(t("failedToUpdateStatus") || "فشل تحديث الحالة");
        }
    });

    const handleSavePrice = async () => {
        if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) return;
        
        // استخدام menuItemId أو foodId إذا كان الأول null
        const targetId = foodToUpdatePrice?.menuItemId || foodToUpdatePrice?.foodId;

        try {
            await api.put(`/api/restaurant/branchemenu/${targetId}`, {
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
            accessorKey: 'name', 
            header: t('food'),
            cell: ({ row }) => (i18n?.language === 'ar' ? row.original.nameAr : row.original.name) || row.original.name
        },
        {
            accessorKey: 'price',
            header: t('price'),
            cell: ({ row }) => (
                <div
                    className="flex items-center gap-2 font-medium text-green-600 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors w-fit"
                    onClick={() => {
                        setFoodToUpdatePrice(row.original); 
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
            accessorKey: 'stockType',
            header: t('stockType'),
            cell: ({ getValue }) => getValue() ? t(getValue().toLowerCase()) : '—'
        },
        { accessorKey: 'stockQty', header: t('stockQty') },
{
            accessorKey: 'status',
            header: t('status'),
            cell: ({ row }) => {
                // إذا كان menuItemId غير موجود أو null، لا تظهر الـ Switch واعرض علامة —
                if (!row.original.menuItemId) {
                    return <span className="text-gray-400">—</span>;
                }

                const targetId = row.original.menuItemId || row.original.foodId;
                const isActive = row.original.status === 'active' || row.original.status === true;
                
                return (
                    <div className="flex items-center justify-center">
                        <Switch
                            checked={isActive}
                            onCheckedChange={() => {
                                const newStatus = isActive ? 'inactive' : 'active';
                                updateStatusMutation.mutate({
                                    id: targetId,
                                    status: newStatus
                                });
                            }}
                            disabled={updateStatusMutation.isPending}
                        />
                    </div>
                );
            }
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("branchMenu")}
                columns={columns}
                data={branchemenu}
                isLoading={isLoading}
                queryKey="branchemenu"
                deleteApiUrl="/api/restaurant/branchemenu"
                onEdit={(row) => {
                    const targetId = row.menuItemId || row.foodId;
                    navigate(`/branches/branch_menu/edit/${targetId}`, {
                        state: { branchId: restaurantId, branchemenu: row }
                    });
                }}
            />
            
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
        </div>
    );
}