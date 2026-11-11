import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { ListTree, PlusCircle, CheckCircle2, Pencil, Store, Filter, X, Plus } from "lucide-react";

export default function Category() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/categories');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('categoryNameHeader') },
        { accessorKey: 'nameAr', header: t('categoryNameArHeader') },
        { accessorKey: 'nameFr', header: t('categoryNameFrHeader') },
{
            accessorKey: 'image',
            header: t('image'),
            cell: ({ row }) => {
                const food = row.original;
                const imageUrl = food.image;
                const fileInputRef = React.useRef(null);
                const [uploading, setUploading] = useState(false);

                const handleImageChange = async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append('image', file);
                    // لو السيرفر عندك بيحتاج _method للـ PUT مع الـ FormData فك التعليق عن السطر التالي:
                    // formData.append('_method', 'PUT');

                    try {
                        setUploading(true);
                        // استبدل بـ api.put أو api.post حسب المتوافق مع الـ Backend لديك
                        await api.post(`/api/restaurant/food/${food.id}`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        
                        toast.success(t('statusUpdatedSuccessfully') || 'تم تحديث الصورة بنجاح');
                        refetch(); // لإعادة جلب البيانات وتحديث الجدول فوراً
                    } catch (error) {
                        console.error("Error updating image:", error);
                        toast.error(t('failedToUpdateStatus') || 'فشل تحديث الصورة');
                    } finally {
                        setUploading(false);
                    }
                };

                return (
                    <div className="relative group w-12 h-12 rounded-md overflow-hidden bg-gray-100 border shrink-0">
                        {imageUrl ? (
                            <img src={imageUrl} alt={food.name} className="w-full h-full object-cover" />
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

                        {/* إدخال ملف مخفي يتم تشغيله عند الضغط على الزر */}
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
        { accessorKey: 'title', header: t('titleHeader') },
        { accessorKey: 'priority', header: t('priorityHeader') },
        { accessorKey: 'meta_title', header: t('metaTitleHeader') },
        {
            accessorKey: "meta_image",
            header: t('metaImageHeader'),
            cell: ({ row }) => {
                const metaImg = row.getValue("meta_image");
                return (
                    <div className="w-10 h-10 border rounded shadow-sm">
                        {metaImg && <img src={metaImg} className="w-full h-full object-cover rounded" />}
                    </div>
                );
            }
        },
        { accessorKey: 'status', header: t('statusHeader') },
    ];

    return (
        <div className="container mx-auto py-2">
            <GenericDataTable
                title={t('categoriesTitle')}
                columns={columns}
                data={categories}
                isLoading={isLoading}
                queryKey="categories"
                deleteApiUrl="/api/restaurant/categories"
                onAdd={() => navigate("/categories/add")}
                onEdit={(category) => navigate(`/categories/edit/${category.id}`)}
            />
        </div>
    );
}