import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGet } from '@/hooks/useGet';
import {
    Package,
    CheckCircle2,
    Truck,
    Clock,
    XCircle,
    Banknote,
    Coins,
    Receipt,
    RotateCcw,
    RefreshCw,
    UserX,
    Check,
    Store,
    Users,
    Calendar,
    Filter,
    Wallet,
    CreditCard
} from 'lucide-react';

/* ============================================================
   Helpers
   ============================================================ */

const EMPTY_REPORT = { summary: null, deliveryMen: [], orders: [] };

const num = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
};

const fmtMoney = (v) =>
    num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toInputDate = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const pickArray = (...candidates) => {
    for (const c of candidates) {
        if (Array.isArray(c)) return c;
    }
    return [];
};

const parseAddress = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return {};
    }
};

const normalizeReport = (res) => {
    const body = res?.data;
    const inner = body?.data;

    let payload = {};
    if (inner && (inner.summary || inner.deliveryMen || inner.orders)) {
        payload = inner;
    } else if (inner?.data) {
        payload = inner.data;
    } else if (inner) {
        payload = inner;
    } else if (body) {
        payload = body;
    }

    return {
        summary: payload.summary || null,
        deliveryMen: Array.isArray(payload.deliveryMen) ? payload.deliveryMen : [],
        orders: Array.isArray(payload.orders) ? payload.orders : [],
    };
};

const formatDateTime = (value, isAr) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString(isAr ? 'ar-EG' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/* ============================================================
   Static meta (ألوان وهويات بصرية)
   ============================================================ */

const TONES = {
    slate: { box: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', border: 'border-l-slate-400' },
    emerald: { box: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', border: 'border-l-emerald-500' },
    amber: { box: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400', border: 'border-l-amber-500' },
    blue: { box: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', border: 'border-l-blue-500' },
    violet: { box: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400', border: 'border-l-violet-500' },
    rose: { box: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400', border: 'border-l-rose-500' },
};

const STATUS_META = {
    pending: { en: 'Pending', ar: 'قيد الانتظار', tone: 'amber', Icon: Clock },
    accepted: { en: 'Accepted', ar: 'تم القبول', tone: 'blue', Icon: Check },
    out_for_delivery: { en: 'Out for delivery', ar: 'في الطريق', tone: 'violet', Icon: Truck },
    delivered: { en: 'Delivered', ar: 'تم التوصيل', tone: 'emerald', Icon: CheckCircle2 },
    cancelled: { en: 'Cancelled', ar: 'ملغي', tone: 'rose', Icon: XCircle },
};

const PAYMENT_META = {
    cash: { en: 'Cash', ar: 'نقدي', tone: 'emerald', Icon: Banknote },
    visa: { en: 'Visa', ar: 'بطاقة', tone: 'blue', Icon: CreditCard },
    wallet: { en: 'Wallet', ar: 'محفظة', tone: 'violet', Icon: Wallet },
};

const STATUS_FILTER_OPTIONS = ['pending', 'accepted', 'out_for_delivery', 'delivered', 'cancelled'];
const PAYMENT_FILTER_OPTIONS = ['cash', 'visa', 'wallet'];

/* ============================================================
   UI Components المصممة بحرفية
   ============================================================ */

const StatusBadge = ({ status, isAr }) => {
    const meta = STATUS_META[status];
    if (!meta) {
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {status || '-'}
            </span>
        );
    }
    const tone = TONES[meta.tone];
    const Icon = meta.Icon;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${tone.box}`}>
            <Icon className="h-3.5 w-3.5" />
            {isAr ? meta.ar : meta.en}
        </span>
    );
};

const PaymentBadge = ({ type, isAr }) => {
    const meta = PAYMENT_META[type];
    if (!meta) {
        return <span className="text-xs text-slate-400">{type || '-'}</span>;
    }
    const tone = TONES[meta.tone];
    const Icon = meta.Icon;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${tone.box}`}>
            <Icon className="h-3.5 w-3.5" />
            {isAr ? meta.ar : meta.en}
        </span>
    );
};

const Avatar = ({ src, name, unassigned = false, size = 'h-11 w-11' }) => {
    const [failed, setFailed] = useState(false);

    if (unassigned) {
        return (
            <div className={`${size} shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400`}>
                <UserX className="h-5 w-5" />
            </div>
        );
    }

    if (src && !failed) {
        return (
            <img
                src={src}
                alt={name || ''}
                onError={() => setFailed(true)}
                className={`${size} shrink-0 rounded-full object-cover ring-2 ring-primary/10 shadow-sm`}
            />
        );
    }

    const initial = (name || '?').trim().charAt(0).toUpperCase();
    return (
        <div className={`${size} shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shadow-inner`}>
            {initial}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, sub, tone = 'slate' }) => {
    const t = TONES[tone];
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 border-l-4 ${t.border} shadow-sm hover:shadow transition-all p-4 flex items-center gap-3.5`}>
            <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${t.box}`}>
                <Icon className="h-5.5 w-5.5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
                <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight truncate mt-0.5">{value}</p>
                {sub ? <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p> : null}
            </div>
        </div>
    );
};

const SkeletonBlock = ({ className = '' }) => (
    <div className={`animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/60 ${className}`} />
);

const DeliveryManCard = ({ man, selected, onSelect, isAr, currency }) => {
    const unassigned = man.deliveryManId === 'unassigned';
    const name = unassigned ? (isAr ? 'غير معيّن' : 'Unassigned') : man.deliveryManName;

    const totalCash = num(man.totalCash);
    const cashCollected = num(man.cashCollected);
    const cashOnHand = num(man.cashWithDeliveryMan ?? man.cashOnHand);
    const pct = totalCash > 0 ? Math.min(100, Math.round((cashCollected / totalCash) * 100)) : 0;

    const statusEntries = Object.entries(man.ordersCountByStatus || {});

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`text-start w-full rounded-xl border-2 p-4 space-y-3.5 transition-all bg-white dark:bg-slate-900 shadow-sm hover:shadow ${
                selected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.01]'
                    : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <Avatar src={man.deliveryManImage} name={man.deliveryManName} unassigned={unassigned} />
                <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{name}</h4>
                    <p className="text-xs text-slate-400" dir="ltr">
                        {man.deliveryManPhone || '-'}
                    </p>
                </div>
                {selected && (
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="h-3.5 w-3.5" />
                    </span>
                )}
            </div>

            {/* Orders Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 py-2 border border-slate-100 dark:border-slate-800">
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100">{man.totalOrders ?? 0}</p>
                    <p className="text-[10px] font-medium text-slate-500">{isAr ? 'الطلبات' : 'Orders'}</p>
                </div>
                <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-500/10 py-2 border border-emerald-100/60 dark:border-emerald-500/10">
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{man.deliveredOrdersCount ?? 0}</p>
                    <p className="text-[10px] font-medium text-slate-500">{isAr ? 'تم التوصيل' : 'Delivered'}</p>
                </div>
                <div className="rounded-lg bg-violet-50/60 dark:bg-violet-500/10 py-2 border border-violet-100/60 dark:border-violet-500/10">
                    <p className="text-base font-bold text-violet-600 dark:text-violet-400">{man.outForDeliveryOrdersCount ?? 0}</p>
                    <p className="text-[10px] font-medium text-slate-500">{isAr ? 'في الطريق' : 'On the way'}</p>
                </div>
            </div>

            {/* Status Badges */}
            {statusEntries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {statusEntries.map(([status, count]) => (
                        <span key={status} className="inline-flex items-center gap-1">
                            <StatusBadge status={status} isAr={isAr} />
                            <span className="text-[11px] font-bold text-slate-500">×{count}</span>
                        </span>
                    ))}
                </div>
            )}

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                    <p className="text-slate-400 text-[11px]">{isAr ? 'إجمالي المبالغ' : 'Total amount'}</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {fmtMoney(man.totalAmount)} <span className="font-normal text-slate-400 text-[10px]">{currency}</span>
                    </p>
                </div>
                <div>
                    <p className="text-slate-400 text-[11px]">{isAr ? 'مبالغ موصّلة' : 'Delivered amount'}</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {fmtMoney(man.deliveredAmount)} <span className="font-normal text-slate-400 text-[10px]">{currency}</span>
                    </p>
                </div>
            </div>

            {/* Cash Collection Progress */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {totalCash > 0 ? (
                    <>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">
                                {isAr ? 'تم تحصيل' : 'Collected'}{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">{fmtMoney(cashCollected)}</span>
                                {' / '}
                                {fmtMoney(totalCash)}
                            </span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                            <span className="text-slate-500">{isAr ? 'كاش مع الطيار' : 'Cash on hand'}</span>
                            <span className={`font-bold ${cashOnHand > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                                {fmtMoney(cashOnHand)} {currency}
                            </span>
                        </div>
                    </>
                ) : (
                    <p className="text-[11px] text-slate-400">
                        {isAr ? 'لا توجد طلبات نقدية' : 'No cash orders'}
                    </p>
                )}
            </div>
        </button>
    );
};

/* ============================================================
   Main Page Component
   ============================================================ */

const INITIAL_FILTERS = {
    startDate: '',
    endDate: '',
    deliveryManId: 'all',
    branchId: 'all',
    status: 'all',
    paymentMethod: 'all',
};

export default function DeliveryManReport() {
    const { isRTL } = useTranslation();
    const isAr = !!isRTL;
    const L = (en, ar) => (isAr ? ar : en);
    const currency = L('EGP', 'ج.م');

    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [selectedManId, setSelectedManId] = useState(null);

    // Delivery men list
    const { data: deliveryMenData } = useGet('delivery-men-list', '/api/restaurant/delivery-men');
    const deliveryMen = pickArray(
        deliveryMenData?.data?.data,
        deliveryMenData?.data,
        deliveryMenData
    );

    // Branches list
    const { data: branchesData } = useGet('branches-list', '/api/restaurant/branches');
    const branches = pickArray(
        branchesData?.data?.data,
        branchesData?.data,
        branchesData
    );

    // Query main report
    const {
        data: report = EMPTY_REPORT,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['delivery-man-report', filters],
        queryFn: async () => {
            const params = {};
            if (filters.startDate) params.startDate = new Date(`${filters.startDate}T00:00:00`).toISOString();
            if (filters.endDate) params.endDate = new Date(`${filters.endDate}T23:59:59.999`).toISOString();
            if (filters.deliveryManId && filters.deliveryManId !== 'all') params.deliveryManId = filters.deliveryManId;
            if (filters.branchId && filters.branchId !== 'all') params.branchId = filters.branchId;
            if (filters.status && filters.status !== 'all') params.status = filters.status;
            if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod;

            const res = await api.get('/api/restaurant/report/delivery-man', { params });
            return normalizeReport(res);
        },
    });

    const { summary, deliveryMen: reportMen, orders } = report;

    useEffect(() => {
        if (selectedManId && !reportMen.some((m) => m.deliveryManId === selectedManId)) {
            setSelectedManId(null);
        }
    }, [reportMen, selectedManId]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters(INITIAL_FILTERS);
        setSelectedManId(null);
    };

    const applyPreset = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        setFilters((prev) => ({
            ...prev,
            startDate: toInputDate(start),
            endDate: toInputDate(end),
        }));
    };

    const activeFiltersCount = Object.values(filters).filter((v) => v && v !== 'all').length;

    const orderRows = useMemo(() => {
        const unassignedLabel = isAr ? 'غير معيّن' : 'Unassigned';

        return orders
            .filter((o) => {
                if (!selectedManId) return true;
                return (o.deliveryManId || 'unassigned') === selectedManId;
            })
            .map((o) => {
                const address = parseAddress(o.shippingAddress);
                return {
                    ...o,
                    orderStatus: o.status,
                    deliveryManName: o.deliveryManName || unassignedLabel,
                    branchLabel: isAr ? (o.branchNameAr || o.branchName) : o.branchName,
                    zoneName: isAr
                        ? (address.addressZoneNameAr || address.addressZoneName || '')
                        : (address.addressZoneName || address.addressZoneNameAr || ''),
                };
            });
    }, [orders, selectedManId, isAr]);

    const selectedMan = reportMen.find((m) => m.deliveryManId === selectedManId);

    const columns = [
        {
            accessorKey: 'orderNumber',
            header: L('Order', 'الطلب'),
            cell: ({ row }) => (
                <div className="space-y-0.5 text-center">
                    <div className="font-bold text-slate-800 dark:text-slate-100">#{row.original.dailyOrderNumber}</div>
                    <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{row.original.orderNumber}</div>
                </div>
            ),
        },
        {
            accessorKey: 'customerName',
            header: L('Customer', 'العميل'),
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <div className="font-medium text-slate-800 dark:text-slate-100">{row.original.customerName || '-'}</div>
                    <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{row.original.customerPhone || ''}</div>
                </div>
            ),
        },
        {
            accessorKey: 'deliveryManName',
            header: L('Delivery man', 'الطيار'),
            cell: ({ row }) =>
                row.original.deliveryManId ? (
                    <span className="font-medium text-slate-700 dark:text-slate-200">{row.original.deliveryManName}</span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <UserX className="h-3.5 w-3.5" />
                        {row.original.deliveryManName}
                    </span>
                ),
        },
        {
            accessorKey: 'branchLabel',
            header: L('Branch', 'الفرع'),
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-300">{row.original.branchLabel || '-'}</span>,
        },
        {
            accessorKey: 'zoneName',
            header: L('Zone', 'المنطقة'),
            cell: ({ row }) => <span className="text-slate-600 dark:text-slate-300">{row.original.zoneName || '-'}</span>,
        },
        {
            accessorKey: 'orderStatus',
            header: L('Status', 'الحالة'),
            cell: ({ row }) => <StatusBadge status={row.original.orderStatus} isAr={isAr} />,
        },
        {
            accessorKey: 'paymentType',
            header: L('Payment', 'الدفع'),
            cell: ({ row }) => <PaymentBadge type={row.original.paymentType} isAr={isAr} />,
        },
        {
            accessorKey: 'totalAmount',
            header: L('Total', 'الإجمالي'),
            cell: ({ row }) => (
                <span className="font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {fmtMoney(row.original.totalAmount)} <span className="text-[11px] font-normal text-slate-400">{currency}</span>
                </span>
            ),
        },
        {
            accessorKey: 'isCashCollected',
            header: L('Cash collected', 'تحصيل الكاش'),
            cell: ({ row }) => {
                const o = row.original;
                if (!o.isCash) return <span className="text-slate-300">—</span>;
                if (o.isCashCollected) {
                    return (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 whitespace-nowrap">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {L('Collected', 'تم التحصيل')}
                        </span>
                    );
                }
                if (o.status === 'delivered') {
                    return (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 whitespace-nowrap">
                            <Clock className="h-3.5 w-3.5" />
                            {L('Not collected yet', 'لم يتم التحصيل')}
                        </span>
                    );
                }
                return <span className="text-slate-300">—</span>;
            },
        },
        {
            accessorKey: 'createdAt',
            header: L('Date', 'التاريخ'),
            cell: ({ row }) => (
                <span className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(row.original.createdAt, isAr)}</span>
            ),
        },
    ];

    return (
        <div className="container mx-auto py-5 space-y-6">
            {/* ===================== Title Header ===================== */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary shadow-sm">
                        <Truck className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                            {L('Delivery men report', 'تقرير عمال التوصيل')}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {L('Monitor orders, cash collection, and driver performance', 'متابعة الطلبات وتحصيل الكاش وأداء كل طيار')}
                        </p>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-xl gap-2 border-slate-200 bg-white shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-xs font-semibold"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw className={`h-4 w-4 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
                    {L('Refresh', 'تحديث البيانات')}
                </Button>
            </div>

            {/* ===================== Filters Box ===================== */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {L('Filter options', 'خيارات الفلترة')}
                        </h3>
                        {activeFiltersCount > 0 && (
                            <span className="rounded-full bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5">
                                {activeFiltersCount}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-xs font-medium rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-none"
                            onClick={() => applyPreset(1)}
                        >
                            <Calendar className="h-3 w-3 me-1 text-slate-400" />
                            {L('Today', 'اليوم')}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-xs font-medium rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-none"
                            onClick={() => applyPreset(7)}
                        >
                            {L('Last 7 days', 'آخر 7 أيام')}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-xs font-medium rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-none"
                            onClick={() => applyPreset(30)}
                        >
                            {L('Last 30 days', 'آخر 30 يوم')}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{L('From date', 'من تاريخ')}</Label>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{L('To date', 'إلى تاريخ')}</Label>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{L('Delivery man', 'الطيار')}</Label>
                        <Select
                            value={filters.deliveryManId}
                            onValueChange={(val) => handleFilterChange('deliveryManId', val)}
                        >
                            <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <SelectValue placeholder={L('All', 'الكل')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{L('All', 'الكل')}</SelectItem>
                                {deliveryMen.map((man) => (
                                    <SelectItem key={man.id} value={String(man.id)}>
                                        {man.name || man.fullName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{L('Branch', 'الفرع')}</Label>
                        <Select
                            value={filters.branchId}
                            onValueChange={(val) => handleFilterChange('branchId', val)}
                        >
                            <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <SelectValue placeholder={L('All', 'الكل')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{L('All', 'الكل')}</SelectItem>
                                {branches.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {isAr ? (b.nameAr || b.name) : b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{L('Order status', 'حالة الطلب')}</Label>
                        <Select
                            value={filters.status}
                            onValueChange={(val) => handleFilterChange('status', val)}
                        >
                            <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <SelectValue placeholder={L('All', 'الكل')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{L('All', 'الكل')}</SelectItem>
                                {STATUS_FILTER_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {isAr ? STATUS_META[s].ar : STATUS_META[s].en}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{L('Payment method', 'طريقة الدفع')}</Label>
                        <Select
                            value={filters.paymentMethod}
                            onValueChange={(val) => handleFilterChange('paymentMethod', val)}
                        >
                            <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <SelectValue placeholder={L('All', 'الكل')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{L('All', 'الكل')}</SelectItem>
                                {PAYMENT_FILTER_OPTIONS.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {isAr ? PAYMENT_META[p].ar : PAYMENT_META[p].en}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {activeFiltersCount > 0 && (
                    <div className="flex justify-end pt-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1 rounded-lg"
                        >
                            <RotateCcw className="h-3 w-3" />
                            {L('Reset filters', 'إعادة تعيين الفلاتر')}
                        </Button>
                    </div>
                )}
            </div>

            {/* ===================== Summary Dashboard ===================== */}
            {isLoading ? (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {[...Array(5)].map((_, i) => <SkeletonBlock key={i} className="h-20" />)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-20" />)}
                    </div>
                </div>
            ) : summary ? (
                <div className="space-y-3">
                    {/* Orders Breakdown */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <StatCard icon={Package} tone="slate" label={L('Total orders', 'إجمالي الطلبات')} value={summary.totalOrders ?? 0} />
                        <StatCard icon={CheckCircle2} tone="emerald" label={L('Delivered', 'تم التوصيل')} value={summary.totalDeliveredOrders ?? 0} />
                        <StatCard icon={Truck} tone="violet" label={L('Out for delivery', 'في الطريق')} value={summary.totalOutForDeliveryOrders ?? 0} />
                        <StatCard icon={Clock} tone="amber" label={L('Pending', 'قيد الانتظار')} value={summary.totalPendingOrders ?? 0} />
                        <StatCard icon={XCircle} tone="rose" label={L('Cancelled', 'ملغي')} value={summary.totalCancelledOrders ?? 0} />
                    </div>

                    {/* Financial Amounts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard
                            icon={Receipt}
                            tone="blue"
                            label={L('Total amount', 'إجمالي المبالغ')}
                            value={`${fmtMoney(summary.totalAmount)} ${currency}`}
                            sub={L('All orders', 'جميع الطلبات')}
                        />
                        <StatCard
                            icon={CheckCircle2}
                            tone="emerald"
                            label={L('Delivered amount', 'مبالغ الموصلة')}
                            value={`${fmtMoney(summary.deliveredAmount)} ${currency}`}
                        />
                        <StatCard
                            icon={Banknote}
                            tone="amber"
                            label={L('Cash with delivery men', 'كاش مع الطيارين')}
                            value={`${fmtMoney(summary.cashWithDeliveryMan ?? summary.cashOnHand)} ${currency}`}
                            sub={L('Not handed over yet', 'غير مسلم للمطعم')}
                        />
                        <StatCard
                            icon={Coins}
                            tone="emerald"
                            label={L('Cash collected', 'الكاش المحصّل')}
                            value={`${fmtMoney(summary.cashCollected)} ${currency}`}
                            sub={L('Handed over to restaurant', 'تم تسليمه للمطعم')}
                        />
                    </div>

                    {/* Payment Types Breakdown */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                            {L('Payment methods distribution', 'توزيع طرق الدفع')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { key: 'cash', amount: summary.totalCash, count: summary.totalCashOrders },
                                { key: 'visa', amount: summary.totalVisa, count: summary.totalVisaOrders },
                                { key: 'wallet', amount: summary.totalWallet, count: summary.totalWalletOrders },
                            ].map((p) => {
                                const meta = PAYMENT_META[p.key];
                                const tone = TONES[meta.tone];
                                const Icon = meta.Icon;
                                return (
                                    <div key={p.key} className="flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 p-3 border border-slate-100 dark:border-slate-800">
                                        <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${tone.box}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-slate-500">
                                                {isAr ? meta.ar : meta.en}
                                                <span className="mx-1.5 text-slate-300">•</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{p.count ?? 0}</span> {L('orders', 'طلب')}
                                            </p>
                                            <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                                {fmtMoney(p.amount)} <span className="text-xs font-normal text-slate-400">{currency}</span>
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* ===================== Drivers Grid ===================== */}
            {!isLoading && (
                <div className="space-y-3 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {L('Delivery drivers', 'فريق التوصيل')}
                            </h3>
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2.5 py-0.5">
                                {reportMen.length}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                            {L('Click a driver card to filter table below', 'اضغط على كارت الطيار لفلترة الجدول أدنها')}
                        </p>
                    </div>

                    {reportMen.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-sm text-slate-400">
                            {L('No drivers found for selected filters', 'لا يوجد طيارين مطبقين للفلتر المختار')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {reportMen.map((man) => (
                                <DeliveryManCard
                                    key={man.deliveryManId}
                                    man={man}
                                    isAr={isAr}
                                    currency={currency}
                                    selected={selectedManId === man.deliveryManId}
                                    onSelect={() =>
                                        setSelectedManId((prev) => (prev === man.deliveryManId ? null : man.deliveryManId))
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===================== Table View ===================== */}
            <div className="space-y-3 pt-2">
                {selectedMan && (
                    <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {L('Filtering orders for:', 'عرض طلبات:')}{' '}
                                <span className="font-bold text-primary">
                                    {selectedMan.deliveryManId === 'unassigned'
                                        ? L('Unassigned', 'غير معيّن')
                                        : selectedMan.deliveryManName}
                                </span>
                            </span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-slate-600 hover:text-slate-800 dark:text-slate-300 rounded-lg"
                            onClick={() => setSelectedManId(null)}
                        >
                            <XCircle className="h-3.5 w-3.5 me-1 text-slate-400" />
                            {L('Show all', 'إلغاء الفلتر')}
                        </Button>
                    </div>
                )}

                <GenericDataTable
                    title={`${L('Orders List', 'قائمة الطلبات')} (${orderRows.length})`}
                    columns={columns}
                    data={orderRows}
                    isLoading={isLoading}
                    actions={false}
                />
            </div>
        </div>
    );
}