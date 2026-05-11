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
import useAuthStore from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  LogOut,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Home,
} from "lucide-react"; // استيراد الأيقونات الأساسية فقط

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();

  const activeModule = useSidebarStore((s) => s.activeModule);
  //const setLogout = useAuthStore((state) => state.setLogout);
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState([]);
  // إذا لم يكن هناك موديول نشط، لا تظهر الـ Sidebar

  const toggleMenu = (title) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  if (!activeModule) return null;

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex justify-center py-5">
        <h2 className="text-2xl font-black text-primary">
          {/* عرض الاسم كاملاً أو الحرف الأول بناءً على حالة الفتح[cite: 1] */}
          {open ? activeModule.name : activeModule.name?.[0] || ""}
        </h2>
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
                        tooltip={item.title}
                        onClick={() => {
                          if (hasSubItems) {
                            toggleMenu(item.title);
                          } else {
                            navigate(item.url);
                          }
                        }}
                      >
                        <div
                          className={`flex items-center w-full gap-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                            open
                              ? "gap-3 px-3 py-2 justify-start"
                              : "justify-center py-2"
                          } ${
                            active
                              ? "bg-primary text-white shadow-md"
                              : "text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {IconComponent ? (
                            <IconComponent size={20} />
                          ) : (
                            <HelpCircle size={20} />
                          )}

                          {open && (
                            <>
                              <span className="text-sm font-medium">
                                {item.title}
                              </span>

                              {hasSubItems && (
                                <span className="ml-auto">
                                  {isOpen ? (
                                    <ChevronDown size={18} />
                                  ) : (
                                    <ChevronRight size={18} />
                                  )}
                                </span>
                              )}
                            </>
                          )}
                        </div>
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
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                    isSubActive
                                      ? "bg-primary text-white"
                                      : "text-gray-500 hover:bg-gray-100"
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Home"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="w-full">
                <Button
                  onClick={() => navigate("/")}
                  className={`w-full ${!open ? "px-2 justify-center" : ""}`}
                >
                  <Home size={18} />

                  {open && <span className="ml-2">Back to home</span>}
                </Button>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
