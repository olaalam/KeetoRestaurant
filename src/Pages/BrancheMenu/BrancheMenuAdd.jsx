import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const BrancheMenuAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();

    // جلب البيانات (Branches & Foods)
    const { data: selectData, isLoading: isSelectDataLoading } = useQuery({
        queryKey: ['branchemenu-select-data'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/branchemenu/select-data');
            // الوصول للبيانات بناءً على هيكلة الـ JSON المرسلة
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
            label: 'Branch',
            required: true,
            type: 'select',
            // استدعاء الفروع من selectData
            options: (selectData?.branches || []).map(b => ({
                value: String(b.id),
                label: b.name
            }))
        },
        {
            name: 'foodId',
            label: 'Food',
            required: true,
            type: 'select',
            // استدعاء الأطعمة من selectData
            options: (selectData?.foods || []).map(f => ({
                value: String(f.id),
                label: f.name
            }))
        },
        { name: 'price', label: 'Price', type: 'number', required: true },
        {
            name: 'stockType',
            label: 'Stock Type',
            type: 'select',
            options: [
                { label: 'Unlimited', value: 'unlimited' },
                { label: 'Limited', value: 'limited' },
                { label: 'Daily', value: 'daily' }
            ],
            required: true
        },
        { name: 'stockQty', label: 'Stock Qty', type: 'number', required: true },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
            ],
            required: true
        },
    ];

    // التحقق من حالة التحميل (تم حذف isFoodsLoading لأنه مدمج في isSelectDataLoading)
    if ((id && isFetching) || isSelectDataLoading) return <LoadingSpinner />;

    return (
        <AddPage
            title="Branch Menu"
            apiUrl="/api/restaurant/branchemenu"
            queryKey="branchemenu"
            fields={brancheMenuFields}
            initialData={initialData}
            onSuccessAction={() => window.history.back()}
        />
    );
};

export default BrancheMenuAdd;