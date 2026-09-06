import React, { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";

const AdminAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 1️⃣ Fetch Admin Data if Editing[cite: 3]
  const { data: adminData, isLoading: isFetching } = useQuery({
    queryKey: ["admin", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurant/restaurantadmin/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.adminData,
  });

  // 2️⃣ Fetch Branches[cite: 3]
  const { data: branches = [], isLoading: isBranchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data } = await api.get("/api/restaurant/branches");
      return data.data.data;
    },
  });

  // 3️⃣ Fetch Roles dynamically from API[cite: 3]
  const { data: roles = [], isLoading: isRolesLoading } = useQuery({
    queryKey: ["adminRoles"],
    queryFn: async () => {
      const { data } = await api.get("/api/restaurant/restaurantadmin/roles");
      return data?.data?.data || data?.data || data || [];
    },
  });

  const rawData = state?.adminData || adminData;
  const initialData = rawData ? { ...rawData } : {};

  // 🔹 State لمتابعة الـ type الحالي للتحكم في إظهار/إخفاء حقل الفرع
  const [selectedType, setSelectedType] = useState(initialData?.type || "");

  // ✅ Branch Combobox Options[cite: 3]
  const branchOptions = [
    { value: "none", label: t("none") },
    ...branches.map((branch) => ({
      value: branch.id,
      label: branch.name,
    })),
  ];

  // ✅ Role Combobox Options Map (تأتي من الـ API)[cite: 3]
  const roleOptions = roles.map((role) => {
    if (typeof role === "string") {
      return { value: role, label: t(role) || role };
    }
    return {
      value: role.id || role.value || role.name,
      label: role.name || role.label || role.title || role.id,
    };
  });

  // خيارات الـ type المطلوبة
  const typeOptions = [
    // { value: "owner", label: t("owner") || "Owner" },
    { value: "subadmin", label: t("subadmin") || "Sub Admin" },
    { value: "branch_manager", label: t("branchManager") || "Branch Manager" },
    { value: "staff", label: t("staff") || "Staff" },
  ];

  // شرط إخفاء الفرع إذا كان الـ type هو owner أو subadmin
  const shouldHideBranch = selectedType === "owner" || selectedType === "subadmin";

  const adminFields = [
    { name: "name", label: t("name"), required: true },
    { name: "email", label: t("email"), type: "email", required: true },
    { name: "phoneNumber", label: t("phoneNumber"), required: true },
    ...(!id
      ? [
          {
            name: "password",
            label: t("password"),
            type: "password",
            required: true,
          },
        ]
      : []),
    {
      name: "type",
      label: t("adminType") || "Admin Type",
      type: "combobox",
      required: true,
      options: typeOptions,
      onChange: (eOrVal) => {
        const val = eOrVal?.target ? eOrVal.target.value : eOrVal;
        setSelectedType(val);
      },
    },
    {
      name: "roleId",
      label: t("role") || "Role",
      type: "combobox",
      required: true,
      options: roleOptions,
    },
    ...(!shouldHideBranch
      ? [
          {
            name: "branchId",
            label: t("branchPermission"),
            type: "combobox",
            required: false,
            options: branchOptions,
            transform: (value) => (value === "none" ? null : value),
          },
        ]
      : []),
  ];

  if (id && isFetching) return <LoadingSpinner />;
  if (isBranchesLoading || isRolesLoading) return <LoadingSpinner />;

  return (
    <AddPage
      title={t("admins")}
      apiUrl="/api/restaurant/restaurantadmin"
      queryKey="admins"
      fields={adminFields}
      initialData={initialData}
      onSuccessAction={(res) => {
        const targetId = res?.data?.data?.id || res?.data?.id || res?.id || initialData?.id;
        navigate("/admins", { state: { highlightedId: targetId } });
      }}
    />
  );
};

export default AdminAdd;