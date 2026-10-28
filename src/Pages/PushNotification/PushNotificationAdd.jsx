import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import api from "@/api/axios";
import { useTranslation } from "@/hooks/useTranslation";

export default function PushNotificationAdd() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { t } = useTranslation();

  const API_URL = "/api/restaurant/pushed-notifications";
  const QUERY_KEY = "pushedNotifications";

  const {
    data: fetchedNotification,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["pushedNotification", id],
    queryFn: async () => {
      const { data } = await api.get(`${API_URL}/${id}`);
      return data?.data?.data ?? data?.data ?? data;
    },
    enabled: !!id && !location.state,
  });

  const notification = location.state || fetchedNotification;
  const toDateTimeLocal = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  const initialData = notification
    ? {
        ...notification,
        scheduledAt: toDateTimeLocal(notification.scheduledAt),
        scheduledEndAt: toDateTimeLocal(notification.scheduledEndAt),
      }
    : id
      ? { id }
      : null;

  const fields = [
    {
      name: "title",
      label: t("notificationTitle") || "عنوان الإشعار",
      type: "text",
      required: true,
    },
    {
      name: "body",
      label: t("notificationBody") || "محتوى الإشعار",
      type: "text",
      required: true,
    },
    {
      name: "mode",
      label: t("sendMode") || "طريقة الإرسال",
      type: "select",
      required: true,
      options: [
        { label: t("pushNow") || "إرسال فوراً (pushed_now)", value: "pushed_now" },
        { label: t("scheduleForLater") || "جدولة للإرسال لاحقاً (scheduled)", value: "scheduled" },
      ],
    },
  ];

  const transformPayload = (formData) => {
    const payload = {
      title: formData.title,
      body: formData.body,
      mode: formData.mode,
    };

    if (formData.mode === "scheduled") {
      payload.scheduledAt = new Date(formData.scheduledAt).toISOString();
      if (formData.scheduledEndAt) {
        payload.scheduledEndAt = new Date(formData.scheduledEndAt).toISOString();
      }
    }

    return payload;
  };

  if (id && isLoading) return <LoadingSpinner />;
  if (id && isError && !location.state) {
    return (
      <div role="alert" className="space-y-3 rounded-lg border border-destructive/30 p-4 text-sm">
        <p>{error?.response?.data?.message || t("errorLoadingNotification") || "تعذر تحميل بيانات الإشعار."}</p>
        <button type="button" onClick={() => refetch()} className="text-primary underline">
          {t("retry") || "إعادة المحاولة"}
        </button>
      </div>
    );
  }

  return (
    <AddPage
      title={t("pushedNotification") || "إشعار موجه"}
      apiUrl={API_URL}
      queryKey={QUERY_KEY}
      fields={fields}
      initialData={initialData}
      transformPayload={transformPayload}
      onSuccessAction={() => navigate("/push-notification")}    >
      {(formMethods) => {
        const selectedMode = formMethods.watch("mode");

        if (selectedMode !== "scheduled") return null;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t mt-4">
            <div className="space-y-2">
              <label htmlFor="scheduledAt" className="text-sm font-medium">
                {t("scheduledAt") || "وقت وتاريخ الجدولة"} <span className="text-destructive">*</span>
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                {...formMethods.register("scheduledAt", {
                  required: selectedMode === "scheduled",
                })}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {formMethods.formState.errors.scheduledAt && (
                <p className="text-destructive text-xs">{t("required") || "هذا الحقل مطلوب"}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="scheduledEndAt" className="text-sm font-medium">
                {t("scheduledEndAt") || "تاريخ انتهاء الجدولة (اختياري)"}
              </label>
              <input
                id="scheduledEndAt"
                type="datetime-local"
                {...formMethods.register("scheduledEndAt")}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        );
      }}
    </AddPage>
  );
}