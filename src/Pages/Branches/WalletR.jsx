import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation, useQueryClient } from '@tanstack/react-query'; 
import api from '@/api/axios'; 
import { Card, CardContent } from "@/components/ui/card";
import GenericDataTable from '@/components/GenericDataTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DollarSign, Wallet, ArrowDownCircle, BadgeCheck, Banknote, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation"; 

// استيراد مكونات الـ Dialog (تأكد من مسارها في مشروعك، أو يمكنك استخدام الـ Modal المجهز عندك)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

const WalletR = () => {
    const { t } = useTranslation(); 
    const queryClient = useQueryClient();

    // حالات (States) التحكم في الـ Dialog والـ Input والـ Errors
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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

    // 3. الـ Mutation الخاص بطلب السحب
    const withdrawalMutation = useMutation({
        mutationFn: async (amount) => {
            const res = await api.post('/api/restaurant/wallets/request-withdrawal', { amount });
            return res.data;
        },
        onSuccess: () => {
            setSuccessMessage(t('withdrawalRequestSuccess') || 'تم إرسال طلب السحب بنجاح!');
            setWithdrawAmount('');
            // عمل ريفرش لبيانات المحفظة والمعاملات
            queryClient.invalidateQueries(['restaurant-wallet']);
            queryClient.invalidateQueries(['restaurant-transactions']);
            
            // إغلاق الـ Dialog بعد ثانيتين تلقائياً لإعطاء تجربة مستخدم أفضل
            setTimeout(() => {
                setIsDialogOpen(false);
                setSuccessMessage('');
            }, 2000);
        },
        onError: (error) => {

setIsDialogOpen(false);
            // 💡 استخراج رسالة الخطأ بناءً على الهيكل الراجع من الـ API الخاص بكِ
            const serverErrorMessage = 
                error?.response?.data?.error?.message ||  // للتعامل مع { error: { message: "..." } }
                error?.response?.data?.message ||         // للتعامل مع { message: "..." }
                error?.message ||                          // رسالة Axios الافتراضية (مثل Network Error)
                'Invalid Credentials';                     // رسالة احتياطية عامة

            // عرض رسالة الخطأ للمستخدم عبر الـ Toast
            toast.error(serverErrorMessage);
        },
    });

    if (isWalletLoading || isTransactionsLoading) return <LoadingSpinner />;

    const wallet = walletResponse?.data?.data || {};
    const transactions = transactionsResponse?.data?.data || [];

    // دالة فتح الـ Dialog وتصفير البيانات السابقة
    const handleOpenDialog = () => {
        setWithdrawAmount('');
        setErrorMessage('');
        setSuccessMessage('');
        setIsDialogOpen(true);
    };

    // دالة تأكيد وإرسال طلب السحب من داخل الـ Dialog
    const handleConfirmWithdraw = (e) => {
        e.preventDefault();
        setErrorMessage('');
        
        const currentBalance = wallet.balance || 0;
        const parsedAmount = parseFloat(withdrawAmount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setErrorMessage(t('invalidAmount') || 'برجاء إدخال مبلغ صحيح أكبر من الصفر');
            return;
        }
        
        // if (parsedAmount > currentBalance) {
        //     setErrorMessage(t('insufficientBalance') || 'المبلغ المطلوب أكبر من الرصيد المتاح!');
        //     return;
        // }

        // تنفيذ الطلب
        withdrawalMutation.mutate(parsedAmount);
    };

    // تعريف أعمدة جدول المعاملات
    const transactionColumns = [
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
            cell: ({ getValue }) => getValue() ? t(getValue().toLowerCase()) : '—' 
        },
    ];

    return (
        <div className="p-6 space-y-8">
            {/* الهيدر مع زرار فتح الـ Dialog */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('restaurantWallet')}</h1>
                
                <button
                    onClick={handleOpenDialog}
                    // disabled={(wallet.balance || 0) <= 0}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 hover:shadow-orange-700/20 transition-all disabled:shadow-none disabled:cursor-not-allowed text-sm"
                >
                    <ArrowDownCircle className="h-4 w-4" />
                    {t('requestWithdrawal') || 'طلب سحب رصيد'}
                </button>
            </div>

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
                    actions={false} 
                />
            </div>

            {/* مكوّن الـ Dialog (الـ Modal الجديد) */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {t('requestWithdrawal') || 'طلب سحب رصيد'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleConfirmWithdraw} className="space-y-4 py-4">
                        {/* عرض الرصيد الحالي المتاح للمعلومة */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                            <span>{t('availableBalance') || 'الرصيد المتاح حالياً'}: </span>
                            <span className="font-bold text-green-600">{wallet.balance || 0} {t('egp')}</span>
                        </div>

                        {/* الـ Input الخاص بالمبلغ */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('enterAmountToWithdraw') || 'أدخل المبلغ المطلوب سحبه'}
                            </label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                disabled={withdrawalMutation.isLoading || successMessage}
                                className="w-full"
                                required
                            />
                        </div>

                        {/* رسائل الخطأ أو النجاح تظهر داخل الـ Dialog نفسه بدل الـ Alert */}
                        {errorMessage && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50">
                                {errorMessage}
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-900/50">
                                {successMessage}
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsDialogOpen(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                {t('cancel') || 'إلغاء'}
                            </button>
                            <button
                                type="submit"
                                disabled={withdrawalMutation.isLoading || !withdrawAmount || successMessage}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                            >
                                {withdrawalMutation.isLoading ? (t('sending') || 'جاري الإرسال...') : (t('confirm') || 'تأكيد الطلب')}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

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