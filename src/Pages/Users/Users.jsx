import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import GenericDataTable from '@/components/GenericDataTable';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import UsersAdd from './UsersAdd';

export default function Users() {
    const [editingUser, setEditingUser] = useState(null);
    const queryClient = useQueryClient();
    const { data, isLoading } = useGet('restaurant-users', '/api/restaurant/restaurant-users');

    const rawList = data?.data?.data || [];
    const formattedData = rawList.map(item => ({
        id: item.id,
        userId: item.userId,
        name: item.name,
        email: item.email,
        phone: item.phone,
        status: item.status || item.userStatus || 'active',
        photo: item.photo,
        restaurantName: item.restaurant?.name,
    }));

    // دالة تغيير الحالة بين active و blocked
    const handleStatusToggle = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'active' ? 'blocked' : 'active';
        try {
            await api.put(`/api/restaurant/restaurant-users/${id}`, { status: nextStatus });
            queryClient.invalidateQueries(['restaurant-users']);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

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
            accessorKey: 'email',
            header: 'Email',
        },
        {
            accessorKey: 'phone',
            header: 'Phone',
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status');
                const isActive = status === 'active';

                return (
                    <div className="flex items-center justify-center gap-2">
                        <Switch
                            checked={isActive}
                            onCheckedChange={() => handleStatusToggle(row.original.id, status)}
                        />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {status}
                        </span>
                    </div>
                );
            },
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
                editApiUrl="/api/restaurant/restaurant-users"
                deleteApiUrl="/api/restaurant/restaurant-users"
                onEdit={(user) => setEditingUser(user)}
            />

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