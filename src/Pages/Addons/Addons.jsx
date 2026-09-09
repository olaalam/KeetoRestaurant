import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";
import { Pencil, Check, X, Loader2 } from 'lucide-react';

// 💡 مكون خاص بتعديل السعر مباشرة داخل السطر (Inline Editing)
function EditablePriceCell({ row, t }) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [price, setPrice] = useState(row.original.price);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setPrice(row.original.price);
    }, [row.original.price]);

    const handleSave = async (e) => {
        if (e) e.stopPropagation();
        if (price === '' || isNaN(price)) return;

        setLoading(true);
        try {
            await api.put(`/api/restaurant/addons/${row.original.id}`, {
                ...row.original,
                price: Number(price)
            });
            await queryClient.invalidateQueries(['addons']);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating price:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (e) => {
        if (e) e.stopPropagation();
        setPrice(row.original.price);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-20 px-2 py-1 text-sm border border-primary/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(e);
                        if (e.key === 'Escape') handleCancel(e);
                    }}
                />
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                ) : (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleSave}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title={t('save', { defaultValue: 'Save' })}
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title={t('cancel', { defaultValue: 'Cancel' })}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group">
            <span className="font-medium">{row.getValue('price')} {t('currency')}</span>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setPrice(row.original.price);
                    setIsEditing(true);
                }}
                className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                title={t('edit', { defaultValue: 'Edit' })}
            >
                <Pencil className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export default function Addons() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const [highlightedId, setHighlightedId] = useState(null);

    useEffect(() => {
        if (location.state?.highlightedId) {
            setHighlightedId(location.state.highlightedId);

            const timer = setTimeout(() => {
                setHighlightedId(null);
                navigate(location.pathname, { replace: true, state: {} });
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [location.state, navigate, location.pathname]);

    const { data: addons = [], isLoading } = useQuery({
        queryKey: ['addons'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/addons');
            return res.data.data.data;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('addonName') },
        { accessorKey: 'nameAr', header: t('addonNameAr') },
        { accessorKey: 'nameFr', header: t('addonNameFr') },
        { 
            accessorKey: 'price', 
            header: t('price'),
            cell: ({ row }) => <EditablePriceCell row={row} t={t} />
        },
        { 
            accessorKey: 'stock_type', 
            header: t('stockType'),
            cell: ({ row }) => t(row.getValue('stock_type')) 
        },
        {
            accessorKey: 'adonescategory.name',
            header: t('category'),
            cell: ({ row }) => row.original.adonescategory?.name || t('na')
        },
        {
            accessorKey: 'status',
            header: t('status'),
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t('modifier')}
                columns={columns}
                data={addons}
                isLoading={isLoading}
                queryKey="addons"
                editApiUrl="/api/restaurant/addons"
                deleteApiUrl="/api/restaurant/addons"
                onAdd={() => navigate("/addons/add")}
                onEdit={(addon) => navigate(`/addons/edit/${addon.id}`)}
                highlightedId={highlightedId}
            />
        </div>
    );
}