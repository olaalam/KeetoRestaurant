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

export const getModules = (t, orderCounts = {}) => {
  // التأكد من وجود البيانات وتجنب أي خطأ ReferenceError
  const counts = orderCounts.statusCounts || {};

  // تعريف المتغيرات بوضوح وتوفير قيم افتراضية 0
  const pending = counts.pending || 0;
  const accepted = counts.accepted || 0;
  const preparing = counts.preparing || 0;
  const outDelivery = counts.out_for_delivery || 0;
  const delivered = counts.delivered || 0;
  const cancelled = counts.cancelled || 0;
  const rejected = counts.rejected || 0;
  const refund = counts.refund || 0;

  return [
    {
      name: t("dashboard"),
      key: "dashboard",
      items: [{ title: t("dashboard"), url: "/dashboard", icon: LayoutDashboard }],
    },
    {
      name: t("Setting"),
      key: "management",
      items: [
        { title: t("admins"), url: "/admins", icon: UserCog },
        { title: "Permissions", url: "/permissions", icon: ShieldCheck },
        { title: t("qr"), url: "/qr", icon: ShoppingBag },
      ],
    },
    {
      name: t("location"),
      key: "location",
      items: [
        { title: t("deliveryZones"), url: "/delivery-zones", icon: Truck },
        { title: t("branches"), url: "/branches", icon: Utensils },
      ],
    },
    {
      name: t("product management"),
      key: "content",
      items: [
        { title: t("foods"), url: "/foods", icon: Beef },
        { title: t("subCategories"), url: "/sub-categories", icon: Library },
        { title: t("modifier"), url: "/addons", icon: Settings2 },
        { title: t("image"), url: "/image", icon: ShoppingBag },
        { title: t("ingredientCategories"), url: "/ingredient-category", icon: ShieldCheck },
        { title: t("ingredients"), url: "/ingredients", icon: ShieldCheck },
      ],
    },
    {
      name: t("report"),
      key: "business",
      items: [
        { title: t("myKeeto"), url: "/mykeeto", icon: KeetoIcon },
        { title: t("invoice"), url: "/invoice", icon: KeetoIcon },
      ],
    },
    {
      name: t("order management"),
      key: "order",
      items: [
        {
          title: t("orders"),
          url: "/orders",
          icon: ShoppingBag,
          subItems: [
            { title: `${t("newOrders")} (${pending})`, url: "/orders", icon: ShoppingBag },
            { title: `${t("pending")} (${pending})`, url: "/orders/pending", icon: Clock },
            { title: `${t("accepted")} (${accepted})`, url: "/orders/accepted", icon: CheckCircle2 },
            { title: `${t("preparing")} (${preparing})`, url: "/orders/preparing", icon: Package },
            { title: `${t("outForDelivery")} (${outDelivery})`, url: "/orders/out-delivery", icon: Truck },
            { title: `${t("delivered")} (${delivered})`, url: "/orders/delivered", icon: CheckCheck },
            { title: `${t("cancelled")} (${cancelled})`, url: "/orders/cancelled", icon: XCircle },
            { title: `${t("rejected")} (${rejected})`, url: "/orders/rejected", icon: Ban },
            { title: `${t("refund")} (${refund})`, url: "/orders/refunded", icon: Undo2 },
          ],
        },
      ],
    },
    {
      name: t("Marketing"),
      key: "marketing",
      items: [
        { title: t("social"), url: "/social", icon: ShoppingBag },
        { title: t("discount"), url: "/discount", icon: ShoppingBag },
        { title: t("coupon"), url: "/coupon", icon: ShoppingBag },
        { title: t("rating"), url: "/rating", icon: ShoppingBag },
        { title: t("popup"), url: "/popup", icon: ShoppingBag },
        { title: t("banner"), url: "/slider", icon: ShoppingBag },
      ],
    },
  ];
};

// التعديل هنا لتجنب الخطأ عند استدعاء modules في أماكن غير الـ Component
export const modules = getModules((key) => key, { statusCounts: {} });