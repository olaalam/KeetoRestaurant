import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage'; // تأكدي من مسار الاستيراد

export default function FreeDeliveryAdd() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // جلب البيانات في حالة التعديل من الـ route state
    const initialData = location.state?.initialData || null;

    // تجهيز الحقول التي يحتاجها مكون AddPage
    const fields = [
        {
            name: 'minOrderAmount',
            label: 'Min Order Amount',
            type: 'number',
            required: true
        },
        {
            name: 'startDate',
            label: 'Start Date',
            type: 'date',
            required: true
        },
        {
            name: 'endDate',
            label: 'End Date',
            type: 'date',
            required: true
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' }
            ],
            required: true
        }
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <AddPage
                title="Free Delivery Settings"
                apiUrl="/api/restaurant/free-delivery"
                queryKey="free-delivery-list"
                method={initialData ? 'PUT' : 'POST'}
                fields={fields}
                initialData={initialData}
                // العودة لصفحة العرض بمجرد نجاح العملية
                onSuccessAction={() => navigate('/free-delivery')}
            />
        </div>
    );
}