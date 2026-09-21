import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { Eye, Store } from 'lucide-react';
import BundleItemsDialog from './BundleItemsDialog';
import { useTranslation } from '@/hooks/useTranslation';

export default function Bundles() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    
    const [dialogState, setDialogState] = useState({ isOpen: false, bundleId: null, type: null });

    const { data: bundles = [], isLoading } = useQuery({
        queryKey: ['bundles'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/pos/bundles');
            const result = res.data?.data?.data ?? res.data?.data ?? [];
            return Array.isArray(result) ? result : [];
        }
    });

    const openItemsDialog = (bundleId, type) => {
        setDialogState({ isOpen: true, bundleId, type });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const columns = [
        { accessorKey: 'name', header: 'Name' },
        {
            accessorKey: 'image',
            header: 'Image',
            cell: ({ row }) => (
                row.original.image ? (
                    <img src={row.original.image} alt={row.original.name} className="w-10 h-10 object-cover rounded-md border" />
                ) : (
                    <span>-</span>
                )
            )
        },
        {
            accessorKey: 'branches', 
            header: 'Branches', 
            cell: ({ row }) => (
                <button
                    onClick={() => openItemsDialog(row.original.id, 'branches')} 
                    className="flex items-center justify-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors mx-auto"
                >
                    <Store size={16} />
                    {t('viewBranches') || 'Branches'}
                </button>
            )
        },
        {
            accessorKey: 'foods', 
            header: 'Foods', 
            cell: ({ row }) => (
                <button
                    onClick={() => openItemsDialog(row.original.id, 'foods')} 
                    className="flex items-center justify-center gap-1 px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 transition-colors mx-auto"
                >
                    <Eye size={16} />
                    {t('viewFoods') || 'Foods'}
                </button>
            )
        },
        { accessorKey: 'price', header: 'Price' },
        { 
            accessorKey: 'module', 
            header: 'Modules',
            cell: ({ row }) => {
                const mods = row.original.module || [];
                return Array.isArray(mods) ? mods.map(m => m.toUpperCase()).join(', ') : mods;
            }
        },
        { accessorKey: 'startDate', header: 'Start Date', cell: (info) => formatDate(info.getValue()) },
        { accessorKey: 'endDate', header: 'End Date', cell: (info) => formatDate(info.getValue()) },
        { accessorKey: 'status', header: 'Status' }
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Bundles"
                columns={columns}
                data={bundles}
                isLoading={isLoading}
                queryKey="bundles"
                deleteApiUrl="/api/restaurant/pos/bundles"
                editApiUrl="/api/restaurant/pos/bundles" 
                onAdd={() => navigate("/bundle/add")}
onEdit={(bundle) => navigate(`/bundle/edit/${bundle.id}`)}
            />
            
            {dialogState.isOpen && (
                <BundleItemsDialog
                    isOpen={dialogState.isOpen}
                    bundleId={dialogState.bundleId}
                    type={dialogState.type}
                    onClose={() => setDialogState({ isOpen: false, bundleId: null, type: null })}
                />
            )}
        </div>
    );
}