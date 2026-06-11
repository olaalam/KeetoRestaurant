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
import { useState } from "react";
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
import { useQuery } from "@tanstack/react-query"; // 1. استيراد useQuery
import api from "@/api/axios"; // 2. استيراد الـ API
import useAuthStore from "@/store/useAuthStore";

export function AppSidebar({ side = "left" }) {
  const { open } = useSidebar();
  const location = useLocation();
  const storedModule = useSidebarStore((s) => s.activeModule);
  const [openMenus, setOpenMenus] = useState([]);
  const { t , isRTL } = useTranslation();
  const { user } = useAuthStore((state) => state);
  const restaurantName = user?.restaurantName || "Keeto";


  // 3. جلب إحصائيات الطلبات من الـ Backend
  const { data: orderCounts = { totalOrders: 0, statusCounts: {} } } = useQuery({
    queryKey: ['order-statistics'],
    queryFn: async () => {
      const res = await api.get('/api/restaurant/order/numbers');

      console.log('Order counts data:', res.data.data.data);
      return res.data.data.data;
    },
    refetchInterval: 30000,
  });

  // 4. تمرير الترجمة والأرقام إلى دالة getModules
  const translatedModules = getModules(t, orderCounts);
  const activeModule = storedModule
    ? translatedModules.find((m) => m.key === storedModule.key) || storedModule
    : null;

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
        <h2 className="text-2xl font-black text-primary text-center">
          {restaurantName}
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
                  !open ? "justify-center" : isRTL ? "flex-row-reverse pl-2" : "px-2"
                }`}
              >
                {/* السهم اللي هيلف تلقائياً لو السيستم عربي أو إنجليزي */}
                <span className={`transform transition-transform ${isRTL ? "rotate-180" : ""}`}>
                  <ChevronLeft size={20} className="shrink-0" />
                </span>
                
                {/* هيظهر النص فقط لو الـ Sidebar مفتوح */}
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
              {activeModule.items.map((item) => {
                const active = location.pathname === item.url;
                const IconComponent = item.icon;
                const hasSubItems = item.subItems?.length > 0;
                const isOpen = openMenus.includes(item.title);

                return (
                  <div key={item.title}>
                    {/* Main Item */}
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild={!hasSubItems}
                        tooltip={item.title}
                      >
                        {hasSubItems ? (
                          <button
                            onClick={() => toggleMenu(item.title)}
                            className={`flex items-center w-full gap-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer ${open ? "gap-3 px-3 py-2 justify-start" : "justify-center py-2"
                              } ${active ? "bg-primary text-white shadow-md" : "text-gray-600 hover:bg-gray-200"
                              }`}
                          >
                            {IconComponent ? <IconComponent size={20} /> : <HelpCircle size={20} />}
                            {open && (
                              <>
                                <span className="text-sm font-medium">{item.title}</span>
                                <span className="ml-auto">
                                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </span>
                              </>
                            )}
                          </button>
                        ) : (
                          <Link
                            to={item.url}
                            className={`flex items-center w-full gap-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer ${open ? "gap-3 px-3 py-2 justify-start" : "justify-center py-2"
                              } ${active ? "bg-primary text-white shadow-md" : "text-gray-600 hover:bg-gray-200"
                              }`}
                          >
                            {IconComponent ? <IconComponent size={20} /> : <HelpCircle size={20} />}
                            {open && <span className="text-sm font-medium">{item.title}</span>}
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Sub Items */}
                    {hasSubItems && isOpen && open && (
                      <div className="ml-6 mt-1 space-y-1 overflow-hidden transition-all">
                        {item.subItems.map((subItem) => {
                          const isSubActive = location.pathname === subItem.url;
                          const SubIcon = subItem.icon;

                          return (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton asChild>
                                <Link
                                  to={subItem.url}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isSubActive ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"
                                    }`}
                                >
                                  {SubIcon && <SubIcon size={16} />}
                                  <span>{subItem.title}</span>
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

      <SidebarFooter className="p-2">

      </SidebarFooter>
    </Sidebar>
  );
}