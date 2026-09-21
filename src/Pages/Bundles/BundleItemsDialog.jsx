import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';

export default function BundleItemsDialog({ isOpen, onClose, bundleId, type }) {
    const { t } = useTranslation();

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['bundle-items', bundleId, type],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/pos/bundles/${bundleId}/${type}`);
            return res.data?.data?.data ?? res.data?.data ?? [];
        },
        enabled: !!bundleId && isOpen
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-[90%] max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>
                
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 capitalize">
                    {type === 'foods' ? t('foodsList') || 'Foods List' : t('branchesList') || 'Branches List'}
                </h3>
                
                <div className="max-h-80 overflow-y-auto">
                    {isLoading ? (
                        <div className="py-10 flex justify-center"><LoadingSpinner /></div>
                    ) : items.length > 0 ? (
                        <ul className="space-y-2">
                            {items.map((item, idx) => (
                                <li key={item.id || idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                                    {item.image || item.logo ? (
                                        <img src={item.image || item.logo} alt="item" className="w-10 h-10 rounded-md object-cover" />
                                    ) : null}
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                        {item.name || item.nameAr || "Unnamed Item"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-slate-500 py-6">{t('noDataFound') || 'No items found.'}</p>
                    )}
                </div>
            </div>
        </div>
    );
}