import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // أضفنا هؤلاء
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Switch } from "@/components/ui/switch"; // تأكدي من مسار الـ Switch في مشروعك
import { toast } from "sonner"; // أو أي مكتبة تنبيهات تستخدمينها
import { Eye } from 'lucide-react';

export default function Ingredients() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 1. جلب البيانات
    const { data: ingredients = [], isLoading } = useQuery({
        queryKey: ['ingredients'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/ingredients');
            return res.data.data.data;
        }
    });

    // 2. الـ Mutation لتحديث حالة المخزون
    const updateStockMutation = useMutation({
        mutationFn: async ({ id, inStockValue }) => {
            // هنا نرسل الطلب بالشكل المطلوب { "inStock": false/true }
            return await api.patch(`/api/restaurant/ingredients/stock/${id}`, {
                inStock: inStockValue
            });
        },
        onSuccess: () => {
            // تحديث البيانات في الجدول فوراً دون إعادة تحميل الصفحة
            queryClient.invalidateQueries(['ingredients']);
            toast.success("Updated successfully");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || "Failed to update");
        }
    });

    const handleStockToggle = (id, currentStatus) => {
        // إرسال القيمة العكسية (إذا كانت true تصبح false والعكس)
        updateStockMutation.mutate({
            id: id,
            inStockValue: !currentStatus
        });
    };

    // 3. تعريف الأعمدة
    const columns = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'nameAr', header: 'Arabic Name' },
        { accessorKey: 'categoryName', header: 'Category' },
        {
            accessorKey: 'inStock',
            header: 'In Stock',
            cell: ({ row }) => {
                const isPending = updateStockMutation.isPending && updateStockMutation.variables?.id === row.original.id;

                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            // القيمة تأتي من قاعدة البيانات كـ true أو false
                            checked={row.original.inStock}
                            onCheckedChange={() => handleStockToggle(row.original.id, row.original.inStock)}
                            // تعطيل السويتش فقط للعنصر الذي يتم تحديثه حالياً
                            disabled={isPending}
                        />
                        <span className="text-xs text-muted-foreground">
                            {row.original.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                    </div>
                );
            }
        },
        {
            accessorKey: "view_foods",
            header: "Foods",
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`/ingredients/food/${row.original.id}`)}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
                >
                    <Eye size={16} />
                    Manage Foods
                </button>
            )
        },

    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Ingredients"
                columns={columns}
                data={ingredients}
                isLoading={isLoading}
                queryKey="ingredients"
                deleteApiUrl="/api/restaurant/ingredients"
                onAdd={() => navigate("/ingredients/add")}
                onEdit={(item) => navigate(`/ingredients/edit/${item.id}`)}
            />
        </div>
    );
}