const normalizePermissionValue = (value) =>
  String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");

export const hasPermission = (user, module, action = "View") => {
  const permissions = user?.permissions;

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
  hasPermission(user, module.key, "View");