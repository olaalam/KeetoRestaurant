import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";

export default function OrderSetting() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // جلب البيانات واستخراج orderNowSetting
    const { data: setting = [], isLoading } = useQuery({
        queryKey: ['setting'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurantsetting/order-now');
            const orderNowData = res.data?.data?.orderNowSetting || res.data?.data?.order_now_setting || res.data?.data || {};

            return [orderNowData];
        }
    });

    // دالة مساعدة لعرض الحالة (مفعل / معطل) بألوان وستايل متناسق
    const renderStatusBadge = (value) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {value ? t("enabled", { defaultValue: "Enabled" }) : t("disabled", { defaultValue: "Disabled" })}
        </span>
    );

    // جميع حقول orderNowSetting مقسمة على أعمدة مباشرة
    const columns = [
        {
            accessorKey: "hotline",
            header: t("hotlineLabel", { defaultValue: "Hotline" }),
            cell: ({ getValue }) => renderStatusBadge(getValue())
        },
        {
            accessorKey: "branches",
            header: t("branchesLabel", { defaultValue: "Branches" }),
            cell: ({ getValue }) => renderStatusBadge(getValue())
        },
        {
            accessorKey: "name",
            header: t("nameLabel", { defaultValue: "Name" }),
            cell: ({ getValue }) => renderStatusBadge(getValue())
        },
        {
            accessorKey: "orderNow",
            header: t("orderNowLabel", { defaultValue: "Order Now" }),
            cell: ({ getValue }) => renderStatusBadge(getValue())
        },
        {
            accessorKey: "eMenu",
            header: t("eMenuLabel", { defaultValue: "E-Menu" }),
            cell: ({ getValue }) => renderStatusBadge(getValue())
        },
        {
            accessorKey: "socialMedia",
            header: t("socialMediaLabel", { defaultValue: "Social Media" }),
            cell: ({ getValue }) => renderStatusBadge(getValue())
        },
        {
            accessorKey: "menuPdf",
            header: t("menuPdfLabel", { defaultValue: "Menu PDF" }),
            cell: ({ getValue }) => renderStatusBadge(getValue())
        },
        {
            accessorKey: "iosIcon",
            header: t("iosIconLabel", { defaultValue: "iOS Icon" }),
            cell: ({ getValue }) => renderStatusBadge(getValue())
        },
        {
            accessorKey: "androidIcon",
            header: t("androidIconLabel", { defaultValue: "Android Icon" }),
            cell: ({ getValue }) => renderStatusBadge(getValue())
        }
    ];

    return (
        <div className="container mx-auto py-2 relative">
            <GenericDataTable
                title={t("orderNowSettingsTitle", { defaultValue: "Order Now Settings" })}
                columns={columns}
                data={setting}
                isLoading={isLoading}
                queryKey="order-setting"
                editApiUrl="/api/restaurant/restaurantsetting/order-now"
                onEdit={() => navigate(`/order-setting/edit/1`)}
            />
        </div>
    );
}