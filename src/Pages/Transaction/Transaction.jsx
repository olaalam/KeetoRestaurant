import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useParams } from 'react-router-dom';
import { Badge } from "@/components/ui/badge"; 
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function Transaction() {
    const { restaurantId } = useParams();
    const { t, isRTL } = useTranslation(); // تفعيل هوك الترجمة ومعرفة الاتجاه الحالي

    // 1. جلب البيانات
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['transactions', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/wallets/transactions`);
            return res.data?.data?.data || [];
        }
    });

    const columns = [
        {
            accessorKey: 'reference',
            header: t('reference')
        },
        {
            accessorKey: 'type',
            header: t('type'),
            cell: ({ row }) => {
                const type = row.original.type;
                // هنا نقوم بتحويل النص مثل (cash_collection) ليطابق مفتاح الترجمة في ملف الـ JSON
                return <span className="capitalize">{t(type.toLowerCase())}</span>;
            }
        },
        {
            accessorKey: 'amount',
            header: t('amount'),
            cell: ({ row }) => {
                const amt = parseFloat(row.original.amount) || 0;
                return (
                    <span className={`font-medium ${amt >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {amt >= 0 ? `+${amt}` : amt} {t('egp')}
                    </span>
                );
            }
        },
        {
            accessorKey: 'balanceBefore',
            header: t('before'),
            cell: ({ getValue }) => `${getValue() || 0} ${t('egp')}`
        },
        {
            accessorKey: 'balanceAfter',
            header: t('after'),
            cell: ({ getValue }) => `${getValue() || 0} ${t('egp')}`
        },
        {
            accessorKey: 'method',
            header: t('method'),
            cell: ({ row }) => {
                const method = row.original.method;
                return <Badge variant="outline" className="rounded-xl font-semibold">{method ? t(method.toLowerCase()) : '—'}</Badge>;
            }
        },
        {
            accessorKey: 'createdAt',
            header: t('date'),
            cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-GB', {
                dateStyle: 'short',
                timeStyle: 'short'
            })
        },
        {
            accessorKey: 'note',
            header: t('note'),
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.note || '—'}</span>
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('walletTransactions')}
                columns={columns}
                data={transactions}
                isLoading={isLoading}
                queryKey="transactions"
                actions={false}
            />
        </div>
    );
}