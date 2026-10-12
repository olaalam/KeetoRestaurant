import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useTranslation } from '@/hooks/useTranslation';
import { useGet } from '@/hooks/useGet';

export default function FreeDeliveryAdd() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // قراءة الـ id من الـ URL
    const { t } = useTranslation();

    const baseUrl = "/api/restaurant/free-delivery";

    // جلب البيانات برقم الـ ID فقط عند وجود id
    const { data: fetchedData, isLoading } = useGet(
        `free-delivery`,
        id ? `${baseUrl}` : baseUrl,
        
    );

    // الأولوية لبيانات الـ API المجلوبة ثم الممررة من Navigate
    const apiData = fetchedData?.data?.data || fetchedData?.data || fetchedData;
    const initialData = apiData || location.state?.editData || location.state?.initialData || null;

    const fields = [
        {
            name: 'minOrderAmount',
            label: t('minOrderAmount'),
            type: 'number',
            required: true
        },
        {
            name: 'maxOrdersPerUser',
            label: t('maxOrdersPerUser'),
            type: 'number',
            required: true
        },
        {
            name: 'startDate',
            label: t('startDate'),
            type: 'date',
            required: true
        },
        {
            name: 'endDate',
            label: t('endDate'),
            type: 'date',
            required: true
        },
        {
            name: 'status',
            label: t('status'),
            type: 'select',
            options: [
                { label: t('active'), value: 'active' },
                { label: t('inactive'), value: 'inactive' }
            ],
            required: true
        }
    ];

    if (id && isLoading) {
        return <div className="p-6 text-center">{t('loading') || 'جاري التحميل...'}</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
<AddPage
    title={t('freeDeliverySettings')}
    apiUrl={id ? `${baseUrl}` : baseUrl}
    queryKey="free-delivery-list"
    method="POST"
    fields={fields}
    initialData={initialData}
    transformPayload={(data) => ({
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
    })}
    onSuccessAction={() => navigate('/free-delivery')}
/>
        </div>
    );
}