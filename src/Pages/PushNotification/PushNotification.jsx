import React from "react";
import { useNavigate } from "react-router-dom";
import GenericDataTable from "@/components/GenericDataTable";
import { useGet } from "@/hooks/useGet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Send, Clock, SendHorizontal, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

export default function PushNotifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const API_URL = "/api/restaurant/pushed-notifications";
  const QUERY_KEY = "pushedNotifications";

  const { data, isLoading } = useGet(QUERY_KEY, API_URL);

  const notificationsList = Array.isArray(data)
    ? data
    : Array.isArray(data?.data?.data)
      ? data.data.data
      : Array.isArray(data?.data)
        ? data.data
        : [];

  // Mutation لإرسال الإشعار المجدول فوراً
  const sendNowMutation = useMutation({
    mutationFn: async (id) => {
      return await api.post(`${API_URL}/${id}/send-now`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEY]);
      toast.success(t("notificationSentSuccessfully") || "تم إرسال الإشعار بنجاح");
    },
    onError: (error) => {
      console.error("Failed to send notification now:", error);
      toast.error(t("failedToSendNotification") || "حدث خطأ أثناء إرسال الإشعار");
    },
  });

  const columns = [
    {
      accessorKey: "title",
      header: t("title") || "العنوان",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "body",
      header: t("body") || "محتوى الرسالة",
      cell: ({ row }) => (
        <span className="text-slate-600 dark:text-slate-300 max-w-xs truncate block">
          {row.original.body}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("status") || "حالة الإرسال",
      cell: ({ row }) => {
        const { isSent, mode } = row.original;

        if (isSent) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("sent") || "تم الإرسال"}
            </span>
          );
        }

        if (mode === "scheduled") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              {t("scheduled") || "مجدول"}
            </span>
          );
        }

        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Send className="w-3.5 h-3.5" />
            {t("pushedNow") || "مباشر"}
          </span>
        );
      },
    },
    {
      accessorKey: "sentAt",
      header: t("sentAt") || "وقت الإرسال",
      cell: ({ row }) => {
        const dateStr = row.original.sentAt;
        if (!dateStr) return <span className="text-slate-400">-</span>;
        return (
          <span className="text-xs font-mono">
            {new Date(dateStr).toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "scheduledAt",
      header: t("scheduledAt") || "وقت الجدولة",
      cell: ({ row }) => {
        const dateStr = row.original.scheduledAt;
        if (!dateStr) return <span className="text-slate-400">-</span>;
        return (
          <span className="text-xs font-mono">
            {new Date(dateStr).toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "sendNowAction",
      header: t("sendNow") || "إرسال الآن",
      cell: ({ row }) => {
        const { isSent, mode, id } = row.original;
        
        // إخفاء زر الإرسال إذا كان الإشعار قد أُرسل بالفعل أو لم يكن مجدولاً
        if (isSent || mode !== "scheduled") return null;

        return (
          <Button
            size="sm"
            variant="outline"
            disabled={sendNowMutation.isPending}
            onClick={() => sendNowMutation.mutate(id)}
            className="h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 transition-colors"
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>{t("sendNowBtn") || "إرسال الآن"}</span>
          </Button>
        );
      },
    },
  ];

  return (
    <GenericDataTable
      title={t("pushedNotifications") || "الإشعارات الموجهة"}
      data={notificationsList}
      columns={columns}
      isLoading={isLoading}
      apiUrl={API_URL}
      deleteApiUrl={API_URL}
      queryKey={QUERY_KEY}
      onAdd={() => navigate("/push-notification/add")}
      onEdit={(row) => navigate(`/push-notification/edit/${row.id}`, { state: row })}
    />
  );
}