const normalizePermissionValue = (value) =>
  String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");

export const PERMISSION_ACTIONS = ["View", "Add", "Edit", "Delete", "Status", "filter"];

export const PERMISSION_MODULES = [
  "restrauntadmins",
  "role_restaurant",
  "restaurantadmin",
  "food",
  "foodingredients",
  "ingredients",
  "ingredientscategory",
  "addon",
  "subcategory",
  "image",
  "foodLocks",
  "recommendedFood",
  "pointsProducts",
  "order",
  "pointsOrders",
  "branches",
  "branchemenu",
  "zone",
  "restaurantZoneDeliveryfees",
  "restaurant QR",
  "basiccampaign",
  "coupon",
  "discount",
  "popup",
  "slider",
  "notification",
  "freeDeliveryOffer",
  "restaurant_wallet",
  "financialAccount",
  "expense",
  "expenseCategory",
  "report",
  "rating",
  "customerRatings",
  "restaurantsetting",
  "policy",
  "city",
  "country",
  "delivery_man",
  "socialmedia",
];

const URL_PERMISSION_KEYS = {
  "/dashboard": "dashboard",
  "/admins": "restaurantadmin",
  "/foods": "food",
  "/addons": "addon",
  "/ingredient-category": "ingredientscategory",
  "/ingredients": "ingredients",
  "/sub-categories": "subcategory",
  "/out-of-stock": "foodLocks",
  "/pricing-product": "pointsProducts",
  "/delivery-zones": "restaurantZoneDeliveryfees",
  "/branches": "branches",
  "/zone-map": "zone",
  "/social": "socialmedia",
  "/discount": "discount",
  "/coupon": "coupon",
  "/free-delivery": "freeDeliveryOffer",
  "/rating": "rating",
  "/popup": "popup",
  "/slider": "slider",
  "/points": "pointsProducts",
  "/image": "image",
  "/order": "order",
  "/orders": "order",
  "/redeem-points": "pointsOrders",
  "/expense-categories": "expenseCategory",
  "/expense": "expense",
  "/financialAccounts": "financialAccount",
  "/mykeeto": "report",
  "/qr": "restaurant QR",
  "/policy": "policy",
  "/setting": "restaurantsetting",
  "/delivery-man": "delivery_man",
};

export const getPermissionKey = (item) =>
  item?.permissionKey || URL_PERMISSION_KEYS[item?.url];

const getUserPermissions = (user) =>
  user?.permissions || user?.admin?.permissions || user?.data?.admin?.permissions;

export const hasPermission = (user, module, action = "View") => {
  const permissions = getUserPermissions(user);

  // Non-staff users and old sessions without permissions keep the existing access.
  if (!Array.isArray(permissions) || permissions.length === 0) return true;

  const targetModule = normalizePermissionValue(module);
  const permission = permissions.find(
    (item) => normalizePermissionValue(item?.module) === targetModule,
  );

  if (!permission || !Array.isArray(permission.actions)) return false;

  const targetAction = normalizePermissionValue(action);
  return permission.actions.some((item) => {
    const value = typeof item === "string" ? item : item?.action;
    return normalizePermissionValue(value) === targetAction;
  });
};

export const canViewModule = (user, module) =>
  hasPermission(user, module.key, "View") ||
  module.items?.some((item) =>
    getPermissionKey(item)
      ? hasPermission(user, getPermissionKey(item), "View")
      : item.subItems?.some((subItem) =>
        getPermissionKey(subItem) && hasPermission(user, getPermissionKey(subItem), "View"),
      ),
  );

export const filterModulesByPermissions = (user, modules) =>
  modules
    .map((module) => ({
      ...module,
      items: module.items
        ?.map((item) => ({
          ...item,
          subItems: item.subItems?.filter((subItem) =>
            !getPermissionKey(subItem) || hasPermission(user, getPermissionKey(subItem), "View"),
          ),
        }))
        .filter((item) =>
          (!getPermissionKey(item) || hasPermission(user, getPermissionKey(item), "View")) &&
          (!item.subItems || item.subItems.length > 0),
        ),
    }))
    .filter((module) => module.items?.length > 0);