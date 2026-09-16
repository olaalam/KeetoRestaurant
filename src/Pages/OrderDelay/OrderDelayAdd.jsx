import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Controller } from "react-hook-form";
import AddPage from "@/components/AddPage";
import { useGet } from "@/hooks/useGet";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// عدّلي المسارين دول لو مختلفين عندك
const API_URL = "/api/restaurant/order-delay-alerts";
const BRANCHES_API_URL = "/api/restaurant/branches";
const QUERY_KEY = "orderDelayAlerts";

const ORDER_STATUS_OPTIONS = [
  { value: "pending", labelAr: "قيد الانتظار", labelEn: "Pending" },
  { value: "preparing", labelAr: "قيد التحضير", labelEn: "Preparing" },
  { value: "accepted", labelAr: "جاهز", labelEn: "Ready" },
  { value: "out_for_delivery", labelAr: "قيد التوصيل", labelEn: "Out for Delivery" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OrderDelayAdd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();

  const { data: alertResponse, isLoading: isLoadingAlert } = useGet(
    QUERY_KEY,
    id ? `${API_URL}/${id}` : null
  );
  // الشكل المتوقع: { success, data: { message, data: {...} } } أو { success, data: {...} }
  const existingAlert = alertResponse?.data?.data || alertResponse?.data || alertResponse || null;

  // الشكل الفعلي: { success, data: { message, data: [...] } }
  const { data: branchesResponse } = useGet("branches", BRANCHES_API_URL);
  const branchesList = Array.isArray(branchesResponse)
    ? branchesResponse
    : Array.isArray(branchesResponse?.data)
    ? branchesResponse.data
    : Array.isArray(branchesResponse?.data?.data)
    ? branchesResponse.data.data
    : [];

  // ترجمة اسم الفرع حسب اللغة الحالية (عربي/إنجليزي)
  const getBranchLabel = (branch) =>
    isRTL ? branch.nameAr || branch.name : branch.name || branch.nameAr;

  const branchOptions = branchesList.map((b) => ({
    value: b.id,
    label: getBranchLabel(b),
  }));

  const orderStatusOptions = ORDER_STATUS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: isRTL ? opt.labelAr : opt.labelEn,
  }));

  const fields = [
    {
      name: "name",
      label: t("name") || "اسم التنبيه",
      type: "text",
      required: true,
    },
    {
      name: "maxDelayMinutes",
      label: t("DelayMinutes") || "الحد الأقصى للتأخير (دقيقة)",
      type: "number",
      required: true,
    },
    {
      name: "orderStatus",
      label: t("orderStatus") || "حالات الطلب",
      type: "multi-select",
      options: orderStatusOptions,
      required: true,
    },
    {
      name: "isActive",
      label: t("active") || "مفعل",
      type: "switch",
    },
  ];

  const transformPayload = (data) => ({
    ...data,
    branchIds: data.allBranches ? undefined : data.branchIds,
  });

  if (id && isLoadingAlert) return null;

  return (
    <AddPage
      title={t("orderDelay") || "تنبيه تأخير الطلبات"}
      apiUrl={API_URL}
      queryKey={QUERY_KEY}
      method={id ? "PUT" : "POST"}
      fields={fields}
      initialData={
        id
          ? { ...existingAlert, id }
          : { isActive: true, allBranches: true, emails: [], orderStatus: [], branchIds: [] }
      }
      transformPayload={transformPayload}
      onSuccessAction={() => navigate("/delay-order")}
      redirectTo="/delay-order"
    >
      {(formMethods) => (
        <EmailsAndBranchesFields
          formMethods={formMethods}
          branchOptions={branchOptions}
          t={t}
        />
      )}
    </AddPage>
  );
}

function EmailsAndBranchesFields({ formMethods, branchOptions, t }) {
  const { control, watch, setValue } = formMethods;
  const allBranches = watch("allBranches");

  return (
    <div className="space-y-6">
      {/* الإيميلات */}
      <Controller
        name="emails"
        control={control}
        defaultValue={[]}
        rules={{
          validate: (val) =>
            (Array.isArray(val) && val.length > 0) || (t("required") || "مطلوب"),
        }}
        render={({ field: { value = [], onChange }, fieldState: { error } }) => (
          <EmailsInput value={value} onChange={onChange} error={error} t={t} />
        )}
      />

      {/* تفعيل كل الفروع */}
      <div className="flex items-center gap-3">
        <Controller
          name="allBranches"
          control={control}
          defaultValue={true}
          render={({ field: { value, onChange } }) => (
            <Switch
              checked={!!value}
              onCheckedChange={(checked) => {
                onChange(checked);
                if (checked) setValue("branchIds", []);
              }}
            />
          )}
        />
        <Label>{t("allBranches") || "كل الفروع"}</Label>
      </div>

      {/* اختيار فروع محددة - يظهر فقط لو مش كل الفروع */}
      {!allBranches && (
        <Controller
          name="branchIds"
          control={control}
          defaultValue={[]}
          rules={{
            validate: (val) =>
              (Array.isArray(val) && val.length > 0) || (t("required") || "مطلوب"),
          }}
          render={({ field: { value = [], onChange }, fieldState: { error } }) => (
            <div className="space-y-2">
              <Label>
                {t("branches") || "الفروع"} <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                {branchOptions.length === 0 && (
                  <span className="text-xs text-slate-400">
                    {t("noBranchesFound") || "لا يوجد فروع"}
                  </span>
                )}
                {branchOptions.map((opt) => {
                  const checked = value.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-1.5 text-sm px-2 py-1 rounded border cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onChange(
                            checked
                              ? value.filter((v) => v !== opt.value)
                              : [...value, opt.value]
                          )
                        }
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
              {error && <p className="text-destructive text-xs">{error.message}</p>}
            </div>
          )}
        />
      )}
    </div>
  );
}

function EmailsInput({ value, onChange, error, t }) {
  const [draft, setDraft] = useState("");

  const addEmail = () => {
    const trimmed = draft.trim();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) return;
    if (!value.includes(trimmed)) onChange([...value, trimmed]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <Label>
        {t("emails") || "البريد الإلكتروني"} <span className="text-destructive">*</span>
      </Label>
      <div className="flex gap-2">
        <Input
          type="email"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addEmail();
            }
          }}
          placeholder="example@mail.com"
        />
        <Button type="button" variant="outline" onClick={addEmail}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-sm"
            >
              {email}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== email))}
                className="hover:bg-primary-foreground/20 rounded-full w-3 h-3 inline-flex items-center justify-center text-[10px] font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="text-destructive text-xs">{error.message}</p>}
    </div>
  );
}