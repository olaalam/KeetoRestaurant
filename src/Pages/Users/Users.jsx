import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import GenericDataTable from '@/components/GenericDataTable';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import UsersAdd from './UsersAdd';
import { useTranslation } from '@/hooks/useTranslation';
import { Mail, Phone, Copy, Check, ArrowUpDown, Filter, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            <div className="flex items-center gap-1.5 h-5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span
                    className="font-medium text-slate-800 text-sm truncate max-w-[200px]"
                    title={email}
                >
                    {email || '-'}
                </span>
            </div>

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
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
    const [totalSpendingFilter, setTotalSpendingFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data, isLoading } = useGet('restaurant-users', '/api/restaurant/restaurant-users', {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...(totalSpendingFilter ? { totalSpending: totalSpendingFilter } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
    });

    const rawList = data?.data?.data || data?.data || [];

    const totalPages = data?.data?.pagination?.totalPages || data?.data?.totalPages || 1;

    const formattedData = rawList.map(item => ({
        id: item.id,
        userId: item.userId,
        name: item.name,
        email: item.email,
        phone: item.phone,
        points: item.points ?? 0,
        totalOrders: item.totalOrders ?? 0,
        totalSpending: item.totalSpendings ?? item.spending ?? 0,
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

    const handleClearFilters = () => {
        setTotalSpendingFilter('');
        setStartDate('');
        setEndDate('');
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const columns = [
        {
            accessorKey: 'photo',
            header: t('photoHeader', { defaultValue: 'Photo' }),
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
            header: t('nameHeader', { defaultValue: 'Name' }),
            cell: ({ row }) => (
                <button
                    onClick={() => navigate(`/users/${row.original.userId}`)}
                    className="font-semibold text-primary hover:underline hover:text-primary/80 transition-colors bg-transparent border-none cursor-pointer p-0 m-0"
                >
                    {row.original.name}
                </button>
            ),
        },
        {
            accessorKey: 'email',
            accessorFn: (row) => `${row.email || ''} ${row.phone || ''}`,
            header: t('emailHeader', { defaultValue: 'Email / Phone' }),
            cell: ({ row }) => (
                <UserContactCell
                    email={row.original.email}
                    phone={row.original.phone}
                />
            ),
        },
        {
            accessorKey: 'totalOrders',
            header: ({ column }) => {
                return (
                    <button
                        type="button"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer p-0 font-medium"
                    >
                        {t('totalOrders', { defaultValue: 'Total Orders' })}
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                );
            },
            cell: ({ row }) => (
                <span className="font-semibold text-slate-700">
                    {row.original.totalOrders ?? 0}
                </span>
            ),
        },
        {
            accessorKey: 'totalSpending',
            header: ({ column }) => {
                return (
                    <button
                        type="button"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer p-0 font-medium"
                    >
                        {t('totalSpending', { defaultValue: 'Total Spending' })}
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                );
            },
            cell: ({ row }) => (
                <span className="font-semibold text-emerald-600">
                    {parseFloat(row.original.totalSpending ?? 0).toLocaleString()} ج.م
                </span>
            ),
        },
        {
            accessorKey: 'points',
            header: ({ column }) => {
                return (
                    <button
                        type="button"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer p-0 font-medium"
                    >
                        {t('Points', { defaultValue: 'Points' })}
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                );
            },
            cell: ({ row }) => (
                <span className="font-semibold text-amber-600">
                    {row.original.points ?? 0}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: t('statusHeader', { defaultValue: 'Status' }),
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
                            {isActive ? t('activeStatus', { defaultValue: 'Active' }) : t('blockedStatus', { defaultValue: 'Blocked' })}
                        </span>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="p-6 w-full space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-600">{t('startDate', { defaultValue: 'From' })}:</span>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setPagination(prev => ({ ...prev, pageIndex: 0 }));
                            }}
                            className="w-36 h-9 text-xs rounded-xl"
                        />
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-600">{t('endDate', { defaultValue: 'To' })}:</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setPagination(prev => ({ ...prev, pageIndex: 0 }));
                            }}
                            className="w-36 h-9 text-xs rounded-xl"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-slate-700 font-semibold text-xs">
                        <Filter className="w-3.5 h-3.5 text-primary" />
                        <span>{t('filterBySpending', { defaultValue: 'Min Spending' })}:</span>
                    </div>
                    <Input
                        type="number"
                        placeholder={t('enterSpending', { defaultValue: 'Amount...' })}
                        value={totalSpendingFilter}
                        onChange={(e) => {
                            setTotalSpendingFilter(e.target.value);
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                        }}
                        className="w-28 h-9 text-xs rounded-xl"
                    />
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-9 px-3 rounded-xl gap-1 text-slate-500 hover:text-slate-700"
                >
                    <RotateCcw className="h-4 w-4" />
                    <span className="text-xs">{t('reset', { defaultValue: 'Reset' })}</span>
                </Button>
            </div>

            <GenericDataTable
                title={t('restaurantUsersTitle', { defaultValue: 'Restaurant Users' })}
                columns={columns}
                data={formattedData}
                isLoading={isLoading}
                queryKey="restaurant-users"
                editApiUrl="/api/restaurant/restaurant-users"
                deleteApiUrl="/api/restaurant/restaurant-users"
                onEdit={(user) => setEditingUser(user)}
                pagination={pagination}
                setPagination={setPagination}
                pageCount={totalPages}
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