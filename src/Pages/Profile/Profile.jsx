import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Lock, User, Mail, Phone } from "lucide-react";
import { toast } from 'sonner';
import { useTranslation } from "@/hooks/useTranslation";
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Profile() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // --- 1. فورم البيانات الأساسية ---
    const profileForm = useForm({
        defaultValues: { name: '', email: '', phone: '' }
    });

    // --- 2. فورم تغيير كلمة المرور ---
    const passwordForm = useForm({
        defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' }
    });

    // --- 3. جلب بيانات الملف الشخصي (GET) ---
    const { data: profileData, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['restaurantProfile'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/profile');
            // استخراج البيانات بناءً على الهيكل المعتاد في مشروعكِ
            return res.data?.data?.data || res.data?.data?.profile || res.data;
        }
    });

    // عمل تعبئة تلقائية (Reset) للفورم فور تحميل البيانات من السيرفر
    useEffect(() => {
        if (profileData) {
            profileForm.reset({
                name: profileData.name || '',
                email: profileData.email || '',
                phone: profileData.phone || ''
            });
        }
    }, [profileData, profileForm]);

    // --- 4. Mutation تحديث البيانات الأساسية (PUT) ---
    const updateProfileMutation = useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.put('/api/restaurant/Profile', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['restaurantProfile']);
            toast.success(t("profileUpdatedSuccessfully") || "تم تحديث الملف الشخصي بنجاح");
        },
        onError: (error) => {
            const serverErrorMessage = error?.response?.data?.error?.message || t("failedToUpdateProfile");
            toast.error(serverErrorMessage || "فشل تحديث البيانات");
        }
    });

    // --- 5. Mutation تغيير كلمة المرور (PUT) ---
    const changePasswordMutation = useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.put('/api/restaurant/Profile/change-password', payload);
            return data;
        },
        onSuccess: () => {
            toast.success(t("passwordChangedSuccessfully") || "تم تغيير كلمة المرور بنجاح");
            passwordForm.reset(); // تفريغ حقول كلمة المرور بعد النجاح
        },
        onError: (error) => {
            const serverErrorMessage = error?.response?.data?.error?.message || t("failedToChangePassword");
            toast.error(serverErrorMessage || "فشل تغيير كلمة المرور");
        }
    });

    // --- تسليم استمارة البيانات الأساسية ---
    const onProfileSubmit = (data) => {
        updateProfileMutation.mutate(data);
    };

    // --- تسليم استمارة كلمة المرور ---
    const onPasswordSubmit = (data) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error(t("passwordsDoNotMatch") || "كلمات المرور الجديدة غير متطابقة");
            return;
        }
        changePasswordMutation.mutate({
            oldPassword: data.oldPassword,
            newPassword: data.newPassword
        });
    };

    if (isLoadingProfile) return <LoadingSpinner />;

    return (
        <div className="container mx-auto py-10 max-w-6xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("profileTitle") || "الملف الشخصي"}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {t("profileDescription") || "إدارة معلومات الحساب وإعدادات الأمان الخاصة بمتجرك."}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* كرت البيانات الأساسية */}
                <Card className="lg:col-span-2 shadow-sm border">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            {t("restaurantInfo") || "بيانات المطعم"}
                        </CardTitle>
                        <CardDescription>
                            {t("updateRestaurantInfoDesc") || "تعديل البيانات الأساسية الظاهرة للنظام."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t("name") || "الاسم"}</Label>
                                    <div className="relative">
                                        <Input
                                            id="name"
                                            placeholder={t("enterName") || "أدخل الاسم"}
                                            {...profileForm.register('name', { required: true })}
                                            className={profileForm.formState.errors.name ? "border-destructive pl-9" : "pl-9"}
                                        />
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    </div>
                                    {profileForm.formState.errors.name && <p className="text-destructive text-xs">{t("required")}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t("phone") || "رقم الهاتف"}</Label>
                                    <div className="relative">
                                        <Input
                                            id="phone"
                                            placeholder={t("enterPhone") || "أدخل رقم الهاتف"}
                                            {...profileForm.register('phone', { required: true })}
                                            className={profileForm.formState.errors.phone ? "border-destructive pl-9" : "pl-9"}
                                        />
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    </div>
                                    {profileForm.formState.errors.phone && <p className="text-destructive text-xs">{t("required")}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">{t("email") || "البريد الإلكتروني"}</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={t("enterEmail") || "example@domain.com"}
                                        {...profileForm.register('email', { required: true })}
                                        className={profileForm.formState.errors.email ? "border-destructive pl-9" : "pl-9"}
                                    />
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                </div>
                                {profileForm.formState.errors.email && <p className="text-destructive text-xs">{t("required")}</p>}
                            </div>

                            <div className="flex justify-end pt-4 border-t">
                                <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full md:w-32">
                                    {updateProfileMutation.isPending ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("savingBtn") || "جاري الحفظ..."}</>
                                    ) : (
                                        <><Save className="mr-2 h-4 w-4" /> {t("saveBtn") || "حفظ التغييرات"}</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* كرت تغيير كلمة المرور */}
                <Card className="shadow-sm border">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            {t("changePassword") || "تغيير كلمة المرور"}
                        </CardTitle>
                        <CardDescription>
                            {t("secureAccountDesc") || "تحديث كلمة المرور الخاصة بحسابك بانتظام للأمان."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="oldPassword">{t("oldPassword") || "كلمة المرور الحالية"}</Label>
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...passwordForm.register('oldPassword', { required: true })}
                                    className={passwordForm.formState.errors.oldPassword ? "border-destructive" : ""}
                                />
                                {passwordForm.formState.errors.oldPassword && <p className="text-destructive text-xs">{t("required")}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">{t("newPassword") || "كلمة المرور الجديدة"}</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...passwordForm.register('newPassword', { required: true, minLength: 6 })}
                                    className={passwordForm.formState.errors.newPassword ? "border-destructive" : ""}
                                />
                                {passwordForm.formState.errors.newPassword && (
                                    <p className="text-destructive text-xs">
                                        {passwordForm.formState.errors.newPassword.type === 'required' ? t("required") : (t("passwordTooShort") || "يجب ألا تقل عن 6 أحرف")}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">{t("confirmPassword") || "تأكيد كلمة المرور الجديدة"}</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...passwordForm.register('confirmPassword', { required: true })}
                                    className={passwordForm.formState.errors.confirmPassword ? "border-destructive" : ""}
                                />
                                {passwordForm.formState.errors.confirmPassword && <p className="text-destructive text-xs">{t("required")}</p>}
                            </div>

                            <div className="pt-4 border-t">
                                <Button type="submit" variant="destructive" disabled={changePasswordMutation.isPending} className="w-full">
                                    {changePasswordMutation.isPending ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("updatingBtn") || "جاري التحديث..."}</>
                                    ) : (
                                        t("updatePasswordBtn") || "تحديث كلمة المرور"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}