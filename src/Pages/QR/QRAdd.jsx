import React from 'react';
import AddPage from '@/components/AddPage';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

const QRAdd = () => {
    const { t } = useTranslation(); // تفعيل الهوك

    const qrFields = [
        { name: 'restaurantUrl', label: t('restaurantUrl'), required: true }, // ترجمة الـ Label للحقل
    ];

    return (
        <AddPage
            title={t("qrCode")} // عنوان الصفحة معرب ومترجم
            apiUrl="/api/restaurant/restQR"
            fields={qrFields}
            onSuccessAction={() => {
                window.history.back();
            }}
        />
    );
};

export default QRAdd;