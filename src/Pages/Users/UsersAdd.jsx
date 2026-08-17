import React from 'react';
import AddPage from '@/components/AddPage'; //[cite: 6]
import { useTranslation } from '@/hooks/useTranslation';

export default function UsersAdd({ initialData, onSuccessAction }) {
    const { t } = useTranslation();

    const fields = [
        { name: 'name', label: t('name'), type: 'text', required: true },
        { name: 'phone', label: t('phone'), type: 'text', required: true },
        { 
            name: 'status', 
            label: t('status'), 
            type: 'select', 
            options: [
                { label: t('active'), value: 'active' },
                { label: t('inactive'), value: 'inactive' }
            ], 
            required: true 
        },
        { name: 'photo', label: t('photo'), type: 'file', required: false }
    ];

    return (
        <AddPage
            title={t('editUser')}
            // الرابط هنا سيصبح: /api/restaurant/restaurant-users/8846fb00...
            apiUrl={`/api/restaurant/restaurant-users/${initialData.id}`} 
            queryKey="restaurant-users"
            method="PUT"
            fields={fields}
            initialData={initialData}
            bypassIdInEdit={true} //[cite: 7]
            onSuccessAction={(res) => {
                onSuccessAction?.(res); // إغلاق الـ Dialog بعد الحفظ
            }}
        />
    );
}