import React, { useMemo } from "react";
import AddPage from "@/components/AddPage";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import api from "@/api/axios";
import { useNavigate, useParams } from "react-router-dom";

export default function PermissionAdd() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const norm = (v) => v?.trim().toLowerCase();

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

  // ================= Permission Map =================
  const permissionMap = useMemo(() => {
    const map = {};

    role?.permissions?.forEach((p) => {
      map[norm(p.module)] = p.actions.map((a) => norm(a.action));
    });

    return map;
  }, [role]);

  if (isSchemaLoading || isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const availableModules = schema?.modules || [];
  const availableActions = schema?.actions || [];

  return (
    <AddPage
      title={t("roleLabel")}
      apiUrl="/api/restaurant/roles"
      queryKey="roles"
      initialData={role}
      onSuccessAction={() => {
        navigate(-1);
      }}
      fields={[
        { name: "name", label: t("roleNameLabel"), type: "text", required: true },
        { name: "nameAr", label: t("nameAr"), type: "text", required: true },
        { name: "nameFr", label: t("nameFr"), type: "text", required: true },
        { name: "permissions", type: "hidden" },
      ]}
      transformPayload={(data) => ({
        ...data,
        permissions: data.permissions || [],
      })}
    >
      {({ setValue, watch }) => {
        const permissions = watch("permissions") || [];

        const getModuleActions = (module) => {
          return (
            permissionMap[norm(module)] ||
            permissions.find((p) => norm(p.module) === norm(module))?.actions?.map((a) => norm(a.action)) ||
            []
          );
        };

        const togglePermission = (module, action) => {
          const mod = norm(module);
          const act = norm(action);

          let updated = [...permissions];
          const index = updated.findIndex((p) => norm(p.module) === mod);

          if (index === -1) {
            updated.push({
              module,
              actions: [{ action }],
            });
          } else {
            const currentActions = updated[index].actions.map((a) => norm(a.action));

            if (currentActions.includes(act)) {
              updated[index].actions = updated[index].actions.filter(
                (a) => norm(a.action) !== act
              );
            } else {
              updated[index].actions.push({ action });
            }

            if (updated[index].actions.length === 0) {
              updated.splice(index, 1);
            }
          }

          setValue("permissions", updated, { shouldDirty: true });
        };

        // --- إضافة: تحديد/إلغاء تحديد كل الـ Actions في Module معين ---
        const toggleModulePermissions = (module, isChecked) => {
          const mod = norm(module);
          let updated = [...permissions];
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
            }
          }
          setValue("permissions", updated, { shouldDirty: true });
        };

        // --- إضافة: تحديد/إلغاء تحديد كل الصلاحيات بالكامل ---
        const toggleAllPermissions = (isChecked) => {
          if (isChecked) {
            const allPermissions = availableModules.map((module) => ({
              module,
              actions: availableActions.map((action) => ({ action })),
            }));
            setValue("permissions", allPermissions, { shouldDirty: true });
          } else {
            setValue("permissions", [], { shouldDirty: true });
          }
        };

        // التحقق مما إذا كانت كل الصلاحيات محددة (لزر Select All الرئيسي)
        const isAllGlobalChecked =
          availableModules.length > 0 &&
          availableModules.every((module) => {
            const currentActions = getModuleActions(module);
            return availableActions.every((action) => currentActions.includes(norm(action)));
          });

        return (
          <div className="space-y-6">

            {/* زر تحديد الكل (Global Select All) */}
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

            {availableModules.map((module) => {
              const currentModuleActions = getModuleActions(module);
              // التحقق مما إذا كانت كل الصلاحيات محددة داخل هذا الموديول
              const isModuleFullyChecked =
                availableActions.length > 0 &&
                availableActions.every((action) => currentModuleActions.includes(norm(action)));

              return (
                <div key={module} className="border p-4 rounded-lg">

                  {/* زر تحديد الكل الخاص بالـ Module */}
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

                  {/* الـ Actions الفردية */}
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