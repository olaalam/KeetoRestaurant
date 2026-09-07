import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import useSidebarStore from "@/store/useSidebarStore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  LogOut,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Home,
  ChevronLeft,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getModules } from "@/config/modules";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import useAuthStore from "@/store/useAuthStore";
import useDateRangeStore from "../store/Usedaterangestore";

export function AppSidebar({ side = "left" }) {
  const { open } = useSidebar();
  const location = useLocation();
  const storedModule = useSidebarStore((s) => s.activeModule);
  const [openMenus, setOpenMenus] = useState([]);
  const { t, isRTL } = useTranslation();
  const { user } = useAuthStore((state) => state);
  const restaurantName = user?.restaurantName || "Keeto";
  const branchName = user?.branchName || user?.branch?.name;

  const { startDate, endDate } = useDateRangeStore();

  const { data: orderCounts = { totalOrders: 0, statusCounts: {} } } = useQuery(
    {
      queryKey: ["order-statistics", startDate, endDate],
      queryFn: async () => {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const res = await api.get("/api/restaurant/order/numbers", { params });
        return res.data.data.data;
      },
      refetchInterval: 30000,
    },
  );

  const translatedModules = getModules(t, orderCounts);
  const activeModule = storedModule
    ? translatedModules.find((m) => m.key === storedModule.key) || storedModule
    : null;

useEffect(() => {
    if (!activeModule?.items) return;

    const activeParentMenu = activeModule.items.find(
      (item) =>
        item.subItems?.some((subItem) =>
          location.pathname.includes(subItem.url),
        ) || location.pathname.includes(item.url),
    );

    if (activeParentMenu) {
      setOpenMenus((prev) =>
        prev.includes(activeParentMenu.title)
          ? prev
          : [...prev, activeParentMenu.title],
      );
    }
    // بنعتمد على location.pathname و activeModule?.key (قيم ثابتة) مش على
    // activeModule نفسه، لأنه بيتعمل من جديد (reference جديدة) كل مرة orderCounts
    // بتتحدث (polling كل 30 ثانية) أو أي re-render تاني. لو فضلنا معتمدين على
    // الـ object، الـ effect كان بيشتغل تاني ويفتح القايمة تلقائي فورًا بعد ما
    // المستخدم يقفلها، فكانت بتبان إنها "مش بتتقفل خالص".
  }, [location.pathname, activeModule?.key]);

  const toggleMenu = (title) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  if (!activeModule) return null;

  return (
    <Sidebar side={side} variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex justify-center py-5">
        <h2 className="text-xl font-black text-primary text-center truncate px-2">
          {restaurantName}
          {branchName && (
            <span className="block text-xs font-semibold text-muted-foreground mt-0.5">
              {branchName}
            </span>
          )}
        </h2>
        <SidebarMenu className="mt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={t("backToHome")}
              className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-10 bg-primary/30"
            >
              <Link
                to="/"
                className={`flex items-center gap-2 text-slate-600 hover:text-primary font-medium w-full ${
                  !open
                    ? "justify-center"
                    : isRTL
                      ? "flex-row-reverse pl-2"
                      : "px-2"
                }`}
              >
                <span
                  className={`transform transition-transform ${isRTL ? "rotate-180" : ""}`}
                >
                  <ChevronLeft size={20} className="shrink-0" />
                </span>

                {open && <span className="text-sm">{t("backToHome")}</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {activeModule.items?.map((item) => {
                const active = location.pathname === item.url;
                const IconComponent = item.icon;
                const hasSubItems = item.subItems?.length > 0;
                const isOpen = openMenus.includes(item.title);

                return (
                  <div key={item.title}>
                    <SidebarMenuItem>
                      {hasSubItems ? (
                        /* استخدام div تفاعلي بدلاً من SidebarMenuButton لمنع مشاكل تداخل الـ DOM والأزرار */
                        <div
                          onClick={() => toggleMenu(item.title)}
                          title={!open ? item.title : undefined}
                          className={`flex items-center w-full gap-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer select-none ${
                            open ? "justify-start" : "justify-center"
                          } ${
                            active
                              ? "bg-primary text-white shadow-md"
                              : "text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {IconComponent ? (
                            <IconComponent size={20} className="shrink-0" />
                          ) : (
                            <HelpCircle size={20} className="shrink-0" />
                          )}
                          {open && (
                            <>
                              <span className="text-sm font-medium truncate">
                                {item.title}
                              </span>
                              <span className="ml-auto shrink-0">
                                {isOpen ? (
                                  <ChevronDown size={18} />
                                ) : (
                                  <ChevronRight size={18} />
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <SidebarMenuButton asChild tooltip={item.title}>
                          <Link
                            to={item.url}
                            className={`flex items-center w-full gap-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                              open ? "justify-start" : "justify-center"
                            } ${
                              active
                                ? "bg-primary text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {IconComponent ? (
                              <IconComponent size={20} className="shrink-0" />
                            ) : (
                              <HelpCircle size={20} className="shrink-0" />
                            )}
                            {open && (
                              <span className="text-sm font-medium truncate">
                                {item.title}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>

                    {hasSubItems && isOpen && open && (
                      <div className="ml-6 mt-1 space-y-1 overflow-hidden transition-all">
                        {item.subItems?.map((subItem) => {
                          const isSubActive = location.pathname === subItem.url;
                          const SubIcon = subItem.icon;

                          return (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton asChild>
                                <Link
                                  to={subItem.url}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                    isSubActive
                                      ? "bg-primary text-white"
                                      : "text-gray-500 hover:bg-gray-100"
                                  }`}
                                >
                                  {SubIcon && <SubIcon size={16} className="shrink-0" />}
                                  <span className="truncate">{subItem.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2"></SidebarFooter>
    </Sidebar>
  );
}