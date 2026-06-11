import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Setting() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // تفعيل الهوك

    const { data: setting = [], isLoading } = useQuery({
        queryKey: ['setting'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurantsetting');
            // الريسبونس يحتوي على settings كـ Object، نضعه داخل Array ليناسب الجدول
            return [res.data.data.settings]; 
        }
    });

    const columns = [
        {
            accessorKey: "foodManagement",
            header: "Food Management",
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 rounded text-xs ${getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {getValue() ? "Enabled" : "Disabled"}
                </span>
            )
        },
        {
            accessorKey: "scheduledDelivery",
            header: "Scheduled Delivery",
            cell: ({ getValue }) => getValue() ? "Yes" : "No"
        },
        {
            accessorKey: "reviewsSection",
            header: "Reviews",
            cell: ({ getValue }) => getValue() ? "Visible" : "Hidden"
        },
        {
            accessorKey: "posSection",
            header: "POS",
            cell: ({ getValue }) => getValue() ? "Active" : "Inactive"
        },
        {
            accessorKey: "homeDelivery",
            header: "Home Delivery",
            cell: ({ getValue }) => getValue() ? "Available" : "N/A"
        },
        {
            accessorKey: "minOrderAmount",
            header: "Min Order",
            cell: ({ getValue }) => `${getValue()} EGP`
        },
        {
            header: "Delivery Time",
            cell: ({ row }) => `${row.original.minDeliveryTime} - ${row.original.maxDeliveryTime} min`
        },
        {
            accessorKey: "vegType",
            header: "Vegetarian Type"
        },
        {
            accessorKey: "dineIn",
            header: "Dine In",
            cell: ({ getValue }) => getValue() ? "Yes" : "No"
        }
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("restaurantSetting")}
                columns={columns}
                data={setting} // تم تعديلها من slider إلى setting
                isLoading={isLoading}
                queryKey="setting"
                editApiUrl="/api/restaurant/restaurantsetting"
                onEdit={(settingItem) => navigate(`/setting/edit/${settingItem.id}`)} // تفعيل الـ Edit فقط
            />
        </div>
    );
}