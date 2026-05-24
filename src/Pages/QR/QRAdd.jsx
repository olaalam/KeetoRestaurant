import React from 'react';
import AddPage from '@/components/AddPage';
const QRAdd = () => {
    const qrFields = [
        { name: 'restaurantUrl', label: 'restaurantUrl', required: true },
    ];



    return (
        <AddPage
            title="qr"
            apiUrl="/api/restaurant/restQR" // هذا هو الـ Base URL
            fields={qrFields}
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default QRAdd;