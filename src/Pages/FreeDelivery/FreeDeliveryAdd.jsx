import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useTranslation } from '@/hooks/useTranslation';

export default function FreeDeliveryAdd() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const initialData = location.state?.initialData || null;

    const fields = [
        {
            name: 'minOrderAmount',
            label: t('minOrderAmountHeader'),
            type: 'number',
            required: true
        },
        {
            name: 'startDate',
            label: t('startDateHeader'),
            type: 'date',
            required: true
        },
        {
            name: 'endDate',
            label: t('endDateHeader'),
            type: 'date',
            required: true
        },
        {
            name: 'status',
            label: t('statusHeader'),
            type: 'select',
            options: [
                { label: t('active'), value: 'active' },
                { label: t('inactive'), value: 'inactive' }
            ],
            required: true
        }
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <AddPage
                title={t('freeDeliverySettings')}
                apiUrl="/api/restaurant/free-delivery"
                queryKey="free-delivery-list"
                method={initialData ? 'PUT' : 'POST'}
                fields={fields}
                initialData={initialData}
                onSuccessAction={() => navigate('/free-delivery')}
            />
        </div>
    );
}