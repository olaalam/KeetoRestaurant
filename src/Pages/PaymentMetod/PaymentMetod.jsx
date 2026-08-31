import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export default function PaymentMethod() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: paymentMethods = [], isLoading } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/payment-methods');
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
        { accessorKey: 'type', header: t('typeHeader') },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('paymentMethodsTitle')}
                columns={columns}
                data={paymentMethods}
                isLoading={isLoading}
                queryKey="paymentMethods"
                deleteApiUrl="/api/restaurant/payment-methods"
                onAdd={() => navigate("/payment-methods/add")}
                onEdit={(paymentMethod) => navigate(`/payment-methods/edit/${paymentMethod.id}`)}
            />
        </div>
    );
}