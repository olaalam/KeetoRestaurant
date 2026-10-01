// أدوات مشتركة بين صفحة المحفظة وصفحة الحركات

export const toNum = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

// سالب = أحمر ، موجب = أخضر ، صفر = رمادي
export function amountStyle(value) {
    const n = toNum(value);
    if (n > 0) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', prefix: '+' };
    if (n < 0) return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', prefix: '' };
    return { text: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', prefix: '' };
}

export const formatMoney = (value) =>
    toNum(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// طرق الدفع / أنواع الحركة القادمة من الـ API
export function methodMeta(method, t) {
    switch (method) {
        case 'cash':
        case 'cash_on_delivery':
            return { label: t('Cash') || 'كاش', cls: 'bg-orange-100 text-orange-700' };
        case 'pending_service_fee':
            return { label: t('Service Fee') || 'رسوم خدمة', cls: 'bg-amber-100 text-amber-700' };
        case 'visa':
        case 'card':
        case 'online':
            return { label: t('Visa') || 'فيزا', cls: 'bg-blue-100 text-blue-700' };
        default:
            return { label: method || '-', cls: 'bg-slate-100 text-slate-700' };
    }
}