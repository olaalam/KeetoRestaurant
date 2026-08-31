import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Wallet } from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';

export default function WalletPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: wallets = [], isLoading } = useQuery({
        queryKey: ['wallets'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/wallets');
            return res.data.data.data;
        }
    });

    const columns = [
        {
            accessorKey: "restaurant.name",
            header: t('restaurantNameHeader'),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`/restaurants/setting/${row.original.restaurant_id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {row.getValue("restaurant.name")}
                </button>
            )
        },
        {
            accessorKey: "balance",
            header: t('balanceHeader'),
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">
                    {row.getValue("balance")} E£
                </span>
            )
        },
        {
            accessorKey: "pending_withdraw",
            header: t('pendingWithdrawHeader'),
            cell: ({ row }) => (
                <span className="text-orange-600">
                    {row.getValue("pending_withdraw")} E£
                </span>
            )
        },
        {
            accessorKey: "total_withdrawn",
            header: t('totalWithdrawnHeader'),
            cell: ({ row }) => (
                <span className="text-red-600">
                    {row.getValue("total_withdrawn")} E£
                </span>
            )
        },
        {
            accessorKey: "total_earning",
            header: t('totalEarningHeader'),
            cell: ({ row }) => (
                <span className="text-blue-600">
                    {row.getValue("total_earning")} E£
                </span>
            )
        },
        {
            accessorKey: "status",
            header: t('statusHeader'),
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${row.original.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.original.status}
                </span>
            )
        },
        {
            id: "actions",
            header: t('actionsCol'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/wallet/restaurant/${row.original.restaurant_id}`)}
                        className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
                    >
                        <Wallet size={16} />
                        {t('viewWalletBtn')}
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('walletsTitle')}
                columns={columns}
                data={wallets}
                isLoading={isLoading}
                queryKey="wallets"
                onEdit={false}
            />
        </div>
    );
}