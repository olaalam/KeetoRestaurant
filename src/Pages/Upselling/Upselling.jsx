import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GenericDataTable from '@/components/GenericDataTable'; // تأكدي من المسار
import { useGet } from '@/hooks/useGet'; // تأكدي من المسار
import { useTranslation } from '@/hooks/useTranslation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"; // تأكدي من أن مكون الـ Dialog مُثبت لديكِ
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const Upselling = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // جلب قائمة المنتجات المرتبطة
    const { data: listResponse, isLoading } = useGet(
        'recommended-foods', 
        '/api/restaurant/recommended-foods'
    );

    // تجهيز البيانات وإضافة id في المستوى الأول ليعمل زر الحذف التلقائي
    const tableData = useMemo(() => {
        const items = listResponse?.data?.data;
        if (!Array.isArray(items)) return [];
        
        return items.map(item => ({
            ...item,
            id: item.food?.id 
        }));
    }, [listResponse]);

    // تجهيز الأعمدة
    const columns = [
        {
            id: 'food',
            header: t("mainFood") || "Main Food",
            cell: ({ row }) => {
                const food = row.original.food;
                if (!food) return "-";
                
                return (
                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                        {food.image && (
                            <img 
                                src={food.image} 
                                alt={food.name || food.nameAr} 
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm"
                            />
                        )}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {food.name || food.nameAr || "بدون اسم"}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'recommendedItems',
            header: t("upsellingProducts") || "Recommended Foods",
            cell: ({ row }) => {
                const recommendations = row.original.recommendedFoods || []; 
                
                if (recommendations.length === 0) {
                    return <span className="text-slate-400 text-xs">{t("noDataFound") || "No recommendations"}</span>;
                }

                return (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-2 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                            >
                                <Eye className="h-4 w-4" />
                                {t("viewProducts") || "View Products"} ({recommendations.length})
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl text-primary border-b pb-2">
                                    {t("upsellingProducts") || "Upselling Products"}
                                </DialogTitle>
                            </DialogHeader>
                            
                            {/* قائمة المنتجات داخل الـ Dialog */}
                            <div className="flex flex-col gap-3 mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {recommendations.map(item => (
                                    <div 
                                        key={item.recommendationId || item.id} 
                                        className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                    >
                                        {item.image ? (
                                            <img 
                                                src={item.image} 
                                                alt={item.name || item.nameAr} 
                                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-200 shrink-0" />
                                        )}
                                        <div className="flex flex-col flex-1">
                                            <span className="font-semibold text-sm text-slate-800">
                                                {item.name || item.nameAr || "بدون اسم"}
                                            </span>
                                            {item.price && (
                                                <span className="text-xs text-primary font-bold mt-0.5">
                                                    {item.price} {t("currency") || "EGP"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            }
        }
    ];

    return (
        <div className="p-6">
            <GenericDataTable
                title={t("upsellingProducts") || "Upselling Products"}
                columns={columns}
                data={tableData}
                isLoading={isLoading}
                queryKey="recommended-foods"
                onAdd={() => navigate('/upselling/add')}
                deleteApiUrl="/api/restaurant/recommended-foods" 
            />
        </div>
    );
};

export default Upselling;