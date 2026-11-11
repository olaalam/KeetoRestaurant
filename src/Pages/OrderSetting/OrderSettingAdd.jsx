import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Controller } from 'react-hook-form';
import { useTranslation } from '@/hooks/useTranslation';

const OrderSettingAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: fullData, isLoading: isFetching } = useQuery({
        queryKey: ['setting', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/restaurantsetting/order-now`);
            return data.data;
        },
        enabled: !!id && !state?.settingData,
    });

    const rawData = state?.settingData || fullData;

    const defaultInitialData = {
        orderNowSetting: {
            hotline: true,
            branches: true,
            name: true,
            orderNow: true,
            eMenu: false,
            socialMedia: true,
            menuPdf: false,
            iosIcon: true,
            androidIcon: true
        }
    };

    const initialData = React.useMemo(() => {
        if (!rawData) return defaultInitialData;
        const rawOrderNow = rawData.orderNowSetting || rawData.order_now_setting || rawData;

        return {
            orderNowSetting: {
                hotline: rawOrderNow.hotline ?? true,
                branches: rawOrderNow.branches ?? true,
                name: rawOrderNow.name ?? true,
                orderNow: rawOrderNow.orderNow ?? true,
                eMenu: rawOrderNow.eMenu ?? false,
                socialMedia: rawOrderNow.socialMedia ?? true,
                menuPdf: rawOrderNow.menuPdf ?? false,
                iosIcon: rawOrderNow.iosIcon ?? true,
                androidIcon: rawOrderNow.androidIcon ?? true
            }
        };
    }, [JSON.stringify(rawData)]);

    // إرجاع البايود المطلوب فقط بالشكل الذي ذكرتيه
    const handleTransformPayload = (data) => {
        return {
            orderNowSetting: {
                hotline: !!data.orderNowSetting?.hotline,
                branches: !!data.orderNowSetting?.branches,
                name: !!data.orderNowSetting?.name,
                orderNow: !!data.orderNowSetting?.orderNow,
                eMenu: !!data.orderNowSetting?.eMenu,
                socialMedia: !!data.orderNowSetting?.socialMedia,
                menuPdf: !!data.orderNowSetting?.menuPdf,
                iosIcon: !!data.orderNowSetting?.iosIcon,
                androidIcon: !!data.orderNowSetting?.androidIcon
            }
        };
    };

    if (id && isFetching) return <LoadingSpinner />;

    const orderNowKeys = [
        { key: "hotline", label: t('hotlineLabel', { defaultValue: 'Hotline' }) },
        { key: "branches", label: t('branchesLabel', { defaultValue: 'Branches' }) },
        { key: "name", label: t('nameLabel', { defaultValue: 'Name' }) },
        { key: "orderNow", label: t('orderNowLabel', { defaultValue: 'Order Now' }) },
        { key: "eMenu", label: t('eMenuLabel', { defaultValue: 'E-Menu' }) },
        { key: "socialMedia", label: t('socialMediaLabel', { defaultValue: 'Social Media' }) },
        { key: "menuPdf", label: t('menuPdfLabel', { defaultValue: 'Menu PDF' }) },
        { key: "iosIcon", label: t('iosIconLabel', { defaultValue: 'iOS Icon' }) },
        { key: "androidIcon", label: t('androidIconLabel', { defaultValue: 'Android Icon' }) },
    ];

    return (
        <AddPage
            title={t('orderNowSettingsTitle', { defaultValue: 'Order Now Settings' })}
            apiUrl="/api/restaurant/restaurantsetting/order-now"
            queryKey={['setting']}
            method="PUT"
            bypassIdInEdit={true}
            transformPayload={handleTransformPayload}
            initialData={initialData}
            onSuccessAction={() => {
                navigate("/order-setting");
            }}
        >
            {(methods) => {
                const { control } = methods;

                return (
                    <div className="space-y-6 mt-6 col-span-full">
                        <div className="bg-purple-50/40 p-6 rounded-lg border border-purple-100">
                            <h3 className="text-lg font-bold text-purple-700 mb-4">
                                {t('orderNowSettingsTitle', { defaultValue: 'Order Now Settings' })}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {orderNowKeys.map((item) => (
                                    <div key={item.key} className="flex items-center justify-between p-3 border rounded bg-white shadow-sm">
                                        <Label htmlFor={`orderNowSetting.${item.key}`} className="cursor-pointer font-medium text-sm text-gray-700">
                                            {item.label}
                                        </Label>
                                        <Controller
                                            name={`orderNowSetting.${item.key}`}
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <Switch checked={!!value} onCheckedChange={onChange} id={`orderNowSetting.${item.key}`} />
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }}
        </AddPage>
    );
};

export default OrderSettingAdd;