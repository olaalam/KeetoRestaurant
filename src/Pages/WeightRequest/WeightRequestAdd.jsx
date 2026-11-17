import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useFieldArray } from "react-hook-form";
import {
  ArrowLeft,
  Ban,
  CalendarClock,
  Check,
  CircleDollarSign,
  PackageCheck,
  Plus,
  Save,
  Scale,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import AddPage from "@/components/AddPage";
import { useGet } from "@/hooks/useGet";
import { usePost } from "@/hooks/usePost";
import { useUpdate } from "@/hooks/useUpdate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BASE, KEY, StatusBadge, toArray, toObject } from "./WeightRequest";
import { useTranslation } from "@/hooks/useTranslation";

const isNum = (v) =>
  typeof v === "number" ? !Number.isNaN(v) : v != null && v !== "" && !Number.isNaN(Number(v));

const formatAmount = (value, language) =>
  isNum(value)
    ? new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value))
    : "—";

const formatWeight = (value, language) =>
  isNum(value)
    ? new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en", {
        maximumFractionDigits: 3,
      }).format(Number(value))
    : "—";

const formatDate = (value, language) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const localizedName = (item, language, nameKey = "name", arabicKey = "nameAr") =>
  language === "ar"
    ? item?.[arabicKey] || item?.[nameKey] || item?.foodName || item?.foodId || "—"
    : item?.[nameKey] || item?.[arabicKey] || item?.foodName || item?.foodId || "—";

// =====================================================================
// الصفحة: /weight-requests/edit/:id
// =====================================================================
export default function WeightRequestAdd() {
  const { t, language } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // الاستجابة تأتي على شكل: res.data.data.data.request و .items و .totals
  const { data: res, isLoading } = useGet([KEY, "detail"], `${BASE}/${id}`);

  // استخراج الـ request والـ items بناءً على الـ Response الجديد
  const responseData = toObject(res);
  const request = responseData?.request ?? responseData;
  const itemsList = toArray(responseData?.items ?? request?.items);
  const totals = responseData?.totals ?? request?.totals ?? {};
  const editable = request?.status === "awaiting_weighing";

  const backToList = () =>
    navigate("/weight-requests", { state: { pageIndex: location.state?.fromPage } });

  // جعل الـ initialData لـ ItemsEditor فارغة تماماً حتى لا تظهر منتجات الباك هنا ولا تُرسل في الريكويست
  const initialData = useMemo(() => {
    return {
      id,
      items: [],
    };
  }, [id]);

  // الـ payload النهائي لـ PUT /weight-requests/{id}/items (للأصناف الجديدة فقط)
  const transformPayload = (data) => ({
    items: (data.items ?? []).map((i) => ({
      foodId: i.foodId,
      quantity: Number(i.quantity) || 1,
      ...(isNum(i.weight) && { weight: Number(i.weight) }),
      ...(isNum(i.unitPrice) && { unitPrice: Number(i.unitPrice) }),
      variations: i.variations ?? [],
      addons: i.addons ?? [],
      ...(i.note && { note: i.note }),
    })),
  });

  if (isLoading || !request) {
    return <p className="py-20 text-center text-sm text-slate-400">{t("loading")}</p>;
  }

  const requestTitle = t("requestTitle").replace("{{id}}", String(id).slice(0, 8));
  const formattedCreatedAt = formatDate(request.createdAt, language);
  const formattedExpiresAt = formatDate(request.expiresAt, language);
  const itemCount = totals.totalItems ?? itemsList.length;
  const availableCount = totals.availableItems ?? itemsList.filter((item) => !item.isUnavailable).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <Button
        type="button"
        variant="ghost"
        className="gap-2 px-2 text-slate-600 hover:text-slate-900"
        onClick={backToList}
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("back")}
      </Button>

      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-white via-white to-primary/5 shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {requestTitle}
              </h1>
              <StatusBadge status={request.status} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 sm:text-sm">
              {formattedCreatedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4" />
                  {t("createdAt")}: {formattedCreatedAt}
                </span>
              )}
              {formattedExpiresAt && (
                <span>{t("expiresAt")}: {formattedExpiresAt}</span>
              )}
            </div>
          </div>
          <div className="rounded-xl border bg-white/80 px-4 py-3 text-start shadow-sm">
            <p className="text-xs font-medium text-slate-500">{t("requestId")}</p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{String(id).slice(0, 8)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={CircleDollarSign}
          label={t("estimatedSubtotal")}
          value={`${formatAmount(totals.weighedSubtotal ?? totals.subtotal, language)} ${t("currency")}`}
          tone="emerald"
        />
        <SummaryCard
          icon={UtensilsCrossed}
          label={t("itemsCount")}
          value={itemCount}
          tone="blue"
        />
        <SummaryCard
          icon={PackageCheck}
          label={t("availableItems")}
          value={`${availableCount} / ${itemCount}`}
          tone="amber"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t("weightAndPrice")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("weightRequestItemsHint")}</p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {itemsList.length} {t("itemsCount")}
          </span>
        </div>
        <div className="space-y-3">
          {itemsList.length ? itemsList.map((item) => (
            <WeighingRow
              key={item.cartItemId ?? item.id}
              requestId={id}
              item={item}
              editable={editable}
            />
          )) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
              {t("noItems")}
            </div>
          )}
        </div>
      </section>

      {editable && <DecisionBar requestId={id} onDone={backToList} />}

      {/* سكشن تعديل/إضافة الأصناف (Edit Order items) مع الحفاظ عليه فارغاً من منتجات الباك */}
      {editable && (
        <AddPage
          title={t("orderItems")}
          apiUrl={`${BASE}/${id}/items`}
          bypassIdInEdit
          queryKey={KEY}
          method="PUT"
          initialData={initialData}
          transformPayload={transformPayload}
        >
          {(form) => <ItemsEditor form={form} />}
        </AddPage>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1", tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 truncate text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

// =====================================================================
// وزن / سعر / غير متاح لصنف واحد
// PUT /weight-requests/{id}/items/{cartItemId}
// =====================================================================
function WeighingRow({ requestId, item, editable }) {
  const { t, language } = useTranslation();
  const cartItemId = item.cartItemId ?? item.id;
  const update = useUpdate(BASE, KEY);
  const [weight, setWeight] = useState(item.finalWeight ?? item.orderedWeight ?? "");
  const [price, setPrice] = useState(item.unitPrice ?? "");
  const [askReason, setAskReason] = useState(false);
  const [reason, setReason] = useState("");

  const customUrl = `${BASE}/${requestId}/items/${cartItemId}`;
  const unavailable = item.isUnavailable || item.status === "unavailable";
  const currentWeight = item.finalWeight ?? item.orderedWeight;
  const hasChanges =
    (isNum(weight) && Number(weight) !== Number(currentWeight)) ||
    (isNum(price) && Number(price) !== Number(item.unitPrice));

  // بيبعت بس اللي اتغير
  const save = () => {
    const payload = {};
    if (isNum(weight) && Number(weight) !== Number(currentWeight))
      payload.finalWeight = Number(weight);
    if (isNum(price) && Number(price) !== Number(item.unitPrice))
      payload.unitPrice = Number(price);
    if (Object.keys(payload).length) update.mutate({ customUrl, payload });
  };

  return (
    <article className={cn(
      "overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md",
      unavailable && "border-rose-200 bg-rose-50/30"
    )}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
            {item.image ? (
              <img src={item.image} alt={localizedName(item, language)} className="h-full w-full object-cover" />
            ) : (
              <UtensilsCrossed className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-slate-900">
                {localizedName(item, language) || item.foodId}
              </h3>
              {unavailable && (
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                  {t("unavailable")}
                </span>
              )}
              {item.sold_by && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {item.sold_by === "weight" ? t("soldByWeight") : t("soldByUnit")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{t("quantity")}: <strong className="text-slate-700">{item.quantity ?? 1}</strong></span>
              <span>
                {t("orderedWeight")}:{" "}
                <strong className="text-slate-700">
                  {formatWeight(item.orderedWeight, language)} {item.weightUnit || "kg"}
                </strong>
              </span>
            </div>
            {!!item.variations?.length && (
              <div className="flex flex-wrap gap-1.5">
                {item.variations.map((variation) => {
                  const variationPrice = variation.additionalPrice ?? variation.price;

                  return (
                    <span
                      key={variation.optionId ?? variation.id}
                      className="inline-flex flex-wrap items-center gap-x-1 rounded-md border bg-white px-2 py-1 text-[11px] text-slate-600"
                    >
                      <span>
                        {localizedName(variation, language, "variationName", "variationNameAr")}:{" "}
                        {localizedName(variation, language, "optionName", "optionNameAr")}
                      </span>
                      {isNum(variationPrice) && (
                        <span className="font-semibold text-emerald-700">
                          +{formatAmount(variationPrice, language)} {t("currency")}
                          {variation.priceMode === "per_weight" && ` / ${t("perWeight")}`}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
            {!!item.addons?.length && (
              <div className="flex flex-wrap gap-1.5">
                {item.addons.map((addon) => (
                  <span
                    key={addon.addonId ?? addon.id}
                    className="rounded-md border bg-white px-2 py-1 text-[11px] text-slate-600"
                  >
                    {localizedName(addon, language, "name", "nameAr")}
                  </span>
                ))}
              </div>
            )}
            {item.note && <p className="text-xs text-slate-500">{t("note")}: {item.note}</p>}
          </div>
        </div>
        <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 sm:text-end">
          <p className="text-[11px] text-slate-500">{t("total")}</p>
          <p className="font-bold text-slate-900">
            {formatAmount(item.totalPrice, language)} <span className="text-xs font-medium text-slate-500">{t("currency")}</span>
          </p>
        </div>
      </div>

      {editable && !unavailable && (
        <div className="border-t bg-slate-50/70 px-4 py-4 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
            <label className="space-y-1.5 text-xs font-medium text-slate-600">
              {t("weightKg")}
              <Input
                type="number"
                min="0"
                step="0.001"
                className="h-10 bg-white"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600">
              {t("pricePerKg")}
              <Input
                type="number"
                min="0"
                step="0.01"
                className="h-10 bg-white"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <Button
              type="button"
              className="h-10 gap-2"
              disabled={update.isPending || !hasChanges}
              onClick={save}
            >
              <Save className="h-4 w-4" /> {t("save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setAskReason((o) => !o)}
            >
              <Ban className="h-4 w-4" /> {t("unavailable")}
            </Button>
          </div>

          {askReason && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input placeholder={t("unavailableReason")} value={reason}
                onChange={(e) => setReason(e.target.value)} />
              <Button type="button" variant="destructive" disabled={!reason.trim()}
                onClick={() =>
                  update.mutate(
                    { customUrl, payload: { unavailable: true, reason } },
                    { onSuccess: () => setAskReason(false) }
                  )
                }>
                {t("confirm")}
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// =====================================================================
// تأكيد / رفض
// =====================================================================
function DecisionBar({ requestId, onDone }) {
  const { t } = useTranslation();
  const confirm = usePost(`${BASE}/${requestId}/confirm`, "post", KEY);
  const reject = usePost(`${BASE}/${requestId}/reject`, "post", KEY);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <Card className="overflow-hidden border-amber-200 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        {rejecting ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Input value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder={t("rejectReason")} autoFocus />
            <Button variant="destructive" disabled={!reason.trim() || reject.isPending}
              onClick={() => reject.mutate({ reason }, { onSuccess: onDone })}>
              {t("confirmReject")}
            </Button>
            <Button variant="outline" onClick={() => setRejecting(false)}>{t("cancel")}</Button>
          </div>
        ) : (
          <>
            <div>
              <p className="font-semibold text-slate-900">{t("decisionTitle")}</p>
              <p className="mt-1 text-sm text-slate-500">{t("decisionHint")}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-2" onClick={() => setRejecting(true)}>
              <X className="h-4 w-4" /> {t("reject")}
            </Button>
            <Button className="gap-2" disabled={confirm.isPending}
              onClick={() => confirm.mutate({}, { onSuccess: onDone })}>
              <Check className="h-4 w-4" /> {t("confirmAndSend")}
            </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================================
// محرر الأصناف داخل AddPage (children) + إضافة من available-foods
// =====================================================================
function ItemsEditor({ form }) {
  const { t, language } = useTranslation();
  const { control, register } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const [soldBy, setSoldBy] = useState("weight");
  const [foodId, setFoodId] = useState("");

  const { data: res } = useGet([KEY, "available-foods"], `${BASE}/available-foods`, {
    sold_by: soldBy,
  });
  const foods = toArray(res);

  const addFood = () => {
    const food = foods.find((f) => String(f.id) === foodId);
    if (!food) return;
    append({
      foodId: food.id,
      foodName: localizedName(food, language),
      quantity: 1,
      weight: "",
      unitPrice: "",
      note: "",
      variations: [],
      addons: [],
    });
    setFoodId("");
  };

  return (
    <div className="space-y-4">
      {fields.map((f, i) => (
        <div key={f.id} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Scale className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{f.foodName || f.foodId}</p>
                <p className="text-xs text-slate-500">{t("orderItem")} {i + 1}</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon"
              aria-label={t("removeItem")}
              className="h-9 w-9 shrink-0 text-slate-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Input type="number" min="1" className="h-10 bg-slate-50" placeholder={t("quantity")}
              {...register(`items.${i}.quantity`, { valueAsNumber: true })} />
            <Input type="number" min="0" step="0.001" className="h-10 bg-slate-50" placeholder={t("weight")}
              {...register(`items.${i}.weight`, { valueAsNumber: true })} />
            <Input type="number" min="0" step="0.01" className="h-10 bg-slate-50" placeholder={t("pricePerKg")}
              {...register(`items.${i}.unitPrice`, { valueAsNumber: true })} />
            <Input className="h-10 bg-slate-50" placeholder={t("note")}
              {...register(`items.${i}.note`)} />
          </div>
        </div>
      ))}

      <div className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] p-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{t("addItemTitle")}</p>
          <p className="mt-1 text-xs text-slate-500">{t("addItemHint")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={soldBy} onValueChange={(v) => { setSoldBy(v); setFoodId(""); }}>
          <SelectTrigger className="h-10 w-full bg-white sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="weight">{t("soldByWeight")}</SelectItem>
            <SelectItem value="unit">{t("soldByUnit")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={foodId} onValueChange={setFoodId}>
          <SelectTrigger className="h-10 flex-1 bg-white">
            <SelectValue placeholder={t("selectFood")} />
          </SelectTrigger>
          <SelectContent>
            {foods.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>
                {localizedName(f, language)}{f.price != null ? ` — ${formatAmount(f.price, language)} ${t("currency")}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" className="h-10 gap-2 sm:shrink-0" disabled={!foodId} onClick={addFood}>
          <Plus className="h-4 w-4" /> {t("add")}
        </Button>
        </div>
      </div>
    </div>
  );
}