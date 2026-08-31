import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export default function Cuisine() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: cuisines = [], isLoading } = useQuery({
        queryKey: ['cuisines'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/cuisines');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('categoryNameHeader') },
        { accessorKey: 'nameAr', header: t('categoryNameArHeader') },
        { accessorKey: 'nameFr', header: t('categoryNameFrHeader') },
        {
            accessorKey: "Image",
            header: t('imageHeader'),
            cell: ({ row }) => {
                const imageStr = row.getValue("Image");
                return (
                    <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
                        {imageStr ? (
                            <img
                                src={imageStr}
                                alt="category"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                                {t('noImageText')}
                            </div>
                        )}
                    </div>
                );
            },
        },
        { accessorKey: 'description', header: t('descriptionHeader') },
        { accessorKey: 'descriptionAr', header: t('descriptionArHeader') },
        { accessorKey: 'descriptionFr', header: t('descriptionFrHeader') },
        { accessorKey: 'meta_description', header: t('metaDescriptionHeader') },
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
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('cuisinesTitle')}
                columns={columns}
                data={cuisines}
                isLoading={isLoading}
                queryKey="cuisines"
                deleteApiUrl="/api/restaurant/cuisines"
                onAdd={() => navigate("/cuisines/add")}
                onEdit={(cuisine) => navigate(`/cuisines/edit/${cuisine.id}`)}
            />
        </div>
    );
}