import React from 'react';
import AddPage from '@/components/AddPage';
const ImageAdd = () => {
    const imageFields = [
        { name: 'img', label: 'img',type:"file", required: true },
       {name:'periorty' , label: "priorty" , required: true}
    ];



    return (
        <AddPage
            title="image"
            apiUrl="/api/restaurant/image" // هذا هو الـ Base URL
            fields={imageFields}
            onSuccessAction={() => {
                // مثلاً الرجوع للخلف أو لجدول المديرين
                window.history.back();
            }}
        />
    );
};

export default ImageAdd;