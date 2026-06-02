import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function Social() {
    const navigate = useNavigate();

    const { data: social = [], isLoading } = useQuery({
        queryKey: ['social'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/socialmedia/');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });

    const columns = [
        {
            accessorKey: "icon", // التأكد من مطابقة الاسم الراجع من الـ API (حرف I كبير)
            header: "icon",
            cell: ({ row }) => {
                const imageStr = row.getValue("icon");
                return (
                    <div className="w-12 h-12 border rounded-md overflow-hidden bg-gray-100">
                        {imageStr ? (
                            <img
                                src={imageStr}
                                alt="category"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "link",
            header: "link",
        },

    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="SocialMedia"
                columns={columns}
                data={social}
                isLoading={isLoading}
                queryKey="social"
                deleteApiUrl="/api/restaurant/socialmedia/"
                onAdd={() => navigate("/social/add")}
                onEdit={(social) => navigate(`/social/edit/${social.id}`)}
                
            />
        </div>
    );
}