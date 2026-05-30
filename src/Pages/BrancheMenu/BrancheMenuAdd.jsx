import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد الهوك

const BrancheMenuAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const { t } = useTranslation(); // تفعيل الهوك

    // جلب البيانات (Branches & Foods)
    const { data: selectData, isLoading: isSelectDataLoading } = useQuery({
        queryKey: ['branchemenu-select-data'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/branchemenu/select-data');
            return res.data?.data?.data || { branches: [], foods: [] };
        }
    });

    const { data: branchemenu, isLoading: isFetching } = useQuery({
        queryKey: ['branchemenu', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/branchemenu/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.branchemenu,
    });

    const rawData = state?.branchemenu || branchemenu;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;
        return {
            ...rawData,
            branchId: rawData.branchId || rawData.branch?.id,
            foodId: rawData.foodId || rawData.food?.id
        };
    }, [rawData]);

    const brancheMenuFields = [
        {
            name: 'branchId',
            label: t('branch'),
            required: true,
            type: 'select',
            options: (selectData?.branches || []).map(b => ({
                value: String(b.id),
                label: b.name
            }))
        },
        {
            name: 'foodId',
            label: t('food'),
            required: true,
            type: 'select',
            options: (selectData?.foods || []).map(f => ({
                value: String(f.id),
                label: f.name
            }))
        },
        { name: 'price', label: t('price'), type: 'number', required: true },
        {
            name: 'stockType',
            label: t('stockType'),
            type: 'select',
            options: [
                { label: t('unlimited'), value: 'unlimited' },
                { label: t('limited'), value: 'limited' },
                { label: t('daily'), value: 'daily' }
            ],
            required: true
        },
        { name: 'stockQty', label: t('stockQty'), type: 'number', required: true },
        {
            name: 'status',
            label: t('status'),
            type: 'select',
            options: [
                { value: 'active', label: t('active') },
                { value: 'inactive', label: t('inactive') }
            ],
            required: true
        },
    ];

    if ((id && isFetching) || isSelectDataLoading) return <LoadingSpinner />;

    return (
        <AddPage
            title={t("branchMenu")}
            apiUrl="/api/restaurant/branchemenu"
            queryKey="branchemenu"
            fields={brancheMenuFields}
            initialData={initialData}
            onSuccessAction={() => window.history.back()}
        />
    );
};

export default BrancheMenuAdd;