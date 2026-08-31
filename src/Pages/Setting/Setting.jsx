import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "@/hooks/useTranslation";
import { CalendarDays, X, BellRing, CheckCircle2 } from 'lucide-react';

export default function Setting() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSchedules, setSelectedSchedules] = useState([]);

    const [isStatusesDialogOpen, setIsStatusesDialogOpen] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState([]);

    const { data: setting = [], isLoading } = useQuery({
        queryKey: ['setting'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurantsetting');
            const settingsData = res.data?.data?.settings || {};
            const schedulesData = res.data?.data?.schedules || [];

            return [{
                ...settingsData,
                schedules: schedulesData
            }];
        }
    });

    const getDayName = (dayNum) => {
        const days = [
            t('sunday', { defaultValue: 'Sunday' }),
            t('monday', { defaultValue: 'Monday' }),
            t('tuesday', { defaultValue: 'Tuesday' }),
            t('wednesday', { defaultValue: 'Wednesday' }),
            t('thursday', { defaultValue: 'Thursday' }),
            t('friday', { defaultValue: 'Friday' }),
            t('saturday', { defaultValue: 'Saturday' })
        ];
        return days[dayNum] || '';
    };

    const columns = [
        {
            accessorKey: "foodManagement",
            header: t("foodManagement", { defaultValue: "Food Management" }),
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 rounded text-xs ${getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {getValue() ? t("enabled", { defaultValue: "Enabled" }) : t("disabled", { defaultValue: "Disabled" })}
                </span>
            )
        },
        {
            accessorKey: "scheduledDelivery",
            header: t("scheduledDelivery", { defaultValue: "Scheduled Delivery" }),
            cell: ({ getValue }) => getValue() ? t("yes", { defaultValue: "Yes" }) : t("no", { defaultValue: "No" })
        },
        {
            accessorKey: "reviewsSection",
            header: t("reviews", { defaultValue: "Reviews" }),
            cell: ({ getValue }) => getValue() ? t("visible", { defaultValue: "Visible" }) : t("hidden", { defaultValue: "Hidden" })
        },
        {
            accessorKey: "posSection",
            header: t("pos", { defaultValue: "POS" }),
            cell: ({ getValue }) => getValue() ? t("active", { defaultValue: "Active" }) : t("inactive", { defaultValue: "Inactive" })
        },
        {
            accessorKey: "homeDelivery",
            header: t("homeDelivery", { defaultValue: "Home Delivery" }),
            cell: ({ getValue }) => getValue() ? t("available", { defaultValue: "Available" }) : t("na", { defaultValue: "N/A" })
        },
        {
            accessorKey: "minOrderAmount",
            header: t("minOrder", { defaultValue: "Min Order" }),
            cell: ({ getValue }) => `${getValue()} EGP`
        },
        {
            header: t("deliveryTime", { defaultValue: "Delivery Time" }),
            cell: ({ row }) => `${row.original.minDeliveryTime} - ${row.original.maxDeliveryTime} min`
        },
        {
            accessorKey: "resetDailyOrderNumberTime", // 👈 إضافة عمود وقت إعادة التصفير
            header: t("resetDailyOrderNumberTime", { defaultValue: "Reset Order Time" }),
            cell: ({ getValue }) => getValue() ? getValue().substring(0, 5) : '-'
        },
        {
            accessorKey: "dineIn",
            header: t("dineIn", { defaultValue: "Dine In" }),
            cell: ({ getValue }) => getValue() ? t("yes", { defaultValue: "Yes" }) : t("no", { defaultValue: "No" })
        },
        {
            accessorKey: "repeatNotification",
            header: t("repeatNotification", { defaultValue: "Repeat Notification" }),
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 rounded text-xs ${getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {getValue() ? t("enabled", { defaultValue: "Enabled" }) : t("disabled", { defaultValue: "Disabled" })}
                </span>
            )
        },
        {
            accessorKey: "repeatNotificationDuration",
            header: t("repeatNotificationDuration", { defaultValue: "Repeat Duration" }),
            cell: ({ getValue, row }) => row.original.repeatNotification ? `${getValue()}` : '-'
        },
        {
            id: "repeatNotificationStatuses",
            header: t("repeatNotificationStatuses", { defaultValue: "Repeat Statuses" }),
            cell: ({ row }) => {
                if (!row.original.repeatNotification) return '-';

                let statuses = [];
                const rawStatuses = row.original.repeatNotificationStatuses;
                if (typeof rawStatuses === 'string') {
                    try {
                        statuses = JSON.parse(rawStatuses);
                    } catch (error) {
                        statuses = [];
                    }
                } else if (Array.isArray(rawStatuses)) {
                    statuses = rawStatuses;
                }

                return (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStatuses(statuses);
                            setIsStatusesDialogOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors shadow-sm"
                    >
                        <BellRing className="w-3.5 h-3.5" />
                        {t("viewStatuses", { defaultValue: "View Statuses" })}
                    </button>
                );
            }
        },
        {
            id: "workingHours",
            header: t("workingHours", { defaultValue: "Working Hours" }),
            cell: ({ row }) => {
                const schedules = row.original.schedules || [];
                return (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchedules(schedules);
                            setIsDialogOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                    >
                        <CalendarDays className="w-3.5 h-3.5" />
                        {t("viewSchedules", { defaultValue: "View" })}
                    </button>
                );
            }
        }
    ];

    return (
        <div className="container mx-auto py-10 relative">
            <GenericDataTable
                title={t("restaurantSetting")}
                columns={columns}
                data={setting}
                isLoading={isLoading}
                queryKey="setting"
                editApiUrl="/api/restaurant/restaurantsetting"
                onEdit={(settingItem) => navigate(`/setting/edit/${settingItem.id}`)}
            />

            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t("workingHours", { defaultValue: "Working Hours" })}
                                </h3>
                            </div>
                            <button onClick={() => setIsDialogOpen(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                            {selectedSchedules.length > 0 ? (
                                [...selectedSchedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((schedule) => (
                                    <div key={schedule.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50 text-sm">
                                        <span className="font-medium text-gray-700">{getDayName(schedule.dayOfWeek)}</span>
                                        {schedule.isOffDay ? (
                                            <span className="px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-50 rounded-md">{t("offDay", { defaultValue: "Closed" })}</span>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-gray-600 font-mono text-xs dir-ltr">
                                                <span>{schedule.openingTime}</span><span className="text-gray-400">-</span><span>{schedule.closingTime}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-4">{t("noSchedulesFound", { defaultValue: "No schedule data available" })}</p>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t bg-gray-50/50 flex justify-end">
                            <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                                {t("close", { defaultValue: "Close" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isStatusesDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <BellRing className="w-5 h-5 text-blue-600" />
                                <h3 className="text-base font-semibold text-gray-900">
                                    {t("repeatNotificationStatuses", { defaultValue: "Repeat Statuses" })}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsStatusesDialogOpen(false)}
                                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {selectedStatuses.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {selectedStatuses.map((status, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm font-medium capitalize"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            {status.replace('_', ' ')}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-4">
                                    {t("noStatusesFound", { defaultValue: "No statuses selected." })}
                                </p>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50/50 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsStatusesDialogOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {t("close", { defaultValue: "Close" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}