import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import AddPage from '@/components/AddPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import MapComponent from '@/components/MapComponent';
import { useTranslation } from "@/hooks/useTranslation";

const RestaurantAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isEdit = !!id;

    const { data: zones = [], isLoading: isLoadingSelect } = useQuery({
        queryKey: ['branchSelectData'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/branches/zone');
            return res.data.data.data || [];
        }
    });

    const { data: fetchedData, isLoading: isFetching } = useQuery({
        queryKey: ['branch', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/branches/${id}`);
            const raw = data.data.data;
            return {
                ...raw,
                cuisineId: String(raw.cuisineId),
                zoneId: String(raw.zoneId),
                tags: Array.isArray(raw.tags) ? raw.tags.join(', ') : raw.tags,
            };
        },
        enabled: !!id && !state?.branchData,
    });

    const initialData = state?.branchData || fetchedData;

    if (id && (isFetching || isLoadingSelect)) return <LoadingSpinner />;

    const fields = [
        { name: 'name', label: t('branchName'), required: true },
        { name: 'nameAr', label: t('nameAr'), required: true },
        { name: 'nameFr', label: t('nameFr'), required: true },
        { name: 'phoneNumber', label: t('phoneNumberLabel'), type: 'text', required: true },
        
        { name: 'address', label: t('addressLabel'), type: 'text', required: true },
        {
            name: 'zoneId',
            label: t('zone'),
            type: 'select',
            required: true,
            options: zones.map(z => ({
                label: z.name,
                value: z.id
            }))
        },
    ];

    return (
        <AddPage
            title={t('branchTitle')}
            apiUrl="/api/restaurant/branches"
            queryKey="branches"
            fields={fields}
            initialData={initialData}
            onSuccessAction={() => navigate(-1)}
        />
    );
};

export default RestaurantAdd;