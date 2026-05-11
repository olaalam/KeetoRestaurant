import {
  LayoutDashboard,
  UserCog,
  Library,
  Utensils,
  Settings2,
  Truck,
  Beef,
  ShieldCheck,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  CheckCheck,
  XCircle,
  Ban,
  Undo2,
} from "lucide-react";
export const modules = [
  {
    name: "Dashboard",
    key: "dashboard",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    name: "Management",
    key: "management",
    items: [
      { title: "Admins", url: "/admins", icon: UserCog },
      { title: "Permissions", url: "/permissions", icon: ShieldCheck },
    ],
  },
  {
    name: "Location",
    key: "location",
    items: [{ title: "Delivery Zones", url: "/delivery-zones", icon: Truck }],
  },
  {
    name: "Content",
    key: "content",
    items: [
      { title: "Foods", url: "/foods", icon: Beef },
      { title: "SubCategories", url: "/sub-categories", icon: Library },
      { title: "Branches", url: "/branches", icon: Utensils },
      {
        title: "Ingredient Category",
        url: "/ingredient-category",
        icon: ShieldCheck,
      },
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
          {
            title: "Out for Delivery",
            url: "/orders/out-delivery",
            icon: Truck,
          },
          { title: "Delivered", url: "/orders/delivered", icon: CheckCheck },
          { title: "Cancelled", url: "/orders/cancelled", icon: XCircle },
          { title: "Rejected", url: "/orders/rejected", icon: Ban },
          { title: "Refund", url: "/orders/refunded", icon: Undo2 },
        ],
      },
    ],
  },
  {
    name: "Business",
    key: "business",
    items: [{ title: "Modifier", url: "/addons", icon: Settings2 }],
  },
];
