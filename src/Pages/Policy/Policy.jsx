import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";
import LoadingSpinner from '@/components/LoadingSpinner'; 
import { Button } from '@/components/ui/button'; 
import { Edit, Plus } from 'lucide-react';

export default function Policy() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // جلب البيانات من الـ API
    const { data: policyData = [], isLoading } = useQuery({
        queryKey: ['policy'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/policy');
            return res.data.data.data; 
        }
    });

    // دالة لتنظيف النصوص من رموز "\r\n" الصريحة وعرضها بأسطر صحيحة
    const formatText = (text) => {
        if (!text) return '';
        return text.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            {/* الهيدر العلوي */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary tracking-tight">
                    {t("Policy&Support")}
                </h1>
                <Button 
                    onClick={() => navigate("/policy/add")}
                    className="bg-primary hover:bg-primary/20 text-white flex items-center gap-2 rounded-xl"
                >
                    <Plus className="w-4 h-4" />
                    {t("Add Section")}
                </Button>
            </div>

            {/* عرض الأقسام بشكل كروت مخصصة تحتوي على Scroll داخلي */}
            <div className="space-y-8">
                {policyData.map((item) => (
                    <div key={item.id} className="space-y-2">
                        {/* عنوان القسم وأزرار التحكم */}
                        <div className="flex justify-between items-center">
                            <label className="text-lg font-semibold text-gray-700 capitalize">
                                {item.title || t("Section")}:
                            </label>
                            
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/policy/edit/${item.id}`)}
                                className="text-gray-500 hover:text-primary/20 flex items-center gap-1 text-xs"
                            >
                                <Edit className="w-3 h-3" />
                                {t("edit")}
                            </Button>
                        </div>
                        <div 
                            className="w-full max-h-[120px] overflow-y-auto p-5 rounded-2xl border-2 border-primary bg-white text-gray-700 text-base shadow-sm
                                       scroll-smooth pr-3
                                       [&::-webkit-scrollbar]:w-2
                                       [&::-webkit-scrollbar-track]:bg-gray-50
                                       [&::-webkit-scrollbar-track]:rounded-r-2xl
                                       [&::-webkit-scrollbar-thumb]:bg-primary/3
                                       [&::-webkit-scrollbar-thumb]:rounded-full
                                       hover:[&::-webkit-scrollbar-thumb]:bg-primary/60"
                            style={{ 
                                whiteSpace: 'pre-line', 
                                lineHeight: '1.6'
                            }}
                        >
                            {formatText(item.description)}
                        </div>
                    </div>
                ))}

                {policyData.length === 0 && (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-2xl">
                        {t("No data available")}
                    </div>
                )}
            </div>
        </div>
    );
}