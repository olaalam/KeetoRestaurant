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
import { Store, Plus } from "lucide-react";
import { toast } from 'sonner';

export default function SubCategory() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // حالات إدارة تحكم الفروع
    const [branchControlOpen, setBranchControlOpen] = useState(false);
    const [selectedSubCategoryForBranch, setSelectedSubCategoryForBranch] = useState(null);

    const { data: subcategories = [], isLoading, refetch } = useQuery({
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
            return res.data?.data?.data?.branches || res.data?.data?.branches || [];
        },
        enabled: branchControlOpen && !!selectedSubCategoryForBranch?.id,
    });

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
{
            accessorKey: 'image',
            header: t('image'),
            cell: ({ row }) => {
                const item = row.original;
                const imageUrl = item.image;
                const fileInputRef = React.useRef(null);
                const [uploading, setUploading] = useState(false);

                const handleImageChange = (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // تحويل الصورة إلى Base64
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    
                    reader.onload = async () => {
                        const base64String = reader.result;

                        try {
                            setUploading(true);
                            
                            // إرسال الـ Base64 كـ JSON باستخدام api.put المباشر
                            // (تأكد من تعديل الـ URL حسب الصفحة سواء Subcategories أو Foods)
                            const endpoint = window.location.pathname.includes('sub-categories')
                                ? `/api/restaurant/subcategories/${item.id}`
                                : `/api/restaurant/food/${item.id}`;

                            await api.put(endpoint, {
                                image: base64String
                            });
                            
                            toast.success(t('statusUpdatedSuccessfully') || 'تم تحديث الصورة بنجاح');
                            refetch();
                        } catch (error) {
                            console.error("Error updating image:", error);
                            toast.error(t('failedToUpdateStatus') || 'فشل تحديث الصورة');
                        } finally {
                            setUploading(false);
                        }
                    };

                    reader.onerror = (error) => {
                        console.error("Error reading file:", error);
                        toast.error('فشل قراءة الملف');
                    };
                };

                return (
                    <div className="relative group w-12 h-12 rounded-md overflow-hidden bg-gray-100 border shrink-0">
                        {imageUrl ? (
                            <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-xs text-gray-400">
                                {t('noImg')}
                            </div>
                        )}

                        {/* زر الـ (+) يظهر عند المرور بالماوس */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                            title={t('updateImage') || 'تعديل الصورة'}
                        >
                            {uploading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Plus className="w-5 h-5 font-bold" />
                            )}
                        </div>

                        {/* إدخال ملف مخفي */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            accept="image/*" 
                            className="hidden" 
                        />
                    </div>
                );
            }
        },
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
        { accessorKey: 'status', header: t('status') },
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
        <div className="container mx-auto py-2">
            <GenericDataTable
                title={t('subcategoriesTitle')}
                columns={columns}
                data={subcategories}
                isLoading={isLoading}
                queryKey="subcategories"
                deleteApiUrl="/api/restaurant/subcategories"
                editApiUrl="/api/restaurant/subcategories"
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