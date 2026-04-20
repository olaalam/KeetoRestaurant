import React from 'react';
import { useGet } from '@/hooks/useGet';
import { Card, CardContent } from "@/components/ui/card";
import GenericDataTable from '@/components/GenericDataTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DollarSign, Wallet, ArrowDownCircle, BadgeCheck, Banknote } from "lucide-react";

const WalletR = () => {

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

    // استخراج بيانات المحفظة بناءً على هيكلة الـ JSON في الصورة
    // { success, data: { message, data: { balance, ... } } }
    const wallet = walletResponse?.data?.data || {};

    // استخراج بيانات المعاملات (بافتراض أنها ترجع كمصفوفة داخل data.data)
    const transactions = transactionsResponse?.data?.data || [];

    // تعريف أعمدة جدول المعاملات
    const transactionColumns = [
        { accessorKey: 'id', header: 'Transaction ID' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
        { accessorKey: 'method', header: 'Method' },
    ];

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Restaurant Wallet</h1>

            {/* كروت الإحصائيات (تم تعديل المتغيرات لتطابق camelCase في الـ Response) */}
            {/* جعلنا الشبكة 5 أعمدة لتستوعب collectedCash */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Balance"
                    value={`${wallet.balance || 0} EGP`}
                    icon={<Wallet className="h-6 w-6 text-orange-600" />}
                    bgColor="bg-orange-50"
                />
                <StatCard
                    title="Collected Cash"
                    value={`${wallet.collectedCash || 0} EGP`}
                    icon={<Banknote className="h-6 w-6 text-yellow-600" />}
                    bgColor="bg-yellow-50"
                />
                <StatCard
                    title="Pending Withdraw"
                    value={`${wallet.pendingWithdraw || 0} EGP`}
                    icon={<ArrowDownCircle className="h-6 w-6 text-emerald-600" />}
                    bgColor="bg-emerald-50"
                />
                <StatCard
                    title="Total Withdrawn"
                    value={`${wallet.totalWithdrawn || 0} EGP`}
                    icon={<DollarSign className="h-6 w-6 text-red-600" />}
                    bgColor="bg-red-50"
                />
                <StatCard
                    title="Total Earning"
                    value={`${wallet.totalEarning || 0} EGP`}
                    icon={<BadgeCheck className="h-6 w-6 text-blue-600" />}
                    bgColor="bg-blue-50"
                />
            </div>

            {/* جدول المعاملات (أصبح يأخذ العرض بالكامل بعد إزالة الفورم) */}
            <div className="w-full">
                <GenericDataTable
                    title="Transactions History"
                    data={transactions}
                    columns={transactionColumns}
                    isLoading={isTransactionsLoading}
                />
            </div>
        </div>
    );
};

// مكون فرعي للكروت
const StatCard = ({ title, value, icon, bgColor }) => (
    <Card className={`${bgColor} border-none shadow-sm`}>
        <CardContent className="p-6 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <h3 className="text-2xl font-bold mt-1">{value}</h3>
            </div>
            <div className="p-3 bg-white rounded-full shadow-sm">
                {icon}
            </div>
        </CardContent>
    </Card>
);

export default WalletR;