import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wallet,
    ArrowDownRight,
    ArrowUpRight,
    Receipt,
    ShoppingBag,
    Utensils,
    TrendingUp,
    Truck,
    Calendar,
    Percent,
    Coins,
} from 'lucide-react';
import { useGet } from '@/hooks/useGet';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { toNum, amountStyle, formatMoney } from './Walletutils';

// ───────────────────────── الأنيميشن ─────────────────────────
// wp-rise: ظهور الكروت بالتتابع (مرة واحدة عند فتح الصفحة)
// wp-grow: نمو الـ progress bars
// fill-mode = backwards عشان ما نكسرش الـ hover opacity بعد ما الأنيميشن يخلص
const walletAnimations = `
@keyframes wp-rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes wp-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
.wp-rise { animation: wp-rise .6s cubic-bezier(.22, 1, .36, 1) backwards; }
.wp-grow { animation: wp-grow 1s cubic-bezier(.22, 1, .36, 1) .35s backwards; }
@media (prefers-reduced-motion: reduce) {
  .wp-rise, .wp-grow { animation: none; }
}
`;

// عدّاد يتحرك من القيمة القديمة للجديدة (ويحترم reduced-motion)
function useCountUp(target, duration = 900) {
    const end = toNum(target);
    const [value, setValue] = useState(0);
    const fromRef = useRef(0);

    useEffect(() => {
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const from = fromRef.current;

        if (reduce || from === end) {
            fromRef.current = end;
            setValue(end);
            return;
        }

        let raf;
        const startTime = performance.now();
        const tick = (now) => {
            const p = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // ease-out
            const current = from + (end - from) * eased;
            fromRef.current = current;
            setValue(current);
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [end, duration]);

    return value;
}

// رقم ملوّن (أحمر للسالب / أخضر للموجب) بعدّاد متحرك
function Money({ value, className = '', showSign = true }) {
    const s = amountStyle(value);
    const animated = useCountUp(value);
    return (
        <span className={cn('font-bold tabular-nums', s.text, className)} dir="ltr">
            {showSign ? s.prefix : ''}
            {formatMoney(animated)} <span className="text-xs font-normal">EGP</span>
        </span>
    );
}

// عدد صحيح بعدّاد متحرك
function Count({ value, className = '' }) {
    const animated = useCountUp(value);
    return (
        <span className={cn('tabular-nums', className)} dir="ltr">
            {Math.round(animated)}
        </span>
    );
}

// عنوان قسم بعلامة صفراء صغيرة
function SectionTitle({ children }) {
    return (
        <h4 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
            <span className="h-5 w-1 rounded-full bg-yellow-500" />
            {children}
        </h4>
    );
}

// خلية إحصائية (من غير بوردر لأنها جوه كارت واحد)
function StatCard({ icon: Icon, label, value, colorValue, isCount = false }) {
    const s = amountStyle(colorValue ?? value);
    return (
        <div className="group/stat flex items-start gap-4 p-5 transition-colors duration-300 hover:bg-gray-50/70">
            <div
                className={cn(
                    'p-3 rounded-xl transition-transform duration-300 group-hover/stat:scale-110 group-hover/stat:-rotate-3',
                    s.bg,
                    s.text
                )}
            >
                <Icon size={22} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
                {isCount ? (
                    <Count value={value} className="text-2xl font-bold text-gray-900" />
                ) : (
                    <Money value={value} className="text-2xl" />
                )}
            </div>
        </div>
    );
}

// صف في كارت رسوم الباقة
function PlanRow({ icon: Icon, label, children }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                    <Icon size={16} />
                </span>
                {label}
            </div>
            <span className="font-semibold text-slate-700 text-sm" dir="ltr">
                {children}
            </span>
        </div>
    );
}

export default function WalletPage() {
    const navigate = useNavigate();
    const { t, isRTL } = useTranslation();

    // حالة فلاتر التاريخ
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // بناء روابط ال-Query String للطلب
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
    const feesAndCommissions = wallet.feesAndCommissions || {};
    const bySource = feesAndCommissions.bySource || {};

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

    // المصادر الأربعة + نسبة كل مصدر من إجمالي الطلبات
    const sources = [
        { key: 'keeto', label: t('Keeto') || 'كيتو', dot: 'bg-yellow-500' },
        { key: 'online_order_app', fallbackKey: 'app', label: t('App') || 'التطبيق', dot: 'bg-blue-500' },
        { key: 'pos', label: t('POS') || 'نقاط البيع', dot: 'bg-purple-500' },
        { key: 'online_order_web', label: t('Web') || 'الموقع', dot: 'bg-emerald-500' },
    ].map((src) => ({
        ...src,
        data: bySource[src.key] || (src.fallbackKey && bySource[src.fallbackKey]) || {},
    }));

    const totalSourceOrders = sources.reduce((sum, s) => sum + toNum(s.data.totalOrders), 0);
    const commissionRate = Math.min(Math.max(toNum(planFees.totalCommissionRatePercent), 0), 100);

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
            <style>{walletAnimations}</style>

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
                    <div className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-lg shadow-sm transition-shadow focus-within:shadow-md focus-within:border-yellow-400">
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
                        className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                    >
                        <Receipt size={18} />
                        {t('Transactions') || 'الحركات'}
                    </button>
                </div>
            </div>

            {/* الكارت الرئيسي: الرصيد */}
            <div
                className={cn(
                    'wp-rise p-6 rounded-2xl border shadow-sm mb-6 flex items-start justify-between gap-4',
                    balanceStyle.bg,
                    balanceStyle.border
                )}
            >
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
                <div className={cn('p-3 rounded-xl bg-white/70 shadow-sm', balanceStyle.text)}>
                    <HeroIcon size={28} />
                </div>
            </div>

            {/* Food Orders Summary - الأربع إحصائيات في كارت واحد */}
            <div
                className="wp-rise bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden"
                style={{ animationDelay: '90ms' }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-gray-100 rtl:lg:divide-x-reverse">
                    <StatCard
                        icon={TrendingUp}
                        label={t('Total Earning') || 'إجمالي الأرباح'}
                        value={foodOrdersSummary.totalAmount}
                    />
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
                        icon={Truck}
                        label={t('Total Delivery Fees') || 'إجمالي رسوم التوصيل'}
                        value={foodOrdersSummary.totalDeliveryFees}
                    />
                </div>
            </div>

            {/* الصف السفلي: الرسوم حسب المصدر + رسوم الباقة (جنب بعض) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
                {/* رسوم وعمولات كل مصدر */}
                <section className="wp-rise" style={{ animationDelay: '180ms' }}>
                    <SectionTitle>
                        {t('Fees and Commissions by Source') || 'الرسوم والعمولات حسب المصدر'}
                    </SectionTitle>

                    {/* كارت واحد فيه الـ 4 أقسام + fade عند الـ hover */}
                    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-2">
                            {sources.map(({ key, label, dot, data: sourceData }) => {
                                const orders = toNum(sourceData.totalOrders);
                                const share = totalSourceOrders > 0 ? Math.round((orders / totalSourceOrders) * 100) : 0;

                                return (
                                    <div
                                        key={key}
                                        className="p-6 flex flex-col border-b border-gray-100 sm:odd:border-e sm:[&:nth-child(n+3)]:border-b-0 last:border-b-0
                                                   transition-all duration-300 ease-in-out
                                                   group-hover:opacity-40 hover:!opacity-100 hover:bg-gray-50"
                                    >
                                        <h5 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-3">
                                            <span className={cn('h-2.5 w-2.5 rounded-full', dot)} />
                                            {label}
                                        </h5>

                                        {/* نسبة الطلبات من الإجمالي */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                                                <span>{t('Orders share') || 'نسبة الطلبات'}</span>
                                                <span className="font-semibold text-slate-700" dir="ltr">{share}%</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className={cn('wp-grow h-full rounded-full origin-left rtl:origin-right', dot)}
                                                    style={{ width: `${share}%` }}
                                                />
                                            </div>
                                        </div>

                                        <dl className="space-y-3 text-sm flex-1">
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">{t('Total Orders') || 'إجمالي الطلبات'}</dt>
                                                <dd className="font-semibold text-slate-700" dir="ltr">{orders}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">{t('Service Fees') || 'رسوم الخدمة'}</dt>
                                                <dd className="font-semibold text-slate-700" dir="ltr">{formatMoney(sourceData.serviceFees)} EGP</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">{t('App Commission') || 'عمولة التطبيق'}</dt>
                                                <dd className="font-semibold text-slate-700" dir="ltr">{formatMoney(sourceData.appCommission)} EGP</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">{t('Visa Commission') || 'عمولة الفيزا'}</dt>
                                                <dd className="font-semibold text-slate-700" dir="ltr">{formatMoney(sourceData.visaCommission)} EGP</dd>
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-3">
                                                <dt className="text-gray-700 font-bold">{t('Total Commission') || 'إجمالي العمولة'}</dt>
                                                <dd className="font-bold text-slate-800 bg-yellow-50 rounded-md px-2 py-0.5" dir="ltr">
                                                    {formatMoney(sourceData.totalCommission)} EGP
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* رسوم الباقة الحالية */}
                <section className="wp-rise" style={{ animationDelay: '270ms' }}>
                    <SectionTitle>{t('Current Plan Fees') || 'رسوم الباقة الحالية'}</SectionTitle>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
                        <PlanRow icon={Coins} label={t('Service fee per order') || 'رسوم الخدمة لكل طلب'}>
                            {formatMoney(planFees.totalServiceFeePerOrder)} EGP
                        </PlanRow>

                        <div className="space-y-2.5">
                            <PlanRow icon={Percent} label={t('Commission rate') || 'نسبة العمولة'}>
                                {toNum(planFees.totalCommissionRatePercent).toFixed(2)}%
                            </PlanRow>
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className="wp-grow h-full rounded-full bg-yellow-500 origin-left rtl:origin-right"
                                    style={{ width: `${commissionRate}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}