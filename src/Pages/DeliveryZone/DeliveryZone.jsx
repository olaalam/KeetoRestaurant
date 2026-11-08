import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Building2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function DeliveryZone() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [highlightedId, setHighlightedId] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState('all');

    const savedSize = localStorage.getItem("tablePageSize");
    const initialPageSize = savedSize ? Number(savedSize) : 15;

    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: initialPageSize });

    // 💡 جلب اللغة الحالية من الـ Local Storage
    const getLanguage = () => {
        try {
            const keetoLang = localStorage.getItem('keeto-language');
            if (keetoLang) {
                const parsed = JSON.parse(keetoLang);
                return parsed?.state?.language || 'en';
            }
        } catch (e) {
            console.error("Error parsing language from localStorage", e);
        }
        return 'en';
    };

    const isArabic = getLanguage() === 'ar';

    // 1. جلب بيانات مناطق التوصيل
    const { data: deliveryFees = [], isLoading } = useQuery({
        queryKey: ['DeliveryZone'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurant-zone-delivery-fees');
            return res.data?.data?.data || [];
        }
    });

    // 💡 استخراج الفروع الفريدة لتعبئة قائمة الفلتر تلقائياً
    const branches = useMemo(() => {
        const branchMap = new Map();
        deliveryFees.forEach(item => {
            if (item.branch) {
                const branchName = isArabic && item.branch.nameAr ? item.branch.nameAr : (item.branch.name || 'N/A');
                branchMap.set(item.branchId, {
                    id: item.branchId,
                    name: branchName
                });
            }
        });
        return Array.from(branchMap.values());
    }, [deliveryFees, isArabic]);

    // 💡 تصفية البيانات بناءً على الفرع المحدد
    const filteredDeliveryFees = useMemo(() => {
        if (selectedBranch === 'all') return deliveryFees;
        return deliveryFees.filter(item => String(item.branchId) === String(selectedBranch));
    }, [deliveryFees, selectedBranch]);

    useEffect(() => {
        if (location.state?.highlightedId && deliveryFees.length) {
            const sortedDeliveryFees = [...deliveryFees].sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bTime - aTime;
            });

            const index = sortedDeliveryFees.findIndex(item => String(item.id) === String(location.state.highlightedId));

            if (index !== -1) {
                const pageIndex = Math.floor(index / pagination.pageSize);
                setPagination(prev => ({ ...prev, pageIndex }));
                setHighlightedId(location.state.highlightedId);

                const timer = setTimeout(() => {
                    setHighlightedId(null);
                    navigate(location.pathname, { replace: true, state: {} });
                }, 3500);

                return () => clearTimeout(timer);
            }
        }
    }, [location.state, deliveryFees, pagination.pageSize, navigate, location.pathname]);

    // 2. تعريف الأعمدة (شملت عمود الفرع Branch Column)
    const columns = [
        {
            id: 'branch',
            header: isArabic ? 'الفرع' : 'Branch',
            accessorFn: (row) => `${row.branch?.name || ''} ${row.branch?.nameAr || ''}`,
            cell: ({ row }) => {
                const branch = row.original.branch;
                const branchName = isArabic && branch?.nameAr ? branch.nameAr : (branch?.name || 'N/A');
                return (
                    <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        <span className="font-medium">{branchName}</span>
                    </div>
                );
            }
        },
        {
            id: 'city',
            header: t('cityname'),
            accessorFn: (row) => `${row.city?.name || ''} ${row.city?.nameAr || ''}`,
            cell: ({ row }) => {
                const city = row.original.city;
                return <span>{isArabic && city?.nameAr ? city.nameAr : (city?.name || 'N/A')}</span>;
            }
        },
        {
            id: 'zone',
            header: t('zoneName'),
            accessorFn: (row) => `${row.zone?.name || ''} ${row.zone?.nameAr || ''}`,
            cell: ({ row }) => {
                const zone = row.original.zone;
                const zoneName = isArabic && zone?.nameAr ? zone.nameAr : (zone?.name || 'N/A');
                return (
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="font-medium">{zoneName}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'deliveryFee',
            header: t('deliveryFee'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1 font-semibold text-green-600">
                    <span>{row.original.deliveryFee} EGP</span>
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: t('status'),
        },
    ];

    return (
        <div className="container mx-auto py-2">
            {/* 💡 فلتر الفروع (Filter by Branch Dropdown) */}
            <div className="mb-4 flex items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isArabic ? 'تصفية حسب الفرع:' : 'Filter by Branch:'}
                </label>
                <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="all">{isArabic ? 'جميع الفروع' : 'All Branches'}</option>
                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name}
                        </option>
                    ))}
                </select>
            </div>

            <GenericDataTable
                title={t('deliveryFees')}
                columns={columns}
                data={filteredDeliveryFees}
                isLoading={isLoading}
                queryKey="DeliveryZone"
                deleteApiUrl="/api/restaurant/restaurant-zone-delivery-fees"
                editApiUrl="/api/restaurant/restaurant-zone-delivery-fees"
                highlightedId={highlightedId}
                pagination={pagination}
                setPagination={setPagination}
                onAdd={() => navigate("/delivery-zones/add")}
                onEdit={(item) => navigate(`/delivery-zones/edit/${item.id}`, { state: { DeliveryZoneData: item } })}
            />
        </div>
    );
}