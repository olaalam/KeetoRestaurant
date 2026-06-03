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
import keetoImage from "../../public/WhatsApp Image 2026-05-18 at 11.27.30 AM.jpeg";
const KeetoIcon = (props) => (
  <img
    src={keetoImage}
    alt="Keeto"
    className={`object-contain rounded-sm ${props.className || "w-5 h-5"}`}
  />
);
export const getModules = (t) => [
  {
    name: t("dashboard"),
    key: "dashboard",
    items: [{ title: t("dashboard"), url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    name: t("management"),
    key: "management",
    items: [
      { title: t("admins"), url: "/admins", icon: UserCog },
      { title: "Permissions", url: "/permissions", icon: ShieldCheck },
    ],
  },
  {
    name: t("location"),
    key: "location",
    items: [{ title: t("deliveryZones"), url: "/delivery-zones", icon: Truck }],
  },
  {
    name: t("content"),
    key: "content",
    items: [
      { title: t("foods"), url: "/foods", icon: Beef },
      { title: t("subCategories"), url: "/sub-categories", icon: Library },
      { title: t("branches"), url: "/branches", icon: Utensils },
      { title: t("ingredientCategories"), url: "/ingredient-category", icon: ShieldCheck },
      { title: t("ingredients"), url: "/ingredients", icon: ShieldCheck },
      {
        title: t("orders"),
        url: "/orders",
        icon: ShoppingBag,
        subItems: [
          { title: t("allOrders"), url: "/orders", icon: ShoppingBag },
          { title: t("pending"), url: "/orders/pending", icon: Clock },
          { title: t("accepted"), url: "/orders/accepted", icon: CheckCircle2 },
          { title: t("preparing"), url: "/orders/preparing", icon: Package },
          { title: t("outForDelivery"), url: "/orders/out-delivery", icon: Truck },
          { title: t("delivered"), url: "/orders/delivered", icon: CheckCheck },
          { title: t("cancelled"), url: "/orders/cancelled", icon: XCircle },
          { title: t("rejected"), url: "/orders/rejected", icon: Ban },
          { title: t("refund"), url: "/orders/refunded", icon: Undo2 },
        ],
      },
    ],
  },
  {
    name: t("business"),
    key: "business",
    items: [
      { title: t("addons"), url: "/addons", icon: Settings2 },
      { title: t("myKeeto"), url: "/mykeeto", icon: KeetoIcon },
      { title: t("invoice"), url: "/invoice", icon: KeetoIcon },
      { title: t("qr"), url: "/qr", icon: ShoppingBag },
      { title: t("image"), url: "/image", icon: ShoppingBag },
      { title: t("social"), url: "/social", icon: ShoppingBag },
    ],
  },
];

// للتوافق مع الكود القديم - بيرجع الـ modules بالإنجليزي كـ default
export const modules = getModules((key) => key);
