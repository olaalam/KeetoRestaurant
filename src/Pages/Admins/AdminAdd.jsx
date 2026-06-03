import React from "react";
import { useParams, useLocation } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";
const AdminAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
 const { t } = useTranslation();
  const { data: adminData, isLoading: isFetching } = useQuery({
    queryKey: ["admin", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurant/restaurantadmin/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.adminData,
  });

  const { data: branches = [], isLoading: isBranchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data } = await api.get("/api/restaurant/branches");
      return data.data.data;
    },
  });

  const rawData = state?.adminData || adminData;

  // ✅ Initialize with type default if creating a new entry
  const initialData = rawData ? { ...rawData } : { type: "subadmin" };

  // ✅ Use "none" string instead of empty string for optional branches
  const branchOptions = [
    { value: "none", label: t("none") },
    ...branches.map((branch) => ({
      value: branch.id,
      label: branch.name,
    })),
  ];

  const roleOptions = [
    { value: "subadmin", label: t("subAdmin") },
    { value: "branch_manager", label: t("branchManager") },
    { value: "staff", label: t("staff") },
  ];

  const adminFields = [
    { name: "name", label: t("name"), required: true },
    { name: "nameAr", label: t("nameAr"), required: true },
    { name: "nameFr", label: t("nameFr"), required: true },
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
      label: t("adminRoleType"),
      type: "combobox",
      required: true,
      options: roleOptions,
    },
    {
      name: "branchId",
      label: t("branchPermission"),
      type: "combobox",
      required: false,
      options: branchOptions,
      transform: (value) => (value === "none" ? null : value),
    },
  ];

  if (id && isFetching) return <LoadingSpinner />;
  if (isBranchesLoading) return <LoadingSpinner />;

  return (
    <AddPage
      title={t("admins")}
      apiUrl="/api/restaurant/restaurantadmin"
      queryKey="admins"
      fields={adminFields}
      initialData={initialData}
      onSuccessAction={() => window.history.back()}
    />
  );
};

export default AdminAdd;
