import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useTranslation } from '@/hooks/useTranslation';
import { useGet } from '@/hooks/useGet';

const getBranchIds = (data) => {
    const branches = Array.isArray(data?.branches) ? data.branches : [];
    let branchIds = data?.branchIds;

    if (typeof branchIds === 'string') {
        try {
            branchIds = JSON.parse(branchIds);
        } catch {
            branchIds = branches;
        }
    }

    if (!Array.isArray(branchIds)) {
        branchIds = branches;
    }

    return branchIds
        .map((branch) => {
            const branchId = typeof branch === 'object' && branch !== null ? branch.id : branch;
            return branchId == null ? null : String(branchId);
        })
        .filter(Boolean);
};

export default function FreeDeliveryAdd() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // قراءة الـ id من الـ URL
    const { t, isRTL } = useTranslation();

    const baseUrl = "/api/restaurant/free-delivery";
    const { data: branchesResponse, isLoading: isBranchesLoading, isError: isBranchesError } = useGet(
        'free-delivery-branches',
        '/api/restaurant/branches'
    );
    const branchesList = Array.isArray(branchesResponse?.data?.data)
        ? branchesResponse.data.data
        : Array.isArray(branchesResponse?.data)
            ? branchesResponse.data
            : Array.isArray(branchesResponse)
                ? branchesResponse
                : [];
    const branchOptions = branchesList.map((branch) => ({
        value: String(branch.id),
        label: isRTL ? branch.nameAr || branch.name : branch.name || branch.nameAr,
    }));

    // جلب البيانات برقم الـ ID فقط عند وجود id
    const { data: fetchedData, isLoading } = useGet(
        `free-delivery`,
        id ? `${baseUrl}` : baseUrl,
        
    );

    // الأولوية لبيانات الـ API المجلوبة ثم الممررة من Navigate
    const apiData = fetchedData?.data?.data || fetchedData?.data || fetchedData;
    const loadedInitialData = apiData || location.state?.editData || location.state?.initialData || null;
    const initialData = loadedInitialData
        ? {
            ...loadedInitialData,
            branchIds: getBranchIds(loadedInitialData),
        }
        : null;

    const fields = [
        {
            name: 'minOrderAmount',
            label: t('minOrderAmount'),
            type: 'number',
            required: true
        },
        {
            name: 'maxOrdersPerUser',
            label: t('maxOrdersPerUser'),
            type: 'number',
            required: true
        },
        {
            name: 'startDate',
            label: t('startDate'),
            type: 'date',
            required: true
        },
        {
            name: 'endDate',
            label: t('endDate'),
            type: 'date',
            required: true
        },
        {
            name: 'branchIds',
            label: t('branches') || t('branchesLabel') || 'Branches',
            type: 'multi-select',
            options: branchOptions,
            required: true
        },
        {
            name: 'status',
            label: t('status'),
            type: 'select',
            options: [
                { label: t('active'), value: 'active' },
                { label: t('inactive'), value: 'inactive' }
            ],
            required: true
        }
    ];

    if ((id && isLoading) || isBranchesLoading) {
        return <div className="p-6 text-center">{t('loading') || 'جاري التحميل...'}</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {isBranchesError && (
                <p className="mb-4 text-sm text-destructive">
                    {isRTL ? 'تعذر تحميل الفروع. يرجى المحاولة مرة أخرى.' : 'Could not load branches. Please try again.'}
                </p>
            )}
<AddPage
    title={t('freeDeliverySettings')}
    apiUrl={id ? `${baseUrl}` : baseUrl}
    queryKey="free-delivery-list"
    method="POST"
    fields={fields}
    initialData={initialData}
    transformPayload={(data) => ({
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
    })}
    onSuccessAction={() => navigate('/free-delivery')}
/>
        </div>
    );
}