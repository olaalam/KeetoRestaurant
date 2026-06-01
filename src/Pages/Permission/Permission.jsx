import React, { useState, useEffect } from 'react';
import GenericDataTable from '@/components/GenericDataTable';
import ViewPermissionsModal from './ViewPermissionsModal';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";
import api from '@/api/axios';
export default function Permission() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [selectedRole, setSelectedRole] = useState(null);
        const [highlightedId, setHighlightedId] = useState(null);
    
        // 💡 مراقبة ما إذا كنا راجعين من صفحة الحفظ ومعنا المعرف الخاص بالعنصر
        useEffect(() => {
            if (location.state?.highlightedId) {
                setHighlightedId(location.state.highlightedId);
                
                // إخفاء الوميض بعد 4 ثوانٍ ليعود الصف لطبيعته
                const timer = setTimeout(() => {
                    setHighlightedId(null);
                    // تفريغ الـ state حتى لا يضيء مجدداً عند عمل ريفريش للصفحة
                    navigate(location.pathname, { replace: true, state: {} });
                }, 4000);
    
                return () => clearTimeout(timer);
            }
        }, [location.state, navigate, location.pathname]);

    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/roles');
            console.log(res.data.data.roles)
            return res.data.data.roles;
        }
    });

    const columns = [
        { accessorKey: 'name', header: t('name') },
        // { accessorKey: 'nameAr', header: t('nameAr') },
        // { accessorKey: 'nameFr', header: t('nameFr') },
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
                editApiUrl="/api/restaurant/roles"
                onAdd={() => navigate('/permissions/add')}
                onEdit={(row) => navigate(`/permissions/edit/${row.id}`)}
                highlightedId={highlightedId}
            />

            <ViewPermissionsModal
                isOpen={!!selectedRole}
                onClose={() => setSelectedRole(null)}
                role={selectedRole}
            />
        </div>
    );
}