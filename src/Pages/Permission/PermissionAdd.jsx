import React, { useMemo, useState } from "react"; // 💡 أضفنا useState
import AddPage from "@/components/AddPage";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // 💡 استيراد مكون الـ Input (تأكد من وجوده أو استخدم <input> العادي)
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react"; // 💡 أضفنا أيقونة البحث
import { useTranslation } from "@/hooks/useTranslation";
import api from "@/api/axios";
import { useNavigate, useParams } from "react-router-dom";

export default function PermissionAdd() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const norm = (v) => v?.trim().toLowerCase();

  // 💡 State لحفظ كلمة البحث
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
        const permissions = watch("permissions") || [];

        const getModuleActions = (module) => {
          const formModule = permissions.find((p) => norm(p.module) === norm(module));
          if (formModule) {
            return formModule.actions?.map((a) => norm(a.action)) || [];
          }
          return permissionMap[norm(module)] || [];
        };

        const togglePermission = (module, action) => {
          const mod = norm(module);
          const act = norm(action);

          let updated = permissions.length > 0 ? [...permissions] : availableModules.map(m => ({
            module: m,
            actions: (permissionMap[norm(m)] || []).map(a => ({ action: a }))
          })).filter(m => m.actions.length > 0);

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

        const toggleModulePermissions = (module, isChecked) => {
          const mod = norm(module);
          let updated = permissions.length > 0 ? [...permissions] : availableModules.map(m => ({
            module: m,
            actions: (permissionMap[norm(m)] || []).map(a => ({ action: a }))
          })).filter(m => m.actions.length > 0);

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
              updated = updated.filter(p => norm(p.module) !== mod);
            }
          }
          setValue("permissions", updated, { shouldDirty: true });
        };

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

        // 💡 فلترة الموديولات بناءً على كلمة البحث المدخلة
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

            {/* 💡 حقل البحث (Search Input) */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <Input
                type="text"
                placeholder={t("searchModules", "ابحث عن الصلاحية...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10" // ترك مسافة للأيقونة على اليمين (في حالة الـ RTL)
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

            {/* 💡 رسالة في حالة عدم تطابق أي موديول مع البحث */}
            {filteredModules.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                {t("noResults", "لا توجد نتائج مطابقة لبحثك.")}
              </div>
            )}

            {/* 💡 استخدام filteredModules بدلًا من availableModules */}
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