import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';

const ImageAdd = () => {
    const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
    const { state } = useLocation();
    const { data: imageData, isLoading: isFetching } = useQuery({
        queryKey: ['image', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/cities/${id}`);
            console.log(data.data.data);
            return data.data.data;
        },
        enabled: !!id && !state?.imageData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
    });

    const rawData = state?.imageData || imageData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;

        return {
            ...rawData,
            // هنا بنخرج الـ id من جوه كائن الـ country ونحطه في countryId 
            // عشان الـ AddPage والـ Select يحسوا بيه
            countryId: rawData.countryId || rawData.country?.id
        };
    }, [rawData]);
    console.log("Initial Data sent to AddPage:", initialData);

    const cityFields = [
        { name: 'name', label: 'name', required: true },
        { name: 'nameAr', label: 'nameAr', required: true },
        { name: 'nameFr', label: 'nameFr', required: true },
        {
            name: 'countryId',
            label: 'Country',
            required: true,
            type: 'select',
            // التأكد من أن الـ options بتستخدم الـ id والـ name الصح
            options: countries.map(c => ({
                value: String(c.id), // تحويل لـ String للضمان
                label: c.name
            }))
        },];

    if ((id && isFetching) || isLoading) return <LoadingSpinner />;

    return (
        <AddPage
            title="image"
            apiUrl="/api/restaurant/cities" // هذا هو الـ Base URL
            queryKey="cities"
            fields={cityFields}
            initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default ImageAdd;