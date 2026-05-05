import {
    LayoutDashboard,
    UserCog,
    Globe,
    MapPin,
    Map,
    Layers,
    Library,
    Utensils,
    PlusSquare,
    Settings2,
    Truck,
    Beef,
    ChefHat,
    Briefcase,
    ShieldCheck,
    LogOut,
    ShoppingBag,
    ChevronDown,
    Clock,
    CheckCircle2,
    Package,
    CheckCheck,
    XCircle,
    Ban,
    Undo2
} from "lucide-react";

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
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import useAuthStore from "@/store/useAuthStore"
import { Link } from "react-router-dom"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

const items = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Admins", url: "/admins", icon: UserCog },
    { title: "SubCategories", url: "/sub-categories", icon: Library },
    { title: "Branches", url: "/branches", icon: Utensils },
    { title: "Modifier", url: "/addons", icon: Settings2 },
    { title: "Delivery Zones", url: "/delivery-zones", icon: Truck },
    { title: "Foods", url: "/foods", icon: Beef },
    { title: "Permissions", url: "/permissions", icon: ShieldCheck },
    { title: "Ingredient Category", url: "/ingredient-category", icon: ShieldCheck },
    { title: "Ingredients", url: "/ingredients", icon: ShieldCheck },
    {
        title: "Orders",
        url: "/orders",
        icon: ShoppingBag,
        subItems: [
            { title: "All Orders", url: "/orders", icon: ShoppingBag },
            { title: "Pending", url: "/orders/pending", icon: Clock },
            { title: "Accepted", url: "/orders/accepted", icon: CheckCircle2 },
            { title: "Preparing", url: "/orders/preparing", icon: Package },
            // تأكد أن الرابط هنا يطابق الـ path في الـ Routes
            { title: "Out for Delivery", url: "/orders/out-delivery", icon: Truck },
            { title: "Delivered", url: "/orders/delivered", icon: CheckCheck },
            { title: "Cancelled", url: "/orders/cancelled", icon: XCircle },
            { title: "Rejected", url: "/orders/rejected", icon: Ban },
            { title: "Refund", url: "/orders/refunded", icon: Undo2 },
        ]
    },
];

export function AppSidebar() {
    const setLogout = useAuthStore((state) => state.setLogout);

    const { open } = useSidebar();

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="flex items-center justify-center p-4">
                {/* الآن open ستعمل بشكل صحيح */}
                {open ? (
                    <h2 className="text-2xl font-black text-primary transition-all">Keeto</h2>
                ) : (
                    <h2 className="text-2xl font-black text-primary transition-all">K</h2>
                )}
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                if (item.subItems) {
                                    return (
                                        <Collapsible key={item.title} className="group/collapsible">
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.title}>
                                                        <item.icon size={20} />
                                                        {open && (
                                                            <>
                                                                <span>{item.title}</span>
                                                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                            </>
                                                        )}
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.subItems.map((sub) => (
                                                            <SidebarMenuSubItem key={sub.title}>
                                                                <SidebarMenuSubButton asChild>
                                                                    <Link to={sub.url} className="flex items-center gap-2">
                                                                        <sub.icon size={16} />
                                                                        <span>{sub.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    )
                                }

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild tooltip={item.title}>
                                            <Link to={item.url} className="flex items-center gap-3">
                                                <item.icon size={20} />
                                                {open && <span>{item.title}</span>}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
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
                            tooltip="Logout"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <button
                                onClick={setLogout}
                                className="flex items-center w-full"
                            >
                                <LogOut size={20} className="shrink-0" />
                                {/* لن يظهر النص إلا إذا كان الـ Sidebar مفتوحاً، مما يمنع خروج الحرف عن الإطار */}
                                {open && <span className="ml-3 font-medium">Logout</span>}
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}