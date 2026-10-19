import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Video, Eye, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Videos() {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useTranslation();
    const navigate = useNavigate();

    // جلب القائمة مع الـ Pagination والبحث
    const { data, isLoading } = useGet('restaurant-videos', '/api/restaurant/videos', {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...(searchQuery ? { search: searchQuery } : {}),
    });

    const rawList = data?.data?.data || data?.data || [];
    const formattedData = rawList.map(item => ({
        id: item.id || item._id,
        title: item.title || item.name || '-',
        description: item.description || '-',
        videoUrl: item.videoUrl || item.url || '',
        createdAt: item.createdAt,
    }));

    const columns = [
        {
            accessorKey: 'title',
            header: t('videoTitle', { defaultValue: 'Title' }),
            cell: ({ row }) => (
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {row.original.title}
                </span>
            ),
        },
        {
            accessorKey: 'description',
            header: t('description', { defaultValue: 'Description' }),
            cell: ({ row }) => (
                <span className="text-slate-600 dark:text-slate-400 truncate max-w-[300px] block">
                    {row.original.description}
                </span>
            ),
        },
        {
            id: 'actions',
            header: t('actionsCol', { defaultValue: 'Actions' }),
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/videos/${row.original.id}`)}
                        className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                        title={t('viewDetails', { defaultValue: 'View Details' })}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-6 w-full space-y-4">
            {/* شريط البحث */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-80">
                    <div className="relative w-full">
                        <Search className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder={t('searchVideos', { defaultValue: 'Search videos...' })}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPagination(prev => ({ ...prev, pageIndex: 0 }));
                            }}
                            className="w-full h-9 text-xs pl-9 rounded-xl"
                        />
                    </div>
                </div>
            </div>

            <GenericDataTable
                title={t('videosTitle', { defaultValue: 'Videos Management' })}
                columns={columns}
                data={formattedData}
                isLoading={isLoading}
                queryKey="restaurant-videos"
                deleteApiUrl="/api/restaurant/videos"
                pagination={pagination}
                setPagination={setPagination}
                actions={false}

            />
        </div>
    );
}