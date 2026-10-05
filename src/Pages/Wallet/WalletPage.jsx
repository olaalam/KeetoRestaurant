import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowDownRight, ArrowUpRight, Receipt, ShoppingBag, Utensils, TrendingUp, Truck, Calendar } from 'lucide-react';
import { useGet } from '@/hooks/useGet';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { toNum, amountStyle, formatMoney } from './Walletutils';

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

function StatCard({ icon: Icon, label, value, colorValue, isCount = false }) {
    const s = amountStyle(colorValue ?? value);
    return (
        <div className={cn('p-5 rounded-2xl border shadow-sm bg-white flex items-start gap-4', s.border)}>
            <div className={cn('p-3 rounded-xl', s.bg, s.text)}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
                {isCount ? (
                    <span className="text-2xl font-bold text-gray-900">{value ?? 0}</span>
                ) : (
                    <Money value={value} className="text-2xl" />
                )}
            </div>
        </div>
    );
}

export default function WalletPage() {
    const navigate = useNavigate();
    const { t, isRTL } = useTranslation();

    // حالة فلاتر التاريخ
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // بناء روابط ה-Query String للطلب
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const { data: response, isLoading, isError } = useGet(
        ['restaurantWallet', startDate, endDate],
        `/api/restaurant/wallets${queryString}`
    );

    // الريسبونس: { success, data: { message, data: {...} } }
    const wallet = response?.data?.data || {};
    const summary = wallet.accountSummary || {};
    const foodOrdersSummary = wallet.foodOrdersSummary || {};
    const fees = wallet.fees || {};
    const planFees = wallet.currentPlanFees || {};

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
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
            {/* العنوان + الفلتر + زرار الحركات */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('Restaurant Wallet') || 'محفظة المطعم'}</h1>
                    {wallet.updatedAt && (
                        <p className="text-xs text-gray-500">
                            {t('Last updated') || 'آخر تحديث'}: {new Date(wallet.updatedAt).toLocaleString()}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* فلتر التاريخ */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-lg shadow-sm">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs md:text-sm border-none outline-none text-gray-700 bg-transparent"
                            placeholder="Start Date"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs md:text-sm border-none outline-none text-gray-700 bg-transparent"
                            placeholder="End Date"
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                }}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-1"
                            >
                                {t('Reset') || 'إلغاء'}
                            </button>
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

            {/* الكروت الأربعة الجديدة (Food Orders Summary) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={ShoppingBag}
                    label={t('Total Orders') || 'إجمالي الطلبات'}
                    value={foodOrdersSummary.totalOrders}
                    isCount={true}
                />
                <StatCard
                    icon={Utensils}
                    label={t('Food Order') || 'طلبات الطعام'}
                    value={foodOrdersSummary.totalSubtotal}
                />
                <StatCard
                    icon={TrendingUp}
                    label={t('Total Earning') || 'إجمالي الأرباح'}
                    value={foodOrdersSummary.totalAmount}
                />
                <StatCard
                    icon={Truck}
                    label={t('Total Delivery Fees') || 'إجمالي رسوم التوصيل'}
                    value={foodOrdersSummary.totalDeliveryFees}
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