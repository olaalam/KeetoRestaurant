import React, { useState } from 'react';
import GenericDataTable from '@/components/GenericDataTable';
import ViewPermissionsModal from './ViewPermissionsModal';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";

export default function Permission() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [selectedRole, setSelectedRole] = useState(null);

    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => fetch('/api/restaurant/roles').then(res => res.json())
    });

    const columns = [
        { accessorKey: 'name', header: t('name') },
        { accessorKey: 'nameAr', header: t('nameAr') },
        { accessorKey: 'nameFr', header: t('nameFr') },
        {
            id: 'view_permissions',
            header: t('permissionsColumn'),
            cell: ({ row }) => (
                <button
                    onClick={() => setSelectedRole(row.original)}
                    className="text-red-600 font-medium hover:underline"
                >
                    {t('viewBtn')}
                </button>
            ),
        }
    ];

    return (
        <div className="p-6">
            <GenericDataTable
                title={t('rolesTable')}
                columns={columns}
                data={roles}
                isLoading={isLoading}
                queryKey="roles"
                deleteApiUrl="/api/restaurant/roles"
                onAdd={() => navigate('/permissions/add')}
                onEdit={(row) => navigate(`/permissions/edit/${row.id}`)}
            />

            <ViewPermissionsModal
                isOpen={!!selectedRole}
                onClose={() => setSelectedRole(null)}
                role={selectedRole}
            />
        </div>
    );
}