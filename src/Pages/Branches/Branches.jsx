import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import FoodListDialog from './FoodListDialog';
import { useTranslation } from "@/hooks/useTranslation";

export default function Restaurant() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const openFoodDialog = (restaurantId) => {
        setSelectedRestaurant(restaurantId);
        setIsDialogOpen(true);
    };

    const { data: branches = [], isLoading } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/branches');
            return res.data.data.data;
        }
    });

    const columns = [
        {
            accessorKey: "name",
            header: t('branchName'),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`/branches/setting/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {row.getValue("name")}
                </button>
            )
        },
        { accessorKey: 'nameAr', header: t('nameAr') },
        { accessorKey: 'nameFr', header: t('nameFr') },
        {
            accessorKey: "logo",
            header: t('logo'),
            cell: ({ row }) => (
                <div className="w-10 h-10 border rounded-full overflow-hidden">
                    <img src={row.getValue("logo")} alt="logo" className="w-full h-full object-cover" />
                </div>
            )
        },
        { accessorKey: "zone.name", header: t('zoneColumn') },
        {
            accessorKey: "view_food",
            header: t('foodMenuColumn'),
            cell: ({ row }) => (
                <button
                    onClick={() => openFoodDialog(row.original.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors"
                >
                    <Eye size={16} />
                    {t('viewFood')}
                </button>
            )
        },
        {
            accessorKey: "branch_menu",
            header: t('branchMenuColumn'),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`branch_menu/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {t('branchMenuColumn')}
                </button>
            )
        },
        {
            accessorKey: "transaction",
            header: t('transactionColumn'),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`transaction/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {t('transactionColumn')}
                </button>
            )
        },
        {
            accessorKey: "wallet",
            header: t('walletColumn'),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`wallet/${row.original.id}`)}
                    className="text-blue-600 hover:underline font-medium text-left"
                >
                    {t('walletColumn')}
                </button>
            )
        },
        {
            accessorKey: "status",
            header: t('status'),
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
                title={t('branchesTitle')}
                columns={columns}
                data={branches}
                isLoading={isLoading}
                queryKey="branches"
                deleteApiUrl="/api/restaurant/branches"
                onAdd={() => navigate("/branches/add")}
                onEdit={(branch) => navigate(`/branches/edit/${branch.id}`)}
            />
            {isDialogOpen && (
                <FoodListDialog
                    restaurantId={selectedRestaurant}
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                />
            )}
        </div>
    );
}