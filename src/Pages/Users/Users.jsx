import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import GenericDataTable from '@/components/GenericDataTable';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import UsersAdd from './UsersAdd';
import { useTranslation } from '@/hooks/useTranslation';
import { Mail, Phone, Copy, Check } from 'lucide-react';

// مكون خاص بعرض بيانات الاتصال بارتفاع ومسافات متساوية تماماً لكل الصفوف
const UserContactCell = ({ email, phone }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyPhone = () => {
        if (phone) {
            navigator.clipboard.writeText(phone);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <div className="flex flex-col justify-center min-h-[48px] gap-1 py-1 text-left dir-ltr">
            {/* Symmetrical Email Row */}
            <div className="flex items-center gap-1.5 h-5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span 
                    className="font-medium text-slate-800 text-sm truncate max-w-[200px]" 
                    title={email}
                >
                    {email || '-'}
                </span>
            </div>

            {/* Symmetrical Phone Row (Reserved height whether phone exists or not) */}
            <div className="flex items-center h-5">
                {phone ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 border border-slate-200/80 px-2 py-0.5 rounded-md font-mono">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{phone}</span>
                        <button
                            type="button"
                            onClick={handleCopyPhone}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded hover:bg-slate-200/60 cursor-pointer ml-1"
                            title="Copy phone number"
                        >
                            {copied ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                                <Copy className="w-3 h-3" />
                            )}
                        </button>
                    </div>
                ) : (
                    /* Placeholder يضمن بقاء المسافات وارتفاع الصف متطابقاً في حالة عدم وجود رقم */
                    <div className="inline-flex items-center gap-1 text-xs text-slate-300 px-2 py-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-300 shrink-0" />
                        <span>--</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Users() {
    const [editingUser, setEditingUser] = useState(null);
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { data, isLoading } = useGet('restaurant-users', '/api/restaurant/restaurant-users');

    const rawList = data?.data?.data || [];
    const formattedData = rawList.map(item => ({
        id: item.id,
        userId: item.userId,
        name: item.name,
        email: item.email,
        phone: item.phone,
        points: item.points ?? 0,
        totalOrders: item.totalOrders ?? 0,
        status: item.status || item.userStatus || 'active',
        photo: item.photo,
        restaurantName: item.restaurant?.name,
    }));

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
            header: t('photoHeader'),
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
            header: t('nameHeader'),
        },
        {
            accessorKey: 'email',
            header: t('emailHeader'),
            cell: ({ row }) => (
                <UserContactCell
                    email={row.original.email}
                    phone={row.original.phone}
                />
            ),
        },
        {
            accessorKey: 'totalOrders',
            header: t('totalOrders', { defaultValue: 'Total Orders' }),
            cell: ({ row }) => (
                <span className="font-semibold text-slate-700">
                    {row.original.totalOrders ?? 0}
                </span>
            ),
        },
        {
            accessorKey: 'points',
            header: t('Points', { defaultValue: 'Points' }),
            cell: ({ row }) => (
                <span className="font-semibold text-amber-600">
                    {row.original.points ?? 0}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: t('statusHeader'),
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
                            {isActive ? t('activeStatus') : t('blockedStatus')}
                        </span>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="p-6 w-full">
            <GenericDataTable
                title={t('restaurantUsersTitle')}
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