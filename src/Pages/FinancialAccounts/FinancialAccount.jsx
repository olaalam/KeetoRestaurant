import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";

export default function FinancialAccount() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // جلب بيانات الحسابات المالية وتشكيلها لتتوافق مع مصفوفة الجدول
    const { data: financialAccounts = [], isLoading } = useQuery({
        queryKey: ["financialAccounts"],
        queryFn: async () => {
            const { data } = await api.get("/api/restaurant/FinancialAccount");

            // استخراج المصفوفة الأساسية بناءً على ريسبونس الباك إند المرسل
            const rawAccounts = data?.data || [];

            // تحويل البيانات لفك هيكل الـ account والـ branch وعرضها بشكل مسطح
            return rawAccounts.map(item => ({
                id: item.account?.id,
                name: item.account?.name,
                balance: item.account?.balance,
                isActive: item.account?.isActive,
                in_POS: item.account?.in_POS,
                branchName: item.branch?.name || t('N/A'), // جلب اسم الفرع مباشرة
            }));
        },
    });

    const columns = [
        {
            accessorKey: "name",
            header: t('name'), // اسم الحساب المالي
            // cell: ({ row }) => (
            //     <button
            //         onClick={() => navigate(`/financialAccounts/edit/${row.original.id}`)}
            //         className="text-blue-600 hover:underline font-medium text-left"
            //     >
            //         {row.getValue("name")}
            //     </button>
            // )
        },
        {
            accessorKey: 'balance',
            header: t('balance'), // الرصيد الحالي
            cell: ({ row }) => (
                <span className="font-mono font-bold text-slate-700">
                    {row.getValue("balance")}
                </span>
            )
        },
        {
            accessorKey: 'branchName',
            header: t('branch_id') // اسم الفرع التابع له الحساب
        },
        {
            accessorKey: "in_POS",
            header: t('in_POS'), // هل متاح بنقطة البيع؟
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${row.original.in_POS ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-700'}`}>
                    {row.original.in_POS ? t('Yes') : t('No')}
                </span>
            )
        },
        {
            accessorKey: "isActive",
            header: t('status'), // الحالة (نشط / غير نشط)
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${row.original.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.original.isActive ? t('active') : t('inactive')}
                </span>
            )
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('financialAccountsTitle')}
                columns={columns}
                data={financialAccounts}
                isLoading={isLoading}
                editApiUrl="/api/restaurant/FinancialAccount"
                queryKey="financialAccounts"
                deleteApiUrl="/api/restaurant/FinancialAccount"
                onAdd={() => navigate("/financialAccounts/add")}
                onEdit={(account) => navigate(`/financialAccounts/edit/${account.id}`)}
            />
        </div>
    );
}