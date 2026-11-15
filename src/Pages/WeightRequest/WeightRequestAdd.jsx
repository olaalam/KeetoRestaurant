import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useFieldArray } from "react-hook-form";
import { Ban, Check, Plus, Save, Trash2, X } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BASE, KEY, StatusBadge, toArray, toObject } from "./WeightRequest";
import { useTranslation } from "@/hooks/useTranslation";

const isNum = (v) =>
  typeof v === "number" ? !Number.isNaN(v) : v != null && v !== "" && !Number.isNaN(Number(v));

// =====================================================================
// الصفحة: /weight-requests/edit/:id
// =====================================================================
export default function WeightRequestAdd() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: res, isLoading } = useGet([KEY, "detail"], `${BASE}/${id}`);
  const request = toObject(res);
  const editable = request?.status === "awaiting_weighing";

  const backToList = () =>
    navigate("/weight-requests", { state: { pageIndex: location.state?.fromPage } });

  // الداتا اللي بتدخل الفورم (أصناف الطلب)
  const initialData = useMemo(() => {
    if (!request) return null;
    return {
      id,
      items: (request.items ?? []).map((i) => ({
        cartItemId: i.cartItemId ?? i.id,
        foodId: i.foodId,
        foodName: i.foodName ?? i.name ?? "",
        quantity: i.quantity ?? 1,
        weight: i.weight ?? "",
        unitPrice: i.unitPrice ?? "",
        note: i.note ?? "",
        variations: (i.variations ?? []).map((v) => ({ optionId: v.optionId ?? v.id })),
        addons: (i.addons ?? []).map((a) => ({ addonId: a.addonId ?? a.id })),
      })),
    };
  }, [request, id]);

  // الـ payload النهائي لـ PUT /weight-requests/{id}
  const transformPayload = (data) => ({
    items: (data.items ?? []).map((i) => ({
      ...(i.cartItemId && { cartItemId: i.cartItemId }),
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">{t("requestTitle", { id: String(id).slice(0, 8) })}</h1>
        <StatusBadge status={request.status} />
      </div>

      {/* 1) الوزن لكل صنف (تعديل فوري) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("weightAndPrice")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(request.items ?? []).map((item) => (
            <WeighingRow
              key={item.cartItemId ?? item.id}
              requestId={id}
              item={item}
              editable={editable}
            />
          ))}
        </CardContent>
      </Card>

      {/* 2) تأكيد / رفض */}
      {editable && <DecisionBar requestId={id} onDone={backToList} />}

      {/* 3) تعديل الأصناف نفسها (AddPage => PUT /weight-requests/{id}) */}
      {editable && (
        <AddPage
          title={t("orderItems")}
          apiUrl={BASE}
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

// =====================================================================
// وزن / سعر / غير متاح لصنف واحد
// PUT /weight-requests/{id}/items/{cartItemId}
// =====================================================================
function WeighingRow({ requestId, item, editable }) {
  const { t } = useT();
  const cartItemId = item.cartItemId ?? item.id;
  const update = useUpdate(BASE, KEY);
  const [weight, setWeight] = useState(item.finalWeight ?? item.weight ?? "");
  const [price, setPrice] = useState(item.unitPrice ?? "");
  const [askReason, setAskReason] = useState(false);
  const [reason, setReason] = useState("");

  const customUrl = `${BASE}/${requestId}/items/${cartItemId}`;
  const unavailable = item.unavailable || item.status === "unavailable";

  // بيبعت بس اللي اتغير (Options 1-3)
  const save = () => {
    const payload = {};
    if (isNum(weight) && Number(weight) !== Number(item.finalWeight ?? item.weight))
      payload.finalWeight = Number(weight);
    if (isNum(price) && Number(price) !== Number(item.unitPrice))
      payload.unitPrice = Number(price);
    if (Object.keys(payload).length) update.mutate({ customUrl, payload });
  };

  return (
    <div className={cn("rounded-xl border p-3 space-y-3", unavailable && "opacity-50")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{item.foodName ?? item.name ?? item.foodId}</p>
          <p className="text-xs text-slate-400">
            {t("quantity")}: {item.quantity}
          </p>
        </div>
        {item.lineTotal != null && <span className="text-sm font-bold">{item.lineTotal}</span>}
      </div>

      {editable && !unavailable && (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs space-y-1">
              {t("weightKg")}
              <Input type="number" step="0.001" className="w-28 h-9" value={weight}
                onChange={(e) => setWeight(e.target.value)} />
            </label>
            <label className="text-xs space-y-1">
              {t("pricePerKg")}
              <Input type="number" step="0.01" className="w-28 h-9" value={price}
                onChange={(e) => setPrice(e.target.value)} />
            </label>
            <Button type="button" size="sm" className="gap-1" disabled={update.isPending} onClick={save}>
              <Save className="h-4 w-4" /> {t("save")}
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1 text-rose-600"
              onClick={() => setAskReason((o) => !o)}>
              <Ban className="h-4 w-4" /> {t("unavailable")}
            </Button>
          </div>

          {askReason && (
            <div className="flex gap-2">
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
        </>
      )}
    </div>
  );
}

// =====================================================================
// تأكيد / رفض
// POST /weight-requests/{id}/confirm  |  /reject {reason}
// =====================================================================
function DecisionBar({ requestId, onDone }) {
  const { t } = useT();
  const confirm = usePost(`${BASE}/${requestId}/confirm`, "post", KEY);
  const reject = usePost(`${BASE}/${requestId}/reject`, "post", KEY);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <Card>
      <CardContent className="pt-6">
        {rejecting ? (
          <div className="flex gap-2">
            <Input value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder={t("rejectReason")} autoFocus />
            <Button variant="destructive" disabled={!reason.trim() || reject.isPending}
              onClick={() => reject.mutate({ reason }, { onSuccess: onDone })}>
              {t("confirmReject")}
            </Button>
            <Button variant="outline" onClick={() => setRejecting(false)}>{t("cancel")}</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="gap-2" onClick={() => setRejecting(true)}>
              <X className="h-4 w-4" /> {t("reject")}
            </Button>
            <Button className="gap-2" disabled={confirm.isPending}
              onClick={() => confirm.mutate({}, { onSuccess: onDone })}>
              <Check className="h-4 w-4" /> {t("confirmAndSend")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================================
// محرر الأصناف داخل AddPage (children) + إضافة من available-foods
// =====================================================================
function ItemsEditor({ form }) {
  const { t } = useT();
  const { control, register } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const [soldBy, setSoldBy] = useState("weight");
  const [foodId, setFoodId] = useState("");

  // categoryId / subCategoryId: ضيفهم في الـ params لما نحدد endpoint التصنيفات
  const { data: res } = useGet([KEY, "available-foods"], `${BASE}/available-foods`, {
    sold_by: soldBy,
  });
  const foods = toArray(res);

  const addFood = () => {
    const food = foods.find((f) => String(f.id) === foodId);
    if (!food) return;
    append({
      foodId: food.id,
      foodName: food.name,
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
        <div key={f.id} className="rounded-xl border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{f.foodName || f.foodId}</span>
            <Button type="button" variant="ghost" size="icon"
              className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input type="number" min="1" className="w-24 h-9" placeholder={t("quantity")}
              {...register(`items.${i}.quantity`, { valueAsNumber: true })} />
            <Input type="number" step="0.001" className="w-28 h-9" placeholder={t("weight")}
              {...register(`items.${i}.weight`, { valueAsNumber: true })} />
            <Input type="number" step="0.01" className="w-28 h-9" placeholder={t("pricePerKg")}
              {...register(`items.${i}.unitPrice`, { valueAsNumber: true })} />
            <Input className="flex-1 min-w-[160px] h-9" placeholder={t("note")}
              {...register(`items.${i}.note`)} />
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2 rounded-xl border border-dashed p-3">
        <Select value={soldBy} onValueChange={(v) => { setSoldBy(v); setFoodId(""); }}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="weight">{t("soldByWeight")}</SelectItem>
            <SelectItem value="unit">{t("soldByUnit")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={foodId} onValueChange={setFoodId}>
          <SelectTrigger className="flex-1 min-w-[180px] h-9">
            <SelectValue placeholder={t("selectFood")} />
          </SelectTrigger>
          <SelectContent>
            {foods.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="sm" className="gap-1 h-9" disabled={!foodId} onClick={addFood}>
          <Plus className="h-4 w-4" /> {t("add")}
        </Button>
      </div>
    </div>
  );
}