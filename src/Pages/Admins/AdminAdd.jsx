import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const AdminAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();

    const { data: adminData, isLoading: isFetching } = useQuery({
        queryKey: ['admin', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/restaurantadmin/${id}`);
            return data.data.data;
        },
        enabled: !!id && !state?.adminData,
    });

    const { data: branches = [], isLoading: isBranchesLoading } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const { data } = await api.get('/api/restaurant/branches');
            return data.data.data;
        },
    });

    const rawData = state?.adminData || adminData;
    const initialData = rawData ? { ...rawData } : null;

    // ✅ Use "none" string instead of empty string
    const branchOptions = [
        { value: 'none', label: 'None' },
        ...branches.map((branch) => ({
            value: branch.id,
            label: branch.name,
        })),
    ];

    const adminFields = [
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        { name: 'email', label: 'email', type: 'email', required: true },
        { name: 'phoneNumber', label: 'phoneNumber', required: true },
        ...(!id ? [{ name: 'password', label: 'password', type: 'password', required: true }] : []),
        {
            name: 'branchId',
            label: 'Branch Permission',
            type: 'select',
            required: false,
            options: branchOptions,
            // ✅ Convert "none" back to null before sending to API
            transform: (value) => (value === 'none' ? null : value),
        },
    ];

    if (id && isFetching) return <LoadingSpinner />;
    if (isBranchesLoading) return <LoadingSpinner />;

    return (
        <AddPage
            title="admin"
            apiUrl="/api/restaurant/restaurantadmin"
            queryKey="admins"
            fields={adminFields}
            initialData={initialData}
            onSuccessAction={() => window.history.back()}
        />
    );
};

export default AdminAdd;