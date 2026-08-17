import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet'; //[cite: 3]
import GenericDataTable from '@/components/GenericDataTable'; //[cite: 5]
import { Dialog, DialogContent } from "@/components/ui/dialog";
import UsersAdd from './UsersAdd'; //[cite: 7]

export default function Users() {
    const [editingUser, setEditingUser] = useState(null);
    const { data, isLoading } = useGet('restaurant-users', '/api/restaurant/restaurant-users'); //[cite: 3]

    // استخراج البيانات وتسطيحها بناءً على الهيكل: data.data.data -> item.user
    const rawList = data?.data?.data || [];
    const formattedData = rawList.map(item => ({
        id: item.user?.id,
        name: item.user?.name,
        phone: item.user?.phone,
        status: item.user?.status,
        photo: item.user?.photo,
    }));

    const columns = [
        {
            accessorKey: 'photo',
            header: 'Photo',
            cell: ({ row }) => {
                const photo = row.getValue('photo');
                return (
                    <div className="flex items-center justify-center">
                        <img
                            src={photo || '/default-avatar.png'}
                            alt="User Photo"
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                    </div>
                );
            },
        },
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'phone',
            header: 'Phone',
        },
        {
            accessorKey: 'status',
            header: 'Status', // يتحول تلقائياً إلى Switch تفاعلي
        },
    ];

    return (
        <div className="p-6 w-full">
            <GenericDataTable
                title="Restaurant Users"
                columns={columns}
                data={formattedData}
                isLoading={isLoading}
                queryKey="restaurant-users"
                editApiUrl="/api/restaurant/restaurant-users" //[cite: 5]
                deleteApiUrl="/api/restaurant/restaurant-users" //[cite: 5]
                onEdit={(user) => setEditingUser(user)}
            />

            {/* نافذة منبثقة لعرض نموذج التعديل باستخدام AddPage */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="max-w-4xl">
                    {editingUser && (
                        <UsersAdd 
                            initialData={editingUser} 
                            onSuccessAction={() => setEditingUser(null)} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}