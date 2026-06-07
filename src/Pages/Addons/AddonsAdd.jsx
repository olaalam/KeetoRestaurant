import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation"; 

const AddonsAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation(); 

    // 1. Fetch select data (categories)
    const { data: selectData } = useQuery({
        queryKey: ['addonsSelectData'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/addons/select');
            return res.data.data.data;
        }
    });

    const categories = selectData?.allAddons || [];

    // 3. Fetch addon data if editing
    const { data: addonData, isLoading: isFetching } = useQuery({
        queryKey: ['addon', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/addons/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.addonData,
    });

    const initialData = state?.addonData || addonData;

    const fields = [
        { name: 'name', label: t('addonName'), required: true },
        { name: 'nameAr', label: t('addonNameAr'), required: true },
        { name: 'nameFr', label: t('addonNameFr'), required: true },
        { name: 'price', label: t('price'), type: 'number', required: true },
        {
            name: 'stock_type',
            label: t('stockType'),
            type: 'select',
            required: true,
            options: [
                { label: t('unlimited'), value: 'unlimited' },
                { label: t('limited'), value: 'limited' },
                { label: t('daily'), value: 'daily' },
            ]
        },
        {
            name: 'adonescategoryid',
            label: t('addonCategory'),
            type: 'select',
            required: true,
            options: Array.isArray(categories)
                ? categories.map(c => ({ label: c.name, value: c.id }))
                : []
        },
    ];

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title={t('modifier')}
            apiUrl="/api/restaurant/addons"
            queryKey="addons"
            fields={fields}
            initialData={initialData}
            onSuccessAction={(res) => {
                // 💡 التقاط المعرف المحدث أو الجديد وتمريره للجدول الرئيسي
                const targetId = res?.data?.data?.id || res?.data?.id || res?.id || initialData?.id;
                navigate("/addons", { state: { highlightedId: targetId } });
            }}
        />
    );
};

export default AddonsAdd;