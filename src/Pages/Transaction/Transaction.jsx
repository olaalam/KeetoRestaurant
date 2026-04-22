import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useParams } from 'react-router-dom';
import { Badge } from "@/components/ui/badge"; // اختياري لشكل أجمل

export default function Transaction() {
    const { restaurantId } = useParams();

    // 1. جلب البيانات بناءً على هيكلة الريسبونس data.data.data
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['transactions', restaurantId],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/wallets/transactions`);
            // بناءً على الـ JSON: res.data هي الكائن الكبير، جواه data، وجواها data المصفوفة
            return res.data?.data?.data || [];
        }
    });

    const columns = [
        {
            accessorKey: 'reference',
            header: 'Reference'
        },
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => {
                const type = row.original.type;
                // تنسيق النص ليظهر بشكل أفضل (مثال: Cash Collection)
                return <span className="capitalize">{type.replace('_', ' ')}</span>;
            }
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <span className={parseFloat(row.original.amount) >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {row.original.amount}
                </span>
            )
        },
        {
            accessorKey: 'balanceBefore',
            header: 'Before'
        },
        {
            accessorKey: 'balanceAfter',
            header: 'After'
        },
        {
            accessorKey: 'method',
            header: 'Method',
            cell: ({ row }) => <Badge variant="outline">{row.original.method}</Badge>
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('en-GB', {
                dateStyle: 'short',
                timeStyle: 'short'
            })
        },
        {
            accessorKey: 'note',
            header: 'Note',
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.note}</span>
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Wallet Transactions"
                columns={columns}
                data={transactions}
                isLoading={isLoading}
                queryKey="transactions"
                // المعاملات المالية غالباً لا تحذف ولا تعدل يدوياً، لذا نغلق الأكشنز
                actions={false}
            />
        </div>
    );
}