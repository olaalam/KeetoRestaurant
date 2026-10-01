import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowDownRight, ArrowUpRight, Receipt, Banknote, TrendingUp, Scale } from 'lucide-react';
import { useGet } from '@/hooks/useGet';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { toNum, amountStyle, formatMoney, methodMeta } from './Walletutils';

// رقم ملوّن (أحمر للسالب / أخضر للموجب)
function Money({ value, className = '', showSign = true }) {
    const s = amountStyle(value);
    return (
        <span className={cn('font-bold', s.text, className)} dir="ltr">
            {showSign ? s.prefix : ''}
            {formatMoney(value)} <span className="text-xs font-normal">EGP</span>
        </span>
    );
}

function StatCard({ icon: Icon, label, value, colorValue }) {
    const s = amountStyle(colorValue ?? value);
    return (
        <div className={cn('p-5 rounded-2xl border shadow-sm bg-white flex items-start gap-4', s.border)}>
            <div className={cn('p-3 rounded-xl', s.bg, s.text)}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
                <Money value={value} className="text-2xl" />
            </div>
        </div>
    );
}

export default function WalletPage() {
    const navigate = useNavigate();
    const { t, isRTL } = useTranslation();

    const { data: response, isLoading, isError } = useGet(['restaurantWallet'], '/api/restaurant/wallets');

    // الريسبونس: { success, data: { message, data: {...} } }
    const wallet = response?.data?.data || {};
    const summary = wallet.accountSummary || {};
    const fees = wallet.fees || {};
    const planFees = wallet.currentPlanFees || {};
    const recent = wallet.recentTransactions || [];

    const balance = toNum(summary.balance);
    const balanceStyle = amountStyle(balance);
    const isNegative = balance < 0;
    const isPositive = balance > 0;

    const statusLabel = isNegative
        ? t('Amount Due from Restaurant') || 'مبلغ مستحق على المطعم'
        : isPositive
        ? t('Credit Due to Restaurant') || 'مبلغ مستحق للمطعم'
        : t('Balanced Wallet') || 'الرصيد متزن';

    const HeroIcon = isNegative ? ArrowDownRight : isPositive ? ArrowUpRight : Wallet;

    if (isLoading) {
        return (
            <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="animate-pulse space-y-6">
                    <div className="h-10 w-56 bg-gray-200 rounded" />
                    <div className="h-40 bg-gray-200 rounded-2xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[0, 1, 2].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !response?.success) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#F8FAFC]" dir={isRTL ? 'rtl' : 'ltr'}>
                <p className="text-lg font-semibold text-red-500">
                    {t('Error loading wallet') || 'حدث خطأ أثناء تحميل المحفظة'}
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen text-gray-800" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* العنوان + زرار الحركات */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('Restaurant Wallet') || 'محفظة المطعم'}</h1>
                    {wallet.updatedAt && (
                        <p className="text-xs text-gray-500">
                            {t('Last updated') || 'آخر تحديث'}: {new Date(wallet.updatedAt).toLocaleString()}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => navigate('/wallet-transactions')}
                    className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                    <Receipt size={18} />
                    {t('Transactions') || 'الحركات'}
                </button>
            </div>

            {/* الكارت الرئيسي: الرصيد */}
            <div className={cn('p-6 rounded-2xl border shadow-sm mb-6 flex items-start justify-between gap-4', balanceStyle.bg, balanceStyle.border)}>
                <div className="space-y-2">
                    <span className={cn('inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/70', balanceStyle.text)}>
                        {statusLabel}
                    </span>
                    <div>
                        <Money value={balance} className="text-4xl tracking-tight" />
                    </div>
                    {summary.description && (
                        <p className={cn('text-sm font-medium', balanceStyle.text)}>{summary.description}</p>
                    )}
                </div>
                <div className={cn('p-3 rounded-xl bg-white/70', balanceStyle.text)}>
                    <HeroIcon size={28} />
                </div>
            </div>

            {/* الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={Banknote} label={t('Collected Cash') || 'الكاش المحصل (COD)'} value={summary.collectedCash} />
                <StatCard icon={TrendingUp} label={t('Total Earnings') || 'إجمالي الأرباح'} value={summary.totalEarning} />
                <StatCard
                    icon={Scale}
                    label={t('Net Amount') || 'صافي المستحق'}
                    value={isNegative ? -Math.abs(toNum(summary.netAmount)) : summary.netAmount}
                />
            </div>

            {/* الرسوم */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-800 mb-4">{t('Fees') || 'الرسوم'}</h4>
                    <dl className="space-y-3 text-sm">
                        {[
                            [t('Service Fees') || 'رسوم الخدمة', fees.totalServiceFeesRecorded],
                            [t('Commission') || 'العمولة', fees.totalCommissionRecorded],
                            [t('Subscriptions') || 'الاشتراكات', fees.totalSubscriptionsRecorded],
                        ].map(([label, val]) => (
                            <div key={label} className="flex justify-between">
                                <dt className="text-gray-500">{label}</dt>
                                <dd className="font-semibold text-slate-700" dir="ltr">{formatMoney(val)} EGP</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-base font-semibold text-gray-800 mb-4">{t('Current Plan Fees') || 'رسوم الباقة الحالية'}</h4>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">{t('Service fee per order') || 'رسوم الخدمة لكل طلب'}</dt>
                            <dd className="font-semibold text-slate-700" dir="ltr">{formatMoney(planFees.totalServiceFeePerOrder)} EGP</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">{t('Commission rate') || 'نسبة العمولة'}</dt>
                            <dd className="font-semibold text-slate-700" dir="ltr">{toNum(planFees.totalCommissionRatePercent).toFixed(2)}%</dd>
                        </div>
                    </dl>
                </div>
            </div>


        </div>
    );
}