import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GenericDataTable from '@/components/GenericDataTable';
import { useGet } from '@/hooks/useGet';
import { useTranslation } from '@/hooks/useTranslation';

export default function FreeDelivery() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const apiUrl = "/api/restaurant/free-delivery";
    const queryKey = "free-delivery-list";

    const { data, isLoading } = useGet(queryKey, apiUrl);

    const columns = [
        {
            accessorKey: "minOrderAmount",
            header: t('minOrderAmountHeader'),
            cell: ({ row }) => <span className="font-semibold">{row.original.minOrderAmount}</span>
        },
        {
            accessorKey: "startDate",
            header: t('startDateHeader'),
            cell: ({ row }) => row.original.startDate
                ? new Date(row.original.startDate).toLocaleDateString()
                : t('naText')
        },
        {
            accessorKey: "endDate",
            header: t('endDateHeader'),
            cell: ({ row }) => row.original.endDate
                ? new Date(row.original.endDate).toLocaleDateString()
                : t('naText')
        },
        {
            accessorKey: "status",
            header: t('statusHeader'),
        }
    ];

    const tableData = useMemo(() => {
        if (!data) return [];

        const actualData = data?.data?.data || data?.data || data;

        if (actualData && !Array.isArray(actualData) && actualData.id) {
            return [actualData];
        }

        if (Array.isArray(actualData)) {
            return actualData;
        }

        return [];
    }, [data]);

    // دالة الإضافة
    const handleAdd = () => {
        navigate('/free-delivery/add');
    };

    // دالة التعديل
    const handleEdit = (row) => {
        const id = row.id || row.menuItemId;
        navigate(id ? `/free-delivery/edit/${id}` : '/free-delivery/edit', { state: { editData: row } });
    };

    return (
        <div className="p-6">
            <GenericDataTable
                title={t('freeDeliveryTitle')}
                columns={columns}
                data={tableData}
                isLoading={isLoading}
                queryKey={queryKey}
                editApiUrl={apiUrl}
                deleteApiUrl={apiUrl}
                deleteWithoutId={true}
                // onAdd={handleAdd}
                onEdit={handleEdit}
            />
        </div>
    );
}