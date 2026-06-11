import React from 'react';
import { useGet } from '@/hooks/useGet';
import { Card, CardContent } from "@/components/ui/card";
import GenericDataTable from '@/components/GenericDataTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DollarSign, Wallet, ArrowDownCircle, BadgeCheck, Banknote } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation"; // استيراد هوك الترجمة

const WalletR = () => {
    const { t } = useTranslation(); // تفعيل هوك الترجمة

    // 1. جلب بيانات المحفظة الأساسية
    const { data: walletResponse, isLoading: isWalletLoading } = useGet(
        ['restaurant-wallet'],
        `/api/restaurant/wallets`
    );

    // 2. جلب بيانات المعاملات (Transactions)
    const { data: transactionsResponse, isLoading: isTransactionsLoading } = useGet(
        ['restaurant-transactions'],
        `/api/restaurant/wallets/transactions`
    );

    if (isWalletLoading || isTransactionsLoading) return <LoadingSpinner />;

    const wallet = walletResponse?.data?.data || {};
    const transactions = transactionsResponse?.data?.data || [];

    // تعريف أعمدة جدول المعاملات المترجمة
    const transactionColumns = [
        // { accessorKey: 'id', header: t('transactionId') },
        { 
            accessorKey: 'amount', 
            header: t('amount'),
            cell: ({ getValue }) => `${getValue() || 0} ${t('egp')}`
        },
        { 
            accessorKey: 'createdAt', 
            header: t('date'), 
            cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() 
        },
        { 
            accessorKey: 'method', 
            header: t('method'),
            cell: ({ getValue }) => getValue() ? t(getValue().toLowerCase()) : '—' // ترجمة طريقة الدفع تلقائياً (Cash, Visa..)
        },
    ];

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('restaurantWallet')}</h1>

            {/* كروت الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title={t('balance')}
                    value={`${wallet.balance || 0} ${t('egp')}`}
                    icon={<Wallet className="h-6 w-6 text-orange-600" />}
                    bgColor="bg-orange-50/60 dark:bg-orange-950/20"
                />
                <StatCard
                    title={t('collectedCash')}
                    value={`${wallet.collectedCash || 0} ${t('egp')}`}
                    icon={<Banknote className="h-6 w-6 text-yellow-600" />}
                    bgColor="bg-yellow-50/60 dark:bg-yellow-950/20"
                />
                <StatCard
                    title={t('pendingWithdraw')}
                    value={`${wallet.pendingWithdraw || 0} ${t('egp')}`}
                    icon={<ArrowDownCircle className="h-6 w-6 text-emerald-600" />}
                    bgColor="bg-emerald-50/60 dark:bg-emerald-950/20"
                />
                <StatCard
                    title={t('totalWithdrawn')}
                    value={`${wallet.totalWithdrawn || 0} ${t('egp')}`}
                    icon={<DollarSign className="h-6 w-6 text-red-600" />}
                    bgColor="bg-red-50/60 dark:bg-red-950/20"
                />
                <StatCard
                    title={t('totalEarning')}
                    value={`${wallet.totalEarning || 0} ${t('egp')}`}
                    icon={<BadgeCheck className="h-6 w-6 text-blue-600" />}
                    bgColor="bg-blue-50/60 dark:bg-blue-950/20"
                />
            </div>

            {/* جدول المعاملات */}
            <div className="w-full">
                <GenericDataTable
                    title={t('transactionsHistory')}
                    data={transactions}
                    columns={transactionColumns}
                    isLoading={isTransactionsLoading}
                    actions={false} // بما أنها صفحة عرض سجل فقط، لا نحتاج أعمدة الحذف والتعديل
                />
            </div>
        </div>
    );
};

// مكون فرعي للكروت
const StatCard = ({ title, value, icon, bgColor }) => (
    <Card className={`${bgColor} border border-slate-100/50 dark:border-slate-900 shadow-sm rounded-2xl overflow-hidden`}>
        <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{title}</p>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-100 dark:border-slate-800 shrink-0">
                {icon}
            </div>
        </CardContent>
    </Card>
);

export default WalletR;