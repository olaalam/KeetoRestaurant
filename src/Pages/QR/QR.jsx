import React, { useState } from 'react'; // 1. استيراد useState
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

export default function QR() {
    const navigate = useNavigate();
    const { t } = useTranslation(); // تفعيل الهوك
    
    // 2. State للاحتفاظ بالصورة المفتوحة حالياً في الـ Modal
    const [selectedImg, setSelectedImg] = useState(null);

    const { data: qr = [], isLoading } = useQuery({
        queryKey: ['qr'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restQR');
            return res.data.data.data;
            return res.data.data.data;
        }
    });

    // دالة مسؤولة عن تحميل الصورة تلقائياً
    const handleDownload = async (imgUrl) => {
        try {
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `QR_Code_${Date.now()}.png`; // اسم الملف عند التحميل
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("خطأ أثناء تحميل الصورة:", error);
            // حل احتياطي في حال فشل الـ Blob بسبب الـ CORS
            const link = document.createElement('a');
            link.href = imgUrl;
            link.target = '_blank';
            link.download = 'QR_Code.png';
            link.click();
        }
    };

    const columns = [
        {
            accessorKey: "qrCodeImg",
            header: t("qrCodeImage"), // ترجمة عنوان العمود
            accessorKey: "qrCodeImg",
            header: "qrCodeImg",
            cell: ({ row }) => {
                const imageStr = row.getValue("qrCodeImg");
                return (
                    // 3. أضفنا cursor-pointer عند تمرير الماوس و onClick لفتح الـ Modal
                    <div 
                        className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => imageStr && setSelectedImg(imageStr)}
                    >
                        {imageStr ? (
                            <img
                                src={imageStr}
                                alt="QR Code"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                                {t("noImage")} {/* نص عند عدم وجود صورة */}
                            </div>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title={t("qrCode")} // عنوان الجدول معرب ومترجم
                columns={columns}
                data={qr}
                isLoading={isLoading}
                queryKey="qr"
                deleteApiUrl="/api/restaurant/restQR"
                onAdd={() => navigate("/qr/add")}
            />
            />

            {/* 4. الـ Modal الذي يظهر عند الضغط على الصورة */}
            {selectedImg && (
                <div 
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setSelectedImg(null)} // قفل الـ Modal عند الضغط في أي مكان خارج الصورة
                >
                    {/* محتوى الـ Modal */}
                    <div 
                        className="relative bg-white p-4 rounded-xl max-w-md w-full mx-4 flex flex-col items-center gap-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()} // منع قفل الـ Modal عند الضغط داخل الكارد نفسه
                    >
                        {/* زر الإغلاق X */}
                        <button 
                            className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
                            onClick={() => setSelectedImg(null)}
                        >
                            ✕
                        </button>

                        <h3 className="text-lg font-medium text-gray-900">معاينة رمز الـ QR</h3>

                        {/* الصورة الكبيرة */}
                        <div className="w-64 h-64 border rounded-lg overflow-hidden bg-gray-50 p-2">
                            <img 
                                src={selectedImg} 
                                alt="QR Large" 
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* زر التحميل */}
                        <button
                            onClick={() => handleDownload(selectedImg)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            {/* أيقونة تحميل بسيطة */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            تحميل الصورة (Download)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}