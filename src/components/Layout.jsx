import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";
import useSidebarStore from "@/store/useSidebarStore";
import useAuthStore from "@/store/useAuthStore";
import { LogOut, ChevronLeft, ChevronRight, UserCircle2, Bell, ShoppingBag, XCircle, Sun, Moon } from "lucide-react";
import useThemeStore from "@/store/useThemeStore";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useGet } from "@/hooks/useGet";
import { useUpdate } from "@/hooks/useUpdate";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { getModules } from "@/config/modules";

export default function Layout() {
  const storedModule = useSidebarStore((state) => state.activeModule);
  const setActiveModule = useSidebarStore((state) => state.setActiveModule);
  const { setLogout, user } = useAuthStore((state) => state);
  const { t, isRTL } = useTranslation();
  const { theme, setTheme } = useThemeStore();

  // نجيب الـ module بالترجمة الحالية
  const translatedModules = getModules(t);
  const activeModule = storedModule
    ? translatedModules.find((m) => m.key === storedModule.key) || storedModule
    : null;

  // اسم المطعم أو المستخدم
  const restaurantName = user?.restaurantName || "Keeto";
  const branchName = user?.branchName || user?.branch?.name;

  const location = useLocation();
  const navigate = useNavigate();

  // ---- Notification Sound ----
  const prevUnreadCountRef = useRef(null);

  // تحميل الصوت مسبقاً
  useEffect(() => {
    const audio = new Audio("/sounds/notification.wav");
    audio.volume = 0.7;
    audio.load();
    audioRef.current = audio;

    const unlock = () => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => { });
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((e) => console.warn("Notification sound failed:", e));
      }
    } catch (e) {
      console.warn("Notification sound failed:", e);
    }
  };

  // مفتاح الكاش المشترك للإشعارات
  const NOTIFICATIONS_QUERY_KEY = 'restaurant-notifications';

  // 1. جلب الإشعارات مع polling كل 30 ثانية
  const { data: notificationsResponse, isLoading: isLoadingNotifications } = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: async () => {
      const { data } = await api.get('/api/restaurant/notifications');
      return data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });


  
  // 1. هنضيف الـ Refs دي عشان نراقب الـ ID ونعرف دي أول مرة ولا لأ
  const latestSeenNotifIdRef = useRef(null);
  const isFirstFetchRef = useRef(true);


  // (نفس كود تحميل الصوت مفيش فيه تغيير)
  useEffect(() => {
    const audio = new Audio("/sounds/notification.wav");
    audio.volume = 0.7;
    audio.load();
    audioRef.current = audio;

    const unlock = () => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => { });
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);


  const notifications = notificationsResponse?.data?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

// ---- Notification Sound & Logic ----
  const audioRef = useRef(null);
  
  const [newOrderPopup, setNewOrderPopup] = useState({ 
    open: false, 
    count: 0, 
    latestNotification: null 
  });

  // 1. مراقبة الإشعارات وإظهار الـ Pop-up للطلبات الجديدة
  useEffect(() => {
    if (isLoadingNotifications || !notifications || notifications.length === 0) return;

    // استخراج أحدث إشعار بناءً على تاريخ الإنشاء (createdAt)
    const newestNotification = notifications.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
    }, notifications[0]);

    const newestId = newestNotification.id || newestNotification._id;
    const lastSeenId = localStorage.getItem("lastSeenNotifId");

    // يظهر الـ Pop-up فقط إذا كان الإشعار جديداً وغير مقروء ولم يتم عرضه من قبل
    if (newestId !== lastSeenId && !newestNotification.isRead) {      
      setNewOrderPopup({ 
        open: true, 
        count: unreadCount, 
        latestNotification: newestNotification 
      });
      playNotificationSound();

      // حفظ معرّف الإشعار في المتصفح لمنع تكراره عند الـ Refresh
      localStorage.setItem("lastSeenNotifId", newestId);
    }
  }, [notifications, isLoadingNotifications, unreadCount]);

  // 2. تحديث الكل كمقروء
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useUpdate(
    '/api/restaurant/notifications/read-all',
    NOTIFICATIONS_QUERY_KEY
  );

  // 3. تحديث إشعار واحد كمقروء
  const { mutate: markSingleAsRead } = useUpdate(
    '/api/restaurant',
    NOTIFICATIONS_QUERY_KEY
  );

  const handleMarkAllRead = () => {
    markAllAsRead({ payload: {} });
  };

  const handleMarkAsRead = (id) => {
    markSingleAsRead({ id: `notifications/${id}/read`, payload: {} });
  };

  // وظيفة الرجوع للخلف
  const handleBack = () => {
    if (window.history.length <= 2) {
      navigate("/");
      setActiveModule(null);
    } else {
      navigate(-1);
    }
  };

  // تصفير الموديول عند الرجوع للهوم
  useEffect(() => {
    if (location.pathname === "/") {
      setActiveModule(null);
    }
  }, [location.pathname, setActiveModule]);

  const handlePopupClose = () => {
    setNewOrderPopup({ open: false, count: 0, latestNotification: null });
  };

  // دالة التعامل مع الضغط على زر الإشعار المنبثق
  const handlePopupCheck = () => {
    const orderId = newOrderPopup.latestNotification?.data?.orderId || notifications[0]?.data?.orderId || "";
    handlePopupClose();

    const ordersModule = translatedModules.find(
      (m) =>
        m.key === "orders" ||
        m.key === "orders-management" ||
        m.path === "/orders" ||
        (m.name && m.name.toLowerCase().includes("order"))
    );

    if (ordersModule) {
      setActiveModule(ordersModule);
    }

    if (orderId) {
      navigate(`/orders/details/${orderId}`);
    } else {
      navigate('/orders');
    }
  };

  // فحص هل الإشعار الأخير عبارة عن إلغاء طلب
  const isCancelled = newOrderPopup.latestNotification?.data?.type === "cancel";

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider dir={isRTL ? "rtl" : "ltr"}>
        {activeModule && <AppSidebar side={isRTL ? "right" : "left"} />}
{newOrderPopup.open && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px] px-4 z-[999999999]">
    <div className={`w-full max-w-2xl rounded-2xl border ${isCancelled ? 'border-red-300 dark:border-red-500/50' : 'border-yellow-200 dark:border-yellow-500/30'} bg-white/95 dark:bg-slate-900/95 shadow-[0_20px_60px_rgba(15,23,42,0.18)] dark:shadow-none p-6 sm:p-7`}>
      
      {/* Header Icon & Title */}
      <div className="flex items-center justify-center gap-3 mb-5 text-slate-800 dark:text-slate-200">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isCancelled ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'} shadow-sm`}>
          {isCancelled ? <XCircle size={24} /> : <Bell size={22} />}
        </div>
        <span className={`text-2xl font-black tracking-tight ${isCancelled ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
          {isCancelled 
            ? "Order Cancelled ❌"
            : (t("notifications") || "Notifications")}
        </span>
      </div>

      {/* Body Text */}
      <div className="flex items-center justify-center text-center text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
        {isCancelled ? (
          <span>
            {`Order #${newOrderPopup.latestNotification?.data?.dailyOrderNumber || ''} was cancelled by the customer.`}
            {newOrderPopup.latestNotification?.data?.reason && (
              <span className="block text-lg font-normal text-slate-600 dark:text-slate-400 mt-1">
                {`Reason: ${newOrderPopup.latestNotification.data.reason}`}
              </span>
            )}
          </span>
        ) : (
          <>
            <span className="mr-2">{newOrderPopup.count}</span>
            <span>
              {newOrderPopup.count === 1
                ? (t("newOrderAlertSingular") || "You have 1 new order, please check.")
                : (t("newOrderAlert") || "You have new orders, please check.")}
            </span>
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={handlePopupClose}
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-base font-bold text-slate-700 dark:text-slate-300 shadow-sm transition hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          Close
        </button>

        <button
          onClick={handlePopupCheck}
          className={`flex-1 rounded-xl ${isCancelled ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary hover:brightness-95 text-primary-foreground'} px-4 py-3 text-base font-bold shadow-sm transition`}
        >
          Check Details
        </button>
      </div>
    </div>
  </div>
)}

        <main className="relative flex flex-col flex-1 min-w-0 max-h-screen overflow-hidden bg-background">
          <header className="flex-none sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between p-4 h-16">

              {/* Left Section */}
              <div className="flex items-center gap-4 overflow-hidden">
                {activeModule && <SidebarTrigger className="shrink-0" />}

                <div className="flex items-center gap-3 truncate">
                  {!activeModule && (
                    <div className="w-1 h-5 bg-primary rounded-full shrink-0" />
                  )}

                  {activeModule ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <button
                        onClick={handleBack}
                        className="p-1.5 rounded-md hover:bg-accent shrink-0 transition-colors group/back"
                        title="Go back"
                      >
                        {isRTL ? (
                          <ChevronRight
                            size={18}
                            className="text-muted-foreground group-hover/back:text-primary transition-transform group-hover/back:translate-x-0.5"
                          />
                        ) : (
                          <ChevronLeft
                            size={18}
                            className="text-muted-foreground group-hover/back:text-primary transition-transform group-hover/back:-translate-x-0.5"
                          />
                        )}
                      </button>

                      <div className="h-4 w-[1px] bg-border shrink-0" />

                      <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100 truncate">
                        {activeModule.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100">
                        {t("home")}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {restaurantName} {branchName ? `- ${branchName}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Logo */}
              <div>
                <button onClick={() => navigate("/")}>
                  <img className="w-30 h-15" src="/logo.webp" alt="Logo" />
                </button>
              </div>

              {/* Right Section: Notifications & Profile */}
              <div className="flex items-center gap-3">
                {/* Orders Button */}
                <button
                  onClick={() => {
                    const ordersModule = translatedModules.find(
                      (m) =>
                        m.key === "orders" ||
                        m.key === "orders-management" ||
                        m.path === "/orders" ||
                        (m.name && m.name.toLowerCase().includes("order"))
                    );

                    if (ordersModule) {
                      setActiveModule(ordersModule);
                    }
                    navigate("/orders");
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 font-semibold text-sm shadow-sm active:scale-95"
                  title={t("orders") || "Orders"}
                >
                  <ShoppingBag size={20} className="shrink-0" />
                  <span>{t("orders") || "Orders"}</span>
                </button>

                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Theme Switcher */}
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-full p-2 text-slate-600 hover:text-primary hover:bg-accent dark:text-slate-300 dark:hover:text-primary transition-colors cursor-pointer"
                  title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                >
                  {theme === "dark" ? (
                    <Sun size={22} />
                  ) : (
                    <Moon size={22} />
                  )}
                </button>

                {/* Notification Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative rounded-full p-2 hover:bg-accent transition-colors">
                      <Bell size={24} className="text-slate-600 hover:text-primary transition-colors" />

                      {/* Badge */}
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm border border-white dark:border-slate-900">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-80 md:w-96 rounded-xl p-0 shadow-lg">
                    {/* هيدر قائمة الإشعارات */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50 rounded-t-xl">
                      <span className="font-semibold text-slate-800">{t("notifications")}</span>
                      <button
                        onClick={handleMarkAllRead}
                        disabled={isMarkingAll || unreadCount === 0}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isMarkingAll ? t("updating") : t("markAllRead")}
                      </button>
                    </div>

                    {/* قائمة الإشعارات القابلة للتمرير */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {isLoadingNotifications ? (
                        <div className="p-8 text-center text-sm text-slate-500">{t("loadingNotifications")}</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">{t("noNotifications")}</div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => {
                              const orderId = notification?.data?.orderId;
                              if (orderId) {
                                const ordersModule = translatedModules.find(
                                  (m) =>
                                    m.key === "orders" ||
                                    m.key === "orders-management" ||
                                    m.path === "/orders" ||
                                    (m.name && m.name.toLowerCase().includes("order"))
                                );
                                if (ordersModule) {
                                  setActiveModule(ordersModule);
                                }
                                navigate(`/orders/details/${orderId}`);
                              }
                              if (!notification.isRead) {
                                handleMarkAsRead(notification.id);
                              }
                            }}
                            className={`p-4 border-b last:border-b-0 flex flex-col gap-1.5 transition-colors cursor-pointer ${notification.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <h4 className={`text-sm leading-tight ${notification.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                                {notification.title}
                              </h4>

                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="shrink-0 text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                >
                                  {t("markRead")}
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {notification.body}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(notification.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full p-1 hover:bg-accent transition-colors">
                      <UserCircle2
                        size={36}
                        className="text-slate-600 hover:text-primary transition-colors"
                      />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-52 rounded-xl">
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <UserCircle2 size={16} />
                      <span>{t("profile")}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={setLogout}
                      className="cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600"
                    >
                      <LogOut size={16} />
                      <span>{t("logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-transparent">
            <div className="p-6 h-full">
              <Outlet />
            </div>
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}