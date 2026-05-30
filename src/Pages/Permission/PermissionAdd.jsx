import React, { useMemo } from "react";
import AddPage from "@/components/AddPage";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import api from "@/api/axios";
import { useParams } from "react-router-dom";

export default function PermissionAdd() {
  const { t } = useTranslation();
  const { id } = useParams();

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

  // ================= Permission Map (IMPORTANT FIX) =================
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
            const currentActions =
              updated[index].actions.map((a) => norm(a.action));

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

        return (
          <div className="space-y-6">
            {availableModules.map((module) => (
              <div key={module} className="border p-4 rounded-lg">
                <h3 className="font-bold mb-3">
                  {module.replace("_", " ")}
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {availableActions.map((action) => {
                    const isChecked =
                      getModuleActions(module).includes(norm(action));

                    return (
                      <div key={action} className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() =>
                            togglePermission(module, action)
                          }
                        />
                        <Label>{action}</Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      }}
    </AddPage>
  );
}