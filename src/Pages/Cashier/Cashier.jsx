import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";

export default function Cashiers() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // جلب بيانات الكاشير وتشكيلها لتتوافق مع الجدول
    const { data: cashiers = [], isLoading } = useQuery({
        queryKey: ['cashiers'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/cashiers');

            // استخراج المصفوفة الأساسية من ريسبونس الباك إند
            const rawData = res.data?.data?.data || [];

            // تحويل وتجهيز البيانات لتبسيط الوصول إليها داخل الجدول
            return rawData.map(item => ({
                ...item.cashiers, // فك حقول الكاشير الأساسية مباشرة (id, name, status, etc.)
                branch_id: item.cashiers.branchid, // تحويل الاسم ليتوافق مع الـ accessorKey القديم إذا لزم الأمر
                financialAccountName: item.FinancialAccounts?.name || t('N/A') // دمج اسم الحساب المالي للعرض
            }));
        }
    });

    const columns = [
        {
            accessorKey: "name",
            header: t('name'), // الاسم بالإنجليزي
            // cell: ({ row }) => (
            //     <button
            //         onClick={() => navigate(`/cashiers/setting/${row.original.id}`)}
            //         className="text-blue-600 hover:underline font-medium text-left"
            //     >
            //         {row.getValue("name")}
            //     </button>
            // )
        },
        {
            accessorKey: 'ar_name',
            header: t('ar_name') // الاسم بالعربي
        },
        {
            accessorKey: 'branch_id', // تم تعديله في الـ map ليقرأ branchid من الباك إند
            header: t('branch_id')
        },
        {
            accessorKey: 'financialAccountName', // عرض اسم الحساب المالي بدلاً من الـ ID فقط ليكون مفهوماً للمستخدم
            header: t('financialAccountId')
        },
        {
            accessorKey: "cashier_active",
            header: t('cashierActive'), // حالة تفعيل الكاشير (True / False)
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${row.original.cashier_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {row.original.cashier_active ? t('active') : t('inactive')}
                </span>
            )
        },
        {
            accessorKey: "status",
            header: t('status'), // الحالة العامة (active / inactive)
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${row.original.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t(row.original.status)}
                </span>
            )
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('cashiersTitle')}
                columns={columns}
                data={cashiers}
                isLoading={isLoading}
                queryKey="cashiers"
                deleteApiUrl="/api/restaurant/cashiers"
                editApiUrl="/api/restaurant/cashiers"
                onAdd={() => navigate("/cashiers/add")}
                onEdit={(cashier) => navigate(`/cashiers/edit/${cashier.id}`)}
            />
        </div>
    );
}