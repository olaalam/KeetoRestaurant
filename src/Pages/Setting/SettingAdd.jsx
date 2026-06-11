import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller } from 'react-hook-form';

const SettingPageAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();

    const { data: fullData, isLoading: isFetching } = useQuery({
        queryKey: ['setting', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/restaurantsetting`);
            return data.data; 
        },
        enabled: !!id && !state?.settingData,
    });

    const rawData = state?.settingData || fullData;

    const initialData = React.useMemo(() => {
        if (!rawData) return null;
        return {
            settings: rawData.settings,
            schedules: rawData.schedules || []
        };
    }, [rawData]);

    const daysOfWeekNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

    const handleTransformPayload = (data) => {
        return {
            settings: {
                foodManagement: data.foodManagement ?? false,
                scheduledDelivery: data.scheduledDelivery ?? false,
                reviewsSection: data.reviewsSection ?? false,
                posSection: data.posSection ?? true,
                selfDelivery: data.selfDelivery ?? false,
                homeDelivery: data.homeDelivery ?? true,
                takeaway: data.takeaway ?? true,
                orderSubscription: data.orderSubscription ?? false,
                instantOrder: data.instantOrder ?? false,
                halalTagStatus: data.halalTagStatus ?? true,
                dineIn: data.dineIn ?? true,
                vegType: data.vegType || "BOTH",
                canEditOrder: data.canEditOrder ?? true,
                minOrderAmount: Number(data.minOrderAmount) || 50,
                minDeliveryTime: Number(data.minDeliveryTime) || 15,
                maxDeliveryTime: Number(data.maxDeliveryTime) || 45,
                isAlwaysOpen: data.isAlwaysOpen ?? false,
                isSameTimeEveryDay: data.isSameTimeEveryDay ?? false
            },
            schedules: data.schedules || []
        };
    };

    if (id && isFetching) return <LoadingSpinner />;

    return (
        <AddPage
            title="إعدادات المتجر"
            apiUrl="/api/restaurant/restaurantsetting" 
            queryKey={['storeSettings']}
            method="PUT" 
            transformPayload={handleTransformPayload}
            initialData={{
                foodManagement: false,
                posSection: true,
                homeDelivery: true,
                takeaway: true,
                halalTagStatus: true,
                dineIn: true,
                vegType: "BOTH",
                minOrderAmount: 50,
                minDeliveryTime: 15,
                maxDeliveryTime: 45,
                schedules: Array.from({ length: 7 }, (_, index) => ({
                    dayOfWeek: index,
                    isOffDay: index === 5, 
                    openingTime: index === 5 ? "" : "09:00", // يفضل استخدام نص فارغ بدلاً من null لتجنب مشاكل الـ Controlled Inputs
                    closingTime: index === 5 ? "" : "23:00"
                }))
            }}
        >
            {/* 💡 تأكدي أن كومبوننت AddPage يمرر setValue في الـ arguments للميثود */}
            {({ control, register, watch, setValue }) => {
                const schedulesWatch = watch("schedules") || [];

                return (
                    <div className="space-y-8 mt-6 border-t pt-6 col-span-full">
                        
                        {/* قسم الـ Settings */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-primary">الإعدادات العامة (Settings)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/20 p-4 rounded-lg">
                                
                                {[
                                    { name: "foodManagement", label: "إدارة الطعام" },
                                    { name: "scheduledDelivery", label: "التوصيل المجدول" },
                                    { name: "reviewsSection", label: "قسم التقييمات" },
                                    { name: "posSection", label: "قسم الـ POS" },
                                    { name: "selfDelivery", label: "التوصيل الذاتي" },
                                    { name: "homeDelivery", label: "التوصيل للمنزل" },
                                    { name: "takeaway", label: "تيك أواي" },
                                    { name: "orderSubscription", label: "اشتراك الطلبات" },
                                    { name: "instantOrder", label: "طلب فوري" },
                                    { name: "halalTagStatus", label: "علامة حلال" },
                                    { name: "dineIn", label: "داخل المطعم" },
                                    { name: "canEditOrder", label: "إمكانية تعديل الطلب" },
                                    { name: "isAlwaysOpen", label: "مفتوح دائماً" },
                                    { name: "isSameTimeEveryDay", label: "نفس المواعيد يومياً" },
                                ].map((sw) => (
                                    <div key={sw.name} className="flex items-center justify-between p-2 border rounded bg-white">
                                        <Label htmlFor={sw.name} className="cursor-pointer">{sw.label}</Label>
                                        <Controller
                                            name={sw.name}
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <Switch checked={!!value} onCheckedChange={onChange} id={sw.name} />
                                            )}
                                        />
                                    </div>
                                ))}

                                <div className="space-y-2">
                                    <Label>نوع الطعام (Veg Type)</Label>
                                    <input {...register("vegType")} className="w-full p-2 border rounded-md text-sm h-10 bg-white" placeholder="BOTH" />
                                </div>
                                <div className="space-y-2">
                                    <Label>أقل قيمة للطلب</Label>
                                    <Input type="number" {...register("minOrderAmount", { valueAsNumber: true })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>أقل وقت للتوصيل (دقائق)</Label>
                                    <Input type="number" {...register("minDeliveryTime", { valueAsNumber: true })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>أقصى وقت للتوصيل (دقائق)</Label>
                                    <Input type="number" {...register("maxDeliveryTime", { valueAsNumber: true })} />
                                </div>
                            </div>
                        </div>

                        <hr className="my-6" />

                        {/* قسم الـ Schedules */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-primary">مواعيد العمل (Schedules)</h3>
                            <div className="space-y-4 bg-muted/10 p-4 rounded-lg">
                                {daysOfWeekNames.map((dayName, index) => {
                                    const isOff = schedulesWatch[index]?.isOffDay;
                                    return (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 border rounded bg-white shadow-sm">
                                            <span className="font-semibold text-sm">{dayName}</span>
                                            
                                            {/* تحويل اليوم لإجازة أو عمل */}
                                            <div className="flex items-center gap-2">
                                                <Controller
                                                    name={`schedules.${index}.isOffDay`}
                                                    control={control}
                                                    render={({ field: { onChange, value } }) => (
                                                        <Switch 
                                                            checked={!!value} 
                                                            onCheckedChange={(checked) => {
                                                                onChange(checked);
                                                                // ✅ تم استبدال الـ hacks القديمة بـ setValue الآمنة تماماً
                                                                if (checked) {
                                                                    setValue(`schedules.${index}.openingTime`, "");
                                                                    setValue(`schedules.${index}.closingTime`, "");
                                                                } else {
                                                                    setValue(`schedules.${index}.openingTime`, "09:00");
                                                                    setValue(`schedules.${index}.closingTime`, "23:00");
                                                                }
                                                            }} 
                                                        />
                                                    )}
                                                />
                                                <Label className="text-xs text-muted-foreground">يوم إجازة</Label>
                                            </div>

                                            {/* وقت الفتح */}
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs shrink-0">من:</Label>
                                                <Input 
                                                    type="time" 
                                                    disabled={isOff} 
                                                    {...register(`schedules.${index}.openingTime`)} 
                                                    className="h-8"
                                                />
                                            </div>

                                            {/* وقت الغلق */}
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs shrink-0">إلى:</Label>
                                                <Input 
                                                    type="time" 
                                                    disabled={isOff} 
                                                    {...register(`schedules.${index}.closingTime`)} 
                                                    className="h-8"
                                                />
                                            </div>

                                            <input type="hidden" value={index} {...register(`schedules.${index}.dayOfWeek`, { valueAsNumber: true })} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                );
            }}
        </AddPage>
    );
};

export default SettingPageAdd;