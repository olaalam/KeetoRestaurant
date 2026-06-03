import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Setting() {
    const navigate = useNavigate();
    const { id } = useParams(); 
    const { t } = useTranslation(); // تفعيل هوك الترجمة

    const { data: settings = [], isLoading } = useQuery({
        queryKey: ['restaurant-settings', id],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/restaurantsetting`);
            const settingsData = res.data?.data?.settings;
            return settingsData ? [settingsData] : [];
        },
        enabled: !!id 
    });

    const columns = [
        {
            accessorKey: "foodManagement",
            header: t("foodManagement"),
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 rounded-xl text-xs font-semibold ${getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {getValue() ? t("enabled") : t("disabled")}
                </span>
            )
        },
        {
            accessorKey: "scheduledDelivery",
            header: t("scheduledDelivery"),
            cell: ({ getValue }) => getValue() ? t("yes") : t("no")
        },
        {
            accessorKey: "reviewsSection",
            header: t("reviews"),
            cell: ({ getValue }) => getValue() ? t("visible") : t("hidden")
        },
        {
            accessorKey: "posSection",
            header: t("pos"),
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 rounded-xl text-xs font-semibold ${getValue() ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {getValue() ? t("active") : t("inactive")}
                </span>
            )
        },
        {
            accessorKey: "homeDelivery",
            header: t("homeDelivery"),
            cell: ({ getValue }) => getValue() ? t("available") : t("na")
        },
        {
            accessorKey: "minOrderAmount",
            header: t("minOrder"),
            cell: ({ getValue }) => `${getValue()} ${t("egp")}`
        },
        {
            header: t("deliveryTime"),
            cell: ({ row }) => `${row.original.minDeliveryTime} - ${row.original.maxDeliveryTime} ${t("min")}`
        },
        {
            accessorKey: "vegType",
            header: t("vegetarianType"),
            cell: ({ getValue }) => getValue() ? t(getValue()) : "—" // لترجمة نوع النباتي إن وجد
        },
        {
            accessorKey: "dineIn",
            header: t("dineIn"),
            cell: ({ getValue }) => getValue() ? t("yes") : t("no")
        }
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("restaurantSettings")}
                columns={columns}
                data={settings} 
                isLoading={isLoading}
                queryKey={['restaurant-settings', id]}
                actions={true}
                // بما أن هذه صفحة عرض إعدادات فريدة، لا نحتاج لزر حذف (أرسلي الرابط null أو احذفيه لكي لا تظهر أيقونة الحذف)
                deleteApiUrl={null} 
                onEdit={() => navigate(`/branches/setting/edit/${id}`)}
            />
        </div>
    );
}