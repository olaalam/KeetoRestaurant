import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTaxText } from "./TaxesText";

const TAX_URL = "/api/restaurant/tax";
const QUERY_KEY = "taxes";

// ===== helpers =====
const useGetBody = (key, url, enabled = true) =>
  useQuery({
    queryKey: key,
    queryFn: async () => (await api.get(url)).data,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

// الـ API بيرجع {success, data: {message, data: ...}} فبننزل لحد ما نلاقي القيمة
const unwrapObj = (body) => body?.data?.data ?? body?.data ?? body ?? {};

const unwrapList = (body, keys = []) => {
  let d = body;
  for (let i = 0; i < 3 && d && !Array.isArray(d); i++) {
    const k = [...keys, "data", "items", "rows"].find((key) => Array.isArray(d?.[key]));
    if (k) return d[k];
    d = d.data;
  }
  return Array.isArray(d) ? d : [];
};

// يحول أي شكل (string أو object) إلى { value, label }
const toOptions = (list, isRTL, translate = (v) => v) =>
  list.map((o) => {
    if (typeof o === "string") return { value: o, label: String(translate(o)) };
    const value = String(o.value ?? o.id ?? o.branchId ?? o.foodId);
    const label =
      o.label ??
      (isRTL ? o.nameAr || o.name : o.name || o.nameAr) ??
      o.title ??
      value;
    return { value, label: String(translate(label)) };
  });

// اختيار مجموعة من /tax/options لو موجودة، وإلا قيم افتراضية
const pickOptions = (opts, keys, fallback, isRTL, tx) => {
  const key = keys.find((k) => Array.isArray(opts?.[k]));
  return toOptions(key ? opts[key] : fallback, isRTL, tx);
};

const idsFrom = (direct, related) => {
  if (Array.isArray(direct)) return direct.map(String);
  if (Array.isArray(related))
    return related
      .map((x) => x?.id ?? x?.branchId ?? x?.foodId)
      .filter((v) => v != null)
      .map(String);
  return [];
};

export default function TaxesAdd() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { tx, isRTL } = useTaxText();

  const { data: optionsBody } = useGetBody(["tax-options"], `${TAX_URL}/options`);
  const { data: branchesBody } = useGetBody(["tax-branches"], `${TAX_URL}/branches`);
  const branchData = branchesBody?.data;
  
  const { data: foodsBody } = useGetBody(["tax-foods"], `${TAX_URL}/foods`);
  const foodData = foodsBody?.data;
  const { data: detailBody, isLoading: detailLoading } = useQuery({
    queryKey: ["tax", id],
    queryFn: async () => (await api.get(`${TAX_URL}/${id}`)).data,
    enabled: isEdit,
  });

  // ===== options =====
  const options = useMemo(() => {
    const opts = unwrapObj(optionsBody);
    return {
      amountType: pickOptions(opts, ["amountTypes", "amountType"], ["percentage", "value"], isRTL, tx),
      taxType: pickOptions(opts, ["taxTypes", "taxType"], ["include", "exclude"], isRTL, tx),
      modules: pickOptions(opts, ["modules"], ["all", "online"], isRTL, tx),
      moduleType: pickOptions(opts, ["moduleTypes", "moduleType"], ["all", "app"], isRTL, tx),
    };
  }, [optionsBody, isRTL]); // eslint-disable-line react-hooks/exhaustive-deps

  const branchOptions = useMemo(
    () => toOptions(unwrapList(branchData, ["branches", "items"]), isRTL),
    [branchData, isRTL],
  );
  const foodOptions = useMemo(
    () => toOptions(unwrapList(foodData, ["foods", "items"]), isRTL),
    [foodData, isRTL],
  );

  // ===== initialData للتعديل =====
  const initialData = useMemo(() => {
    if (!isEdit) return undefined;
    const d = detailBody?.data?.data ?? detailBody?.data ?? detailBody;
    if (!d) return undefined;
    return {
      id: d.id ?? id,
      name: d.name ?? "",
      nameAr: d.nameAr ?? "",
      nameFr: d.nameFr ?? "",
      amount: d.amount != null ? Number(d.amount) : "",
      amountType: d.amountType ?? "percentage",
      taxType: d.taxType ?? "exclude",
      modules: d.modules ?? "all",
      moduleType: d.moduleType ?? "all",
      branchIds: idsFrom(d.branchIds, d.branches),
      foodIds: idsFrom(d.foodIds, d.foods),
      status: d.status ?? "active",
    };
  }, [detailBody, isEdit, id]);

  const statusOptions = [
    { value: "active", label: tx("active") },
    { value: "inactive", label: tx("inactive") },
  ];

  const fields = [
    { name: "name", label: tx("name"), required: true },
    { name: "nameAr", label: tx("nameAr"), required: true },
    { name: "nameFr", label: tx("nameFr") },
    { name: "amount", label: tx("amount"), type: "number", required: true },
    { name: "amountType", label: tx("amountType"), type: "select", required: true, options: options.amountType },
    { name: "taxType", label: tx("taxType"), type: "select", required: true, options: options.taxType },
    { name: "modules", label: tx("modules"), type: "select", required: true, options: options.modules },
    { name: "moduleType", label: tx("moduleType"), type: "select", required: true, options: options.moduleType },
    { name: "branchIds", label: tx("branches"), type: "multi-select", options: branchOptions },
    { name: "foodIds", label: tx("foods"), type: "multi-select", options: foodOptions },
    { name: "status", label: tx("status"), type: "select", required: true, options: statusOptions },
  ];

  // نبني الـ payload بشكل صريح علشان نتفادى أي حقول زيادة (زي id)
  const transformPayload = (data) => {
    const payload = {
      name: data.name?.trim(),
      nameAr: data.nameAr?.trim(),
      amount: Number(data.amount),
      amountType: data.amountType,
      taxType: data.taxType,
      modules: data.modules,
      moduleType: data.moduleType,
      branchIds: data.branchIds ?? [],
      foodIds: data.foodIds ?? [],
      status: data.status,
    };
    if (data.nameFr?.trim()) payload.nameFr = data.nameFr.trim();
    return payload;
  };

  if (isEdit && detailLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner className="h-6 w-6 text-primary" />
      </div>
    );
  }

  return (
    <AddPage
      title={tx("tax")}
      apiUrl={TAX_URL}
      queryKey={QUERY_KEY}
      method={isEdit ? "PUT" : undefined}
      fields={fields}
      initialData={initialData}
      transformPayload={transformPayload}
      onSuccessAction={() => navigate("/taxes")}
    />
  );
}