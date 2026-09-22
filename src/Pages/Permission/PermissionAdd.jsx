import React, { useMemo, useState } from "react";
import AddPage from "@/components/AddPage";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import api from "@/api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from "@/lib/permissions";

export default function PermissionAdd() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const norm = (v) =>
    String(v || "").trim().toLowerCase().replace(/[\s_-]+/g, "");

  const [searchTerm, setSearchTerm] = useState("");

  // ================= Schema =================
  const { data: schema, isLoading: isSchemaLoading } = useQuery({
    queryKey: ["permissions-schema"],
    queryFn: async () => {
      const res = await api.get("/api/restaurant/roles/permissions");
      return res.data.data;
    },
  });

  // ================= Role =================
  const { data: role, isLoading: isRoleLoading } = useQuery({
    queryKey: ["roles", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/api/restaurant/roles/${id}`);
      return res.data.data.role;
    },
  });

  const availableModules = schema?.modules?.length ? schema.modules : PERMISSION_MODULES;
  const availableActions = schema?.actions?.length
    ? schema.actions.map((action) => (typeof action === "string" ? action : action.action))
    : PERMISSION_ACTIONS;

  // ================= Permission Map =================
  const permissionMap = useMemo(() => {
    const map = {};
    role?.permissions?.forEach((p) => {
      map[norm(p.module)] = p.actions.map((a) => norm(typeof a === "string" ? a : a.action));
    });
    return map;
  }, [role]);

  // تجهيز البيانات الأولية للـ role بحيث تكون متوافقة تماماً مع الفورم
  const formattedInitialData = useMemo(() => {
    if (!role) return {};
    const formattedPermissions = role.permissions ? role.permissions.map(p => ({
      module: p.module,
      actions: p.actions.map(a => ({
        action: typeof a === "string" ? a : a.action
      }))
    })) : [];

    return {
      ...role,
      permissions: formattedPermissions
    };
  }, [role]);

  if (isSchemaLoading || isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <AddPage
      title={t("roleLabel")}
      apiUrl="/api/restaurant/roles"
      queryKey="roles"
      initialData={formattedInitialData}
      onSuccessAction={(res) => {
        const targetId = res?.data?.data?.id || res?.data?.id || res?.id || role?.id;
        navigate("/permissions", { state: { highlightedId: targetId } });
      }}
      fields={[
        { name: "name", label: t("roleNameLabel"), type: "text", required: true },
        { name: "permissions", type: "hidden" },
      ]}
      transformPayload={(data) => ({
        ...data,
        permissions: data.permissions || [],
      })}
    >
      {({ setValue, watch }) => {
        const permissions = watch("permissions");

        // دالة لجلب الحالة الحالية بدمج الـ form state مع الـ permissionMap الأصلي للـ role
        const getFullCurrentPermissions = () => {
          if (Array.isArray(permissions)) {
            return [...permissions];
          }
          // لو لم يتم التعديل بعد، نبنيها من البيانات الأصلية للـ role
          return availableModules.map((m) => {
            const modKey = norm(m);
            const acts = permissionMap[modKey] || [];
            return {
              module: m,
              actions: acts.map(a => ({ action: a }))
            };
          }).filter(m => m.actions.length > 0);
        };

        const getModuleActions = (module) => {
          const currentList = getFullCurrentPermissions();
          const formModule = currentList.find((p) => norm(p.module) === norm(module));
          if (formModule) {
            return formModule.actions?.map((a) => norm(typeof a === "string" ? a : a.action)) || [];
          }
          return [];
        };

        const togglePermission = (module, action) => {
          const mod = norm(module);
          const act = norm(action);

          let updated = getFullCurrentPermissions();
          const index = updated.findIndex((p) => norm(p.module) === mod);

          if (index === -1) {
            updated.push({
              module,
              actions: [{ action }],
            });
          } else {
            const currentActions = updated[index].actions.map((a) =>
              norm(typeof a === "string" ? a : a.action),
            );

            if (currentActions.includes(act)) {
              updated[index].actions = updated[index].actions.filter(
                (a) => norm(typeof a === "string" ? a : a.action) !== act,
              );
            } else {
              updated[index].actions.push({ action });
            }

            if (updated[index].actions.length === 0) {
              updated.splice(index, 1);
            }
          }

          setValue("permissions", updated, { shouldDirty: true, shouldValidate: true });
        };

        const toggleModulePermissions = (module, isChecked) => {
          const mod = norm(module);
          let updated = getFullCurrentPermissions();
          const index = updated.findIndex((p) => norm(p.module) === mod);

          if (isChecked) {
            const allActions = availableActions.map((action) => ({ action }));
            if (index === -1) {
              updated.push({ module, actions: allActions });
            } else {
              updated[index].actions = allActions;
            }
          } else {
            if (index !== -1) {
              updated.splice(index, 1);
            } else {
              updated = updated.filter((p) => norm(p.module) !== mod);
            }
          }
          setValue("permissions", updated, { shouldDirty: true, shouldValidate: true });
        };

        const toggleAllPermissions = (isChecked) => {
          if (isChecked) {
            const allPermissions = availableModules.map((module) => ({
              module,
              actions: availableActions.map((action) => ({ action })),
            }));
            setValue("permissions", allPermissions, { shouldDirty: true, shouldValidate: true });
          } else {
            setValue("permissions", [], { shouldDirty: true, shouldValidate: true });
          }
        };

        const filteredModules = availableModules.filter((module) =>
          module.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );

        const isAllGlobalChecked =
          availableModules.length > 0 &&
          availableModules.every((module) => {
            const currentActions = getModuleActions(module);
            return availableActions.every((action) => currentActions.includes(norm(action)));
          });

        return (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <Input
                type="text"
                placeholder={t("searchModules", "ابحث عن الصلاحية...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
              <Checkbox
                checked={isAllGlobalChecked}
                onCheckedChange={toggleAllPermissions}
                id="selectAll"
              />
              <Label htmlFor="selectAll" className="font-bold text-lg cursor-pointer">
                {t("selectAll", "تحديد الكل")}
              </Label>
            </div>

            {filteredModules.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                {t("noResults", "لا توجد نتائج مطابقة لبحثك.")}
              </div>
            )}

            {filteredModules.map((module) => {
              const currentModuleActions = getModuleActions(module);
              const isModuleFullyChecked =
                availableActions.length > 0 &&
                availableActions.every((action) => currentModuleActions.includes(norm(action)));

              return (
                <div key={module} className="border p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <Checkbox
                      checked={isModuleFullyChecked}
                      onCheckedChange={(checked) => toggleModulePermissions(module, checked)}
                      id={`module-${module}`}
                    />
                    <Label htmlFor={`module-${module}`} className="font-bold text-md cursor-pointer">
                      {module.replace("_", " ")}
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pl-6">
                    {availableActions.map((action) => {
                      const isChecked = currentModuleActions.includes(norm(action));

                      return (
                        <div key={action} className="flex items-center gap-2">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => togglePermission(module, action)}
                            id={`action-${module}-${action}`}
                          />
                          <Label htmlFor={`action-${module}-${action}`} className="cursor-pointer">
                            {action}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }}
    </AddPage>
  );
}