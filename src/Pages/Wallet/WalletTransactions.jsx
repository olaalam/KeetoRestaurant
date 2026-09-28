import React from 'react';
import GenericDataTable from '@/components/GenericDataTable';
import { useGet } from '@/hooks/useGet';
import { useTranslation } from '@/hooks/useTranslation';

export default function WalletTransactions() {
    const { t, isRTL } = useTranslation();

    const { data: response, isLoading } = useGet(
        ['walletTransactions'],
        '/api/restaurant/wallets/transactions'
    );

    // استخراج مصفوفة الحركات من المسار الصحيح بناءً على الـ Response
    const transactionsData = response?.data?.data || [];

    const columns = [
        {
            accessorKey: 'reference',
            header: t('Reference') || 'رقم المرجع',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {row.original.reference || '-'}
                </span>
            )
        },
        {
            accessorKey: 'method',
            header: t('Method') || 'طريقة الدفع',
            cell: ({ row }) => {
                const method = row.original.method;
                const isCash = method === 'cash_on_delivery';
                return (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        isCash ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                        {isCash ? (t('Cash') || 'كاش') : (t('Visa') || 'فيزا')}
                    </span>
                );
            }
        },
        {
            accessorKey: 'amount',
            header: t('Amount') || 'المبلغ',
            cell: ({ row }) => {
                const amt = parseFloat(row.original.amount || 0);
                
                // تحديد اللون والعلامة بناءً على القيمة
                let colorClass = 'text-slate-500'; // للحركات الصفرية (الكاش)
                let prefix = '';
                
                if (amt > 0) {
                    colorClass = 'text-emerald-600';
                    prefix = '+';
                } else if (amt < 0) {
                    colorClass = 'text-rose-600';
                }

                return (
                    <span className={`font-bold ${colorClass}`} dir="ltr">
                        {prefix}{amt.toFixed(2)} <span className="text-xs font-normal">EGP</span>
                    </span>
                );
            }
        },
        {
            accessorKey: 'balanceAfter',
            header: t('Balance') || 'الرصيد',
            cell: ({ row }) => (
                <span className="font-semibold text-slate-700" dir="ltr">
                    {parseFloat(row.original.balanceAfter || 0).toFixed(2)} <span className="text-xs font-normal">EGP</span>
                </span>
            )
        },
        {
            accessorKey: 'note', // تم تعديلها من description إلى note
            header: t('Description') || 'البيان',
            cell: ({ row }) => (
                <span className="text-sm text-slate-600">
                    {row.original.note || '-'}
                </span>
            )
        },
        {
            accessorKey: 'createdAt',
            header: t('Date') || 'التاريخ',
            cell: ({ row }) => {
                if (!row.original.createdAt) return '-';
                const date = new Date(row.original.createdAt);
                return (
                    <div className="flex flex-col text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{date.toLocaleDateString()}</span>
                        <span>{date.toLocaleTimeString()}</span>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="p-6 md:p-10">
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