import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowUpLeft, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGet } from '@/hooks/useGet';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

export default function WalletCard() {
    const navigate = useNavigate();
    const { t, isRTL } = useTranslation();

    // جلب بيانات المحفظة من الـ API
    const { data: response, isLoading } = useGet(
        ['restaurantWallet'],
        '/api/restaurant/wallets'
    );

    // استخراج بيانات المحفظة
    const walletData = response?.data?.data || response || {};
    
    const balance = parseFloat(walletData.balance ?? walletData.totalBalance ?? 0);
    const collectedCash = parseFloat(walletData.collectedCash ?? 0);
    const totalEarning = parseFloat(walletData.totalEarning ?? 0);
    const pendingWithdraw = parseFloat(walletData.pendingWithdraw ?? 0);

    // تحديد حالة اللون والشعار بناءً على القيمة
    const isNegative = balance < 0;
    const isPositive = balance > 0;

    // تحديد ألوان الكارت
    const cardStyle = isNegative
        ? {
              bg: 'bg-rose-50/80 dark:bg-rose-950/20 hover:bg-rose-100/80',
              border: 'border-rose-200 dark:border-rose-900/50',
              text: 'text-rose-600 dark:text-rose-400',
              iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
              badgeBg: 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200',
              label: t("Amount Due from Restaurant") || "مبلغ مستحق على المطعم",
          }
        : isPositive
        ? {
              bg: 'bg-emerald-50/80 dark:bg-emerald-950/20 hover:bg-emerald-100/80',
              border: 'border-emerald-200 dark:border-emerald-900/50',
              text: 'text-emerald-600 dark:text-emerald-400',
              iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
              badgeBg: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200',
              label: t("Credit Due to Restaurant") || "مبلغ مستحق للمطعم",
          }
        : {
              bg: 'bg-slate-50/80 dark:bg-slate-900/40 hover:bg-slate-100/80',
              border: 'border-slate-200 dark:border-slate-800',
              text: 'text-slate-700 dark:text-slate-300',
              iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              badgeBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
              label: t("Balanced Wallet") || "الرصيد متزن",
          };

    const handleCardClick = () => {
        navigate('/wallet-transactions');
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse h-48 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="h-4 w-28 bg-gray-200 rounded"></div>
                        <div className="h-8 w-36 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                </div>
                <div className="h-12 w-full bg-gray-100 rounded mt-4"></div>
            </div>
        );
    }

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                "p-6 rounded-2xl shadow-sm border transition-all duration-300 cursor-pointer group flex flex-col gap-4",
                cardStyle.bg,
                cardStyle.border
            )}
        >
            {/* الجزء العلوي: الرصيد الأساسي */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                            {t("Restaurant Wallet") || "محفظة المطعم"}
                        </span>
                        <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full", cardStyle.badgeBg)}>
                            {cardStyle.label}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <h3 className={cn("text-3xl font-extrabold tracking-tight", cardStyle.text)}>
                            {balance > 0 ? `+${balance.toLocaleString()}` : balance.toLocaleString()}
                        </h3>
                        <span className={cn("text-sm font-bold", cardStyle.text)}>EGP</span>
                    </div>

                    <p className="text-xs text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors flex items-center gap-1 font-medium">
                        <span>{t("Click to view details & transactions") || "اضغط لعرض التفاصيل والحركات"}</span>
                        {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    </p>
                </div>

                <div className={cn("p-3 rounded-xl shadow-sm transition-transform group-hover:scale-110", cardStyle.iconBg)}>
                    {isNegative ? (
                        <ArrowDownRight size={24} />
                    ) : isPositive ? (
                        <ArrowUpLeft size={24} />
                    ) : (
                        <Wallet size={24} />
                    )}
                </div>
            </div>

            {/* الجزء السفلي: تفاصيل الإحصائيات الإضافية */}
            <div className={cn(
                "grid grid-cols-2 gap-4 pt-4 border-t",
                isNegative ? "border-rose-200/50 dark:border-rose-900/30" : 
                isPositive ? "border-emerald-200/50 dark:border-emerald-900/30" : 
                "border-slate-200 dark:border-slate-800"
            )}>
                <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t("Collected Cash") || "الكاش المحصل (COD)"}
                    </p>
                    <p className={cn("text-sm font-bold", cardStyle.text)}>
                        {collectedCash.toLocaleString()} <span className="text-xs font-normal">EGP</span>
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t("Total Earnings") || "إجمالي الأرباح"}
                    </p>
                    <p className={cn("text-sm font-bold", cardStyle.text)}>
                        {totalEarning.toLocaleString()} <span className="text-xs font-normal">EGP</span>
                    </p>
                </div>
                {pendingWithdraw > 0 && (
                    <div className="col-span-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {t("Pending Withdraw") || "مسحوبات قيد الانتظار"}
                        </p>
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                            {pendingWithdraw.toLocaleString()} <span className="text-xs font-normal">EGP</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}