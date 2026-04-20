import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const AdminAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();

    // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
    // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
    const { data: adminData, isLoading: isFetching } = useQuery({
        queryKey: ['admin', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/restaurantadmin/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.adminData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });


    const rawData = state?.adminData || adminData;
    const initialData = rawData ? {
        ...rawData,
        // هنا نستخرج الـ id من كائن role ونضعه في roleId ليطابق اسم الحقل في الفورم
    } : null;
    const adminFields = [
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        { name: 'email', label: 'email', type: 'email', required: true },
        { name: 'phoneNumber', label: 'phoneNumber', required: true },
        // الباسورد يظهر فقط عند الإضافة
        ...(!id ? [{ name: 'password', label: 'password', type: 'password', required: true }] : [])
    ];

    if ((id && isFetching)) return <LoadingSpinner />;
    return (
        <AddPage
            title="admin"
            apiUrl="/api/restaurant/restaurantadmin" // هذا هو الـ Base URL
            queryKey="admins"
            fields={adminFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default AdminAdd;