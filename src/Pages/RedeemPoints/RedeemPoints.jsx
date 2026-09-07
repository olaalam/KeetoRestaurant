import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Gift,
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coins,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGet } from "@/hooks/useGet";
import { usePost } from "@/hooks/usePost";
import { useTranslation } from "@/hooks/useTranslation";
import useAuthStore from "../../store/useAuthStore";

function InfoRow({ icon: Icon, label, value, dir }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p
          className={`text-sm font-bold text-gray-900 truncate ${
            dir === "ltr" ? "dir-ltr text-right" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function RedeemPoints() {
  const { t } = useTranslation();
  const [codeInput, setCodeInput] = useState("");
  const [activeCode, setActiveCode] = useState(null);
  
  // 1. جلب بيانات اليوزر والفرع من الـ Auth Store
  const userBranchId = useAuthStore((state) => state.user?.branchId || state.branchId);

  const [selectedBranchId, setSelectedBranchId] = useState(userBranchId || "");

  // تحديث الـ selected branch لو اتغير من الستور
  useEffect(() => {
    if (userBranchId) {
      setSelectedBranchId(userBranchId);
    }
  }, [userBranchId]);

  // 2. Fetch Branches (هنعمل fetch بس لو اليوزر ملوش فرع محدد)
  const { data: branchesData, isFetching: isFetchingBranches } = useGet(
    ["branchesList"],
    "/api/restaurant/branches",
    {},
    { enabled: !userBranchId } 
  );

  const branches = branchesData?.data?.data || branchesData?.data || [];

  // 3. Fetch redemption code details (GET request with Query Param)
  const verifyUrl = activeCode 
    ? `/api/restaurant/points-orders/verify/${activeCode}?branchId=${selectedBranchId}` 
    : null;

  const {
    data: verifyData,
    isFetching,
    isError,
  } = useGet(
    ["pointsOrderVerify", activeCode, selectedBranchId],
    verifyUrl,
    {},
    { enabled: !!activeCode && !!selectedBranchId, retry: false }
  );

  const order = verifyData?.data?.data || verifyData?.data || verifyData || null;

  // 4. Action mutation for accept/reject (POST request with Body Param)
  const actionMutation = usePost(
    "/api/restaurant/points-orders",
    "post",
    "pointsOrderVerify"
  );

  const handleSearch = () => {
    if (!selectedBranchId) {
      alert(t("pleaseSelectBranch") || "Please select a branch first");
      return;
    }
    const trimmed = codeInput.trim();
    if (!trimmed) return;
    setActiveCode(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleAction = (actionType) => {
    if (!order || !selectedBranchId) return;

    actionMutation.mutate(
      {
        redeemRequestId: order.redeemRequestId || order.id,
        action: actionType, // "approve" | "reject"
        branchId: selectedBranchId, // إرسال الـ branchId في الـ Body
      },
      {
        onSuccess: () => {
          setActiveCode(null);
          setCodeInput("");
        },
      }
    );
  };

  const isApproving = actionMutation.isPending && actionMutation.variables?.action === "approve";
  const isRejecting = actionMutation.isPending && actionMutation.variables?.action === "reject";

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-gray-900">
        {t("redeemPoints") || "Redeem Points"}
      </h1>

      {/* Branch Selector (يظهر فقط لو اليوزر ملوش فرع ثابت) */}
      {!userBranchId && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setActiveCode(null); // ريست الكود لو غير الفرع
              }}
              disabled={isFetchingBranches}
              className="w-full h-14 pl-12 pr-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none"
            >
              <option value="" disabled>
                {t("selectBranch") || "Select Branch..."}
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} 
                </option>
              ))}
            </select>
            {isFetchingBranches && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedBranchId} // نقفل البحث لو لسه مختارش الفرع
            placeholder={t("enterTheCode") || "Enter redemption code"}
            className="w-full h-14 pr-12 pl-4 bg-gray-100 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-60"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isFetching || !codeInput.trim() || !selectedBranchId}
          className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base shrink-0 disabled:opacity-60"
        >
          {isFetching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t("search") || "Search"
          )}
        </Button>
      </div>

      {/* Loading State */}
      {isFetching && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium">
            {t("loading") || "Searching..."}
          </span>
        </div>
      )}

      {/* Error State */}
      {!isFetching && isError && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {t("codeNotFound") || "Code not found or invalid for this branch"}
          </p>
        </div>
      )}

      {/* Order Details Card */}
      {!isFetching && !isError && order && (
        <Card className="rounded-3xl border-0 shadow-xl overflow-hidden py-0 gap-0">
          {/* Header */}
          <div className="bg-primary/5 border-b border-primary/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  {t("redeemDetails") || "Redemption Request Details"}
                </p>
                <p className="text-sm font-bold text-gray-900 dir-ltr text-right">
                  #{order.code || activeCode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {order.isExpired ? (
                <Badge className="rounded-lg bg-red-100 text-red-700 border border-red-200 px-3 py-1 font-semibold">
                  {t("expired") || "Expired"}
                </Badge>
              ) : (
                order.status && (
                  <Badge className="rounded-lg bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 font-semibold capitalize">
                    {order.status}
                  </Badge>
                )
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Item Card */}
            {order.foodName && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                {order.foodImage && (
                  <img
                    src={order.foodImage}
                    alt={order.foodName}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium">
                    {t("foodItem") || "Food Item"}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {order.foodName}
                  </h3>
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              <InfoRow
                icon={User}
                label={t("customerName") || "Customer Name"}
                value={order.userName}
              />
              <InfoRow
                icon={Phone}
                label={t("phone") || "Phone Number"}
                value={order.userPhone || order.phone}
                dir="ltr"
              />
              <InfoRow
                icon={Coins}
                label={t("pointsDeducted") || "Points Deducted"}
                value={
                  order.pointsDeducted !== undefined
                    ? `${order.pointsDeducted} ${t("points") || "Points"}`
                    : order.points
                }
              />
              <InfoRow
                icon={Calendar}
                label={t("createdAt") || "Request Date"}
                value={formatDate(order.createdAt)}
              />
              <InfoRow
                icon={Clock}
                label={t("expiresAt") || "Expiration Date"}
                value={formatDate(order.expiresAt)}
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => handleAction("reject")}
                disabled={actionMutation.isPending || order.isExpired}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
              >
                {isRejecting ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <XCircle className="w-4 h-4 ml-2" />
                )}
                {t("reject") || "Reject"}
              </Button>

              <Button
                onClick={() => handleAction("approve")}
                disabled={actionMutation.isPending || order.isExpired}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
              >
                {isApproving ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                )}
                {t("accept") || "Accept"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}