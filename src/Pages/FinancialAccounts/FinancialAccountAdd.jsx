import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";

const FinancialAccountAdd = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // 1. جلب بيانات الحساب المالي (في حالة التعديل) باستخدام الـ select لتعديل الاستجابة مباشرة
    const { data: initialData, isLoading: isFetching } = useQuery({
        queryKey: ["financialAccounts", id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/FinancialAccount/${id}`);
            return data;
        },
        enabled: !!id && !state?.financialAccountData,
        select: (response) => {
            // الاستجابة تأتي على شكل مصفوفة داخل data.data
            const resData = response?.data?.[0] || response?.[0];

            if (resData && resData.account) {
                const acc = resData.account;
                return {
                    id: acc.id,
                    name: acc.name,
                    // الحسابات تستخدم branchId، نقوم بمطابقتها مع اسم حقل الـ Combobox المتوقع في الـ Body
                    branchId: acc.branchId,
                    // تحويل الـ boolean القادم من السيرفر لقيمة الـ Combobox المتوقعة (active / inactive)
                    isActive: acc.isActive ? "active" : "inactive",
                    in_pos: acc.in_POS ?? acc.in_pos ?? true,
                    balance: acc.balance,
                    imageUrl: acc.imageUrl,
                };
            }
            return null;
        }
    });

    // 2. جلب قائمة الفروع وتحويلها مباشرة داخل الـ select لتصبح خيارات جاهزة للـ Combobox
    const { data: branchOptions = [], isLoading: isBranchesLoading } = useQuery({
        queryKey: ["branches"],
        queryFn: async () => {
            const { data } = await api.get("/api/restaurant/branches");
            return data;
        },
        select: (response) => {
            const list = response?.data?.data || response || [];
            return list.map((branch) => ({
                value: branch.id,
                label: branch.name,
            }));
        }
    });

    // تجهيز البيانات الابتدائية النهائية (التعديل أو الإضافة الجديدة)
    const finalInitialData = state?.financialAccountData || initialData || {
        isActive: "active",
        in_pos: true
    };

    const statusOptions = [
        { value: "active", label: t("active") },
        { value: "inactive", label: t("inactive") },
    ];

    // بناء حقول الاستمارة بناءً على الـ Body المتوقع بالظبط
    const financialAccountFields = [
        { name: "name", label: t("name"), required: true },
        {
            name: "isActive",
            label: t("status"),
            type: "combobox",
            required: true,
            options: statusOptions,
        },
        {
            name: "branchId",
            label: t("branch_id"),
            type: "combobox",
            required: true,
            options: branchOptions,
        },
        {
            name: "in_pos",
            label: t("in_POS"),
            type: "combobox",
            required: true,
            options: [
                { value: true, label: t("Yes") },
                { value: false, label: t("No") },
            ],
        },
        { name: "imageUrl", label: t("imageUrl"), type: "file", required: false },
        { name: "balance", label: t("balance"), type: "number", required: false },
    ];

    // عرض الـ Spinner أثناء جلب البيانات الأساسية
    if ((id && isFetching) || isBranchesLoading) {
        return <LoadingSpinner />;
    }

    return (
        <AddPage
            title={id ? t("editFinancialAccount") : t("addFinancialAccount")}
            apiUrl={`/api/restaurant/FinancialAccount`}
            method={id ? "PUT" : "POST"}
            queryKey="financialAccounts"
            fields={financialAccountFields}
            initialData={finalInitialData}
            // دالة وسيطة لتجهيز البيانات بالشكل المطلوب النهائي للـ Body قبل الإرسال (تحويل isActive لبوليان مجدداً)
            transformData={(formData) => ({
                ...formData,
                isActive: formData.isActive === "active",
                in_pos: formData.in_pos === "Yes",
                imageUrl: formData.imageUrl,
                balance: formData.balance,
            })}
            onSuccessAction={(res) => {
                const targetId = res?.data?.data?.id || res?.data?.id || res?.id || finalInitialData?.id;
                navigate("/financialAccounts", { state: { highlightedId: targetId } });
            }}
        />
    );
};

export default FinancialAccountAdd;