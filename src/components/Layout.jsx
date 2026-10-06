import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Outlet, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";
import useSidebarStore from "@/store/useSidebarStore";
import useAuthStore from "@/store/useAuthStore";
import { LogOut, ChevronLeft, ChevronRight, UserCircle2, Bell, ShoppingBag, XCircle, Sun, Moon, Tag } from "lucide-react";
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
import { filterModulesByPermissions, getPermissionKey, hasPermission } from "@/lib/permissions";

export default function Layout() {
  const storedModule = useSidebarStore((state) => state.activeModule);
  const setActiveModule = useSidebarStore((state) => state.setActiveModule);
  const { setLogout, user } = useAuthStore((state) => state);
  const { t, isRTL } = useTranslation();
  const { theme, setTheme } = useThemeStore();

  // نجيب الـ module بالترجمة الحالية
  const allModules = getModules(t);
  const translatedModules = filterModulesByPermissions(user, allModules);
  const activeModule = storedModule
    ? translatedModules.find((m) => m.key === storedModule.key) || storedModule
    : null;

  // اسم المطعم أو المستخدم
  const restaurantName = user?.restaurantName || "Keeto";
  const branchName = user?.branchName || user?.branch?.name;

  const location = useLocation();
  const navigate = useNavigate();

  const routeItem = allModules
    .flatMap((module) => module.items || [])
    .find((item) => {
      const urls = [item.url, ...(item.subItems?.map((subItem) => subItem.url) || [])];
      return urls.some((url) => url && (location.pathname === url || location.pathname.startsWith(`${url}/`)));
    });
  const routePermissionKey = getPermissionKey(routeItem) ||
    getPermissionKey(routeItem?.subItems?.find((subItem) => location.pathname.startsWith(subItem.url)));
  const canAccessRoute = !routePermissionKey || hasPermission(user, routePermissionKey, "View");

  // ---- Notification Sound ----
  const audioRef = useRef(null);

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

  const notifications = notificationsResponse?.data?.data || [];

  // 1. جلب بيانات الـ pagination من الـ API مباشرة
  const pagination = notificationsResponse?.data?.pagination;
  const totalItems = pagination?.totalItems ?? notifications.length;
  const unreadCount = pagination?.unreadCount ?? totalItems;

  const [newOrderPopup, setNewOrderPopup] = useState({
    open: false,
    count: 0,
    latestNotification: null
  });

  // 2. مراقبة الإشعارات وإظهار الـ Pop-up باستخدام totalItems
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
        count: totalItems,
        latestNotification: newestNotification
      });
      playNotificationSound();

      // حفظ معرّف الإشعار في المتصفح لمنع تكراره عند الـ Refresh
      localStorage.setItem("lastSeenNotifId", newestId);
    }
  }, [notifications, isLoadingNotifications, totalItems]);

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

  // وظيفة الرجوع للخلف مع الحفاظ على الصفحة والعنصر المحدد
  const handleBack = () => {
    // 1. مسار إعدادات الفروع المخصص
    const branchSettingMatch = location.pathname.match(/^(\/branches\/setting)\/edit\/([^/]+)$/);
    if (branchSettingMatch) {
      navigate(`/branches/setting/${branchSettingMatch[2]}`, {
        state: {
          highlightedId: branchSettingMatch[2],
          pageIndex: location.state?.fromPage,
        },
      });
      return;
    }

    // 2. فحص مسارات التعديل العامة edit
    const editMatch = location.pathname.match(/^(\/.*?)\/edit\/([^/]+)$/);
    if (editMatch) {
      const parentPath = editMatch[1];
      const editId = editMatch[2];
      navigate(parentPath, {
        state: {
          highlightedId: editId,
          pageIndex: location.state?.fromPage,
          category: location.state?.category,
          subCategory: location.state?.subCategory,
        },
      });
      return;
    }

    // 3. فحص مسارات الإضافة add
    const addMatch = location.pathname.match(/^(\/.*?)\/add$/);
    if (addMatch) {
      const parentPath = addMatch[1];
      navigate(parentPath, {
        state: {
          pageIndex: location.state?.fromPage,
          category: location.state?.category,
          subCategory: location.state?.subCategory,
        },
      });
      return;
    }

    // 4. الرجوع العادي
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

  const isVisaPaymentNotification = (notification) =>
    notification?.data?.type === "payment_issue";

  const navigateToVisaReport = () => {
    const reportModule = translatedModules.find((module) =>
      module.items?.some((item) => item.url === "/visa-repo")
    );
    if (reportModule) {
      setActiveModule(reportModule);
    }
    navigate("/visa-repo");
  };

  // دالة التعامل مع الضغط على زر الإشعار المنبثق
  const handlePopupCheck = () => {
    const latestNotification = newOrderPopup.latestNotification;
    handlePopupClose();

    if (isVisaPaymentNotification(latestNotification)) {
      navigateToVisaReport();
      return;
    }

    const orderId = latestNotification?.data?.orderId || notifications[0]?.data?.orderId || "";
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
                    ? t("orderCancelledTitle") || "Order Cancelled ❌"
                    : (t("notifications") || "Notifications")}
                </span>
              </div>

              {/* Body Text */}
              <div className="flex flex-col items-center justify-center text-center text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 leading-relaxed gap-2">
                {isCancelled ? (
                  <>
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/50 px-4 py-2 rounded-2xl border border-red-200 dark:border-red-900">
                      <span className="text-slate-500 text-lg">
                        {t("orderNumberLabel") || "Order #"}
                      </span>
                      <span className="text-3xl font-black text-red-600 dark:text-red-400">
                        #{newOrderPopup.latestNotification?.data?.dailyOrderNumber}
                      </span>
                    </div>

                    <span className="text-base font-medium text-slate-600 dark:text-slate-400">
                      {newOrderPopup.latestNotification?.body || t("orderCancelledDefaultDesc")}
                    </span>

                    {newOrderPopup.latestNotification?.data?.reason && (
                      <span className="text-sm font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-xl mt-1">
                        {t("cancelReasonLabel") || "Reason"}: {newOrderPopup.latestNotification.data.reason}
                      </span>
                    )}
                  </>
                ) : (
                  <span>
                    {t("newOrdersCountMessage")
                      ? t("newOrdersCountMessage").replace("{count}", newOrderPopup.count)
                      : `You have ${newOrderPopup.count} new order alert(s).`}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={handlePopupClose}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-base font-bold text-slate-700 dark:text-slate-300 shadow-sm transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {t("close") || "Close"}
                </button>

                <button
                  onClick={handlePopupCheck}
                  className={`flex-1 rounded-xl ${isCancelled ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary hover:brightness-95 text-primary-foreground'} px-4 py-3 text-base font-bold shadow-sm transition`}
                >
                  {t("checkDetails") || "Check Details"}
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="relative flex flex-col flex-1 min-w-0 max-h-screen overflow-hidden bg-background">
<header className="flex-none sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  {/* استخدام Grid يضمن الحماية المطلقة من التداخل */}
  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 w-full">

    {/* Left Section: Title / Breadcrumb */}
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-3 justify-start">
      {activeModule && <SidebarTrigger className="shrink-0" />}

      <div className="flex items-center gap-2 truncate">
        {!activeModule && (
          <div className="w-1 h-4 sm:h-5 bg-primary rounded-full shrink-0" />
        )}

        {activeModule ? (
          <div className="flex items-center gap-1 overflow-hidden">
            <button
              onClick={handleBack}
              className="p-1 sm:p-1.5 rounded-md hover:bg-accent shrink-0 transition-colors group/back"
              title={t("goBack") || "Go back"}
            >
              {isRTL ? (
                <ChevronRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-muted-foreground group-hover/back:text-primary transition-transform group-hover/back:translate-x-0.5" />
              ) : (
                <ChevronLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-muted-foreground group-hover/back:text-primary transition-transform group-hover/back:-translate-x-0.5" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col truncate">
            <span className="font-bold text-xs sm:text-base tracking-tight text-slate-800 dark:text-slate-100 truncate">
              {t("home")}
            </span>
            <span className="text-[9px] sm:text-xs text-muted-foreground font-medium truncate">
              {restaurantName} {branchName ? `- ${branchName}` : ""}
            </span>
          </div>
        )}
      </div>
    </div>

    {/* Center: Logo - responsive في كل المقاسات (يختفي فقط تحت 400px) */}
    <div className="hidden min-[400px]:flex items-center justify-center min-w-0">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 transition-opacity hover:opacity-90 focus:outline-none shrink-0"
      >
        {(user?.restaurantLogo || user?.restaurant?.restaurantLogo) && (
          <>
            {/* لوجو المطعم: يظهر من sm وطالع عشان الموبايل ما يتزحمش */}
            <img
              className="hidden sm:block h-6 md:h-8 lg:h-9 w-auto max-w-[56px] md:max-w-[90px] lg:max-w-[110px] object-contain rounded-md"
              src={user?.restaurantLogo || user?.restaurant?.restaurantLogo}
              alt={restaurantName || "Restaurant Logo"}
            />
            <div className="hidden sm:block h-5 w-px bg-slate-300 dark:bg-slate-700" />
          </>
        )}
        <img
          className="h-6 sm:h-7 md:h-8 lg:h-9 w-auto max-w-[64px] sm:max-w-[80px] lg:max-w-[110px] object-contain"
          src="/logo.webp"
          alt="Keeto Logo"
        />
      </button>
    </div>

    {/* Right Section: Actions & Profile */}
    <div className="col-start-3 flex items-center justify-end min-w-0 gap-1 sm:gap-1.5 lg:gap-2">

      {/* Product Pricing Button */}
      <button
        onClick={() => {
          const pricingModule = translatedModules.find(
            (m) =>
              m.key === "product-pricing" ||
              m.key === "productPricing" ||
              m.key === "pricing" ||
              m.path === "/product-pricing" ||
              m.path === "/pricing" ||
              (m.name && m.name.toLowerCase().includes("pricing"))
          );

          if (pricingModule) {
            setActiveModule(pricingModule);
          }
          navigate("/pricing-product");
        }}
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary/10 p-1.5 sm:p-2 xl:px-3.5 xl:py-1.5 text-primary shadow-sm transition-all duration-200 hover:bg-primary hover:text-white active:scale-95"
        title={t("productPricing") || "Product Pricing"}
      >
        <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <span className="hidden xl:inline text-xs sm:text-sm font-medium whitespace-nowrap">
          {t("productPricing") || "Product Pricing"}
        </span>
      </button>

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
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary/10 p-1.5 sm:p-2 xl:px-3.5 xl:py-1.5 text-primary shadow-sm transition-all duration-200 hover:bg-primary hover:text-white active:scale-95"
        title={t("orders") || "Orders"}
      >
        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <span className="hidden xl:inline text-xs sm:text-sm font-medium whitespace-nowrap">
          {t("orders") || "Orders"}
        </span>
      </button>

      {/* Language Switcher - يُخفى في التابلت الضيق والموبايل لمنع الزحمة */}
      <div className="hidden md:block shrink-0 scale-90 sm:scale-100 origin-center">
        <LanguageSwitcher />
      </div>

      {/* Theme Switcher */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="shrink-0 rounded-full p-1 sm:p-2 text-slate-600 hover:text-primary hover:bg-accent dark:text-slate-300 dark:hover:text-primary transition-colors cursor-pointer"
        title={theme === "dark" ? (t("lightMode") || "Light Mode") : (t("darkMode") || "Dark Mode")}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </button>

      {/* Notification Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative shrink-0 rounded-full p-1 sm:p-2 hover:bg-accent transition-colors">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 hover:text-primary transition-colors" />

            {/* Badge */}
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 sm:top-1 sm:right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white shadow-sm border border-white dark:border-slate-900">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 sm:w-80 md:w-96 rounded-xl p-0 shadow-lg z-[100]">
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

          <div className="max-h-[350px] sm:max-h-[400px] overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="p-8 text-center text-sm text-slate-500">{t("loadingNotifications")}</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">{t("noNotifications")}</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (isVisaPaymentNotification(notification)) {
                      navigateToVisaReport();
                    } else {
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
                    }
                    if (!notification.isRead) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                  className={`p-3 sm:p-4 border-b last:border-b-0 flex flex-col gap-1 transition-colors cursor-pointer ${
                    notification.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-xs sm:text-sm leading-tight ${notification.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                      {notification.title}
                    </h4>

                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="shrink-0 text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors"
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
          <button className="shrink-0 rounded-full p-0.5 hover:bg-accent transition-colors">
            <UserCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600 hover:text-primary transition-colors" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48 sm:w-52 rounded-xl z-[100]">
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

  {/* Sub-header */}
  {activeModule && (
    <div className="flex min-h-10 sm:min-h-12 items-center gap-2 sm:gap-3 border-t bg-muted/30 px-3 py-1.5 sm:px-6">
      <span
        aria-hidden="true"
        className="h-4 sm:h-5 w-1 shrink-0 rounded-full bg-primary"
      />
      <span className="min-w-0 truncate text-sm sm:text-base font-semibold tracking-tight text-foreground">
        {activeModule.name}
      </span>
    </div>
  )}
</header>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-auto bg-slate-50/30 dark:bg-transparent">
            <div className="h-full p-3 sm:p-6">
              {canAccessRoute ? <Outlet /> : <Navigate to="/" replace />}
            </div>
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}