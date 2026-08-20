import React from 'react';
import AddPage from '@/components/AddPage';
import { useTranslation } from '@/hooks/useTranslation';

export default function UsersAdd({ initialData, onSuccessAction }) {
    const { t } = useTranslation();

    const fields = [
        { name: 'name', label: t('name') || 'Name', type: 'text', required: true },
        { name: 'phone', label: t('phone') || 'Phone', type: 'text', required: true },
        { 
            name: 'status', 
            label: t('status') || 'Status', 
            type: 'select', 
            options: [
                { label: t('active') || 'Active', value: 'active' },
                { label: t('blocked') || 'Blocked', value: 'blocked' }
            ], 
            required: true 
        },
        { name: 'photo', label: t('photo') || 'Photo', type: 'file', required: false }
    ];

    return (
        <AddPage
            title={t('editUser') || 'Edit User'}
            apiUrl={`/api/restaurant/restaurant-users/${initialData?.id}`} 
            queryKey="restaurant-users"
            method="PUT"
            fields={fields}
            initialData={initialData}
            bypassIdInEdit={true}
            onSuccessAction={(res) => {
                onSuccessAction?.(res);
            }}
        />
    );
}