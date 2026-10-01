import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import GenericDataTable from '@/components/GenericDataTable';
import { useGet } from '@/hooks/useGet';
import { useTranslation } from '@/hooks/useTranslation';
import { amountStyle, formatMoney, methodMeta } from './Walletutils';

const EGP = <span className="text-xs font-normal"> EGP</span>;

export default function WalletTransactions() {
    const { t, isRTL } = useTranslation();
    const navigate = useNavigate();

    const { data: response, isLoading } = useGet(
        ['walletTransactions'],
        '/api/restaurant/wallets/transactions'
    );

    // استخراج مصفوفة الحركات من المسار الصحيح بناءً على الـ Response
    const transactionsData = response?.data?.data || [];

    const typeLabels = {
        order_payment: t('Order Payment') || 'دفع طلب',
        adjustment: t('Adjustment') || 'تسوية',
    };

    const statusLabels = {
        delivered: t('Delivered') || 'تم التوصيل',
        cancelled: t('Cancelled') || 'ملغي',
        pending: t('Pending') || 'قيد الانتظار',
    };

    const orderTypeLabels = {
        delivery: t('Delivery') || 'توصيل',
        pickup: t('Pickup') || 'استلام',
        dine_in: t('Dine In') || 'داخل المطعم',
    };

    const orderSourceLabels = {
        online_order_web: t('Website') || 'الموقع',
        online_order_app: t('App') || 'التطبيق',
    };

    const columns = [
        {
            // رقم الطلب اليومي بدل الـ id / reference
            id: 'dailyOrderNumber',
            header: t('Order No.') || 'رقم الطلب',
            cell: ({ row }) => {
                const n = row.original.order?.dailyOrderNumber;
                return n != null ? (
                    <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                        #{n}
                    </span>
                ) : (
                    '-'
                );
            }
        },
                {
            accessorKey: 'createdAt',
            header: t('Date') || 'التاريخ',
            cell: ({ row }) => {
                if (!row.original.createdAt) return '-';
                const date = new Date(row.original.createdAt);
                return (
                    <div className="flex flex-col text-xs text-slate-500 whitespace-nowrap">
                        <span className="font-medium text-slate-700">{date.toLocaleDateString()}</span>
                        <span>{date.toLocaleTimeString()}</span>
                    </div>
                );
            }
        },
        {
            id: 'orderInfo',
            header: t('Order Details') || 'تفاصيل الطلب',
            cell: ({ row }) => {
                const order = row.original.order;
                if (!order) return '-';
                return (
                    <div className="flex flex-col gap-1 text-xs">
                        <span className="font-medium text-slate-700">
                            {orderTypeLabels[order.orderType] || order.orderType}
                            {' · '}
                            {orderSourceLabels[order.orderSource] || order.orderSource}
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit font-semibold">
                            {statusLabels[order.status] || order.status}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'typeMethod',
            header: t('Type') || 'النوع',
            cell: ({ row }) => {
                const m = methodMeta(row.original.method, t);
                return (
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-700 whitespace-nowrap">
                            {typeLabels[row.original.type] || row.original.type || '-'}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md whitespace-nowrap ${m.cls}`}>
                            {m.label}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'orderFees',
            header: t('Order Total') || 'إجمالي الطلب',
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5 text-xs text-slate-600 whitespace-nowrap" dir="ltr">
                    <span className="font-semibold text-slate-700 text-sm">
                        {formatMoney(row.original.orderAmount)}{EGP}
                    </span>
                    <span>{t('Service') || 'خدمة'}: {formatMoney(row.original.serviceFee)}</span>
                    <span>{t('Commission') || 'عمولة'}: {formatMoney(row.original.commission)}</span>
                </div>
            )
        },
        {
            accessorKey: 'amount',
            header: t('Amount') || 'المبلغ',
            cell: ({ row }) => {
                const st = amountStyle(row.original.amount);
                return (
                    <span className={`font-bold ${st.text}`} dir="ltr">
                        {st.prefix}{formatMoney(row.original.amount)}{EGP}
                    </span>
                );
            }
        },
        {
            id: 'balance',
            header: t('Balance') || 'الرصيد',
            cell: ({ row }) => {
                const before = amountStyle(row.original.balanceBefore);
                const after = amountStyle(row.original.balanceAfter);
                return (
                    <div className="flex flex-col gap-0.5 text-xs whitespace-nowrap" dir="ltr">
                        <span className={`${before.text} opacity-70`}>
                            {t('Before') || 'قبل'}: {formatMoney(row.original.balanceBefore)}
                        </span>
                        <span className={`font-semibold ${after.text}`}>
                            {t('After') || 'بعد'}: {formatMoney(row.original.balanceAfter)}{EGP}
                        </span>
                    </div>
                );
            }
        },


    ];

    return (
        <div className="p-6 md:p-10">
            <button
                onClick={() => navigate('/wallet')}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
                {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                {t('Back to Wallet') || 'الرجوع للمحفظة'}
            </button>
            <GenericDataTable
                title={t("Wallet Transactions") || "حركات المحفظة"}
                columns={columns}
                data={transactionsData}
                isLoading={isLoading}
                actions={false}
            />
        </div>
    );
}