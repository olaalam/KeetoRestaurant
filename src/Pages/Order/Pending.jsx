import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { User, Phone, Eye } from "lucide-react";
import { Button } from '@/components/ui/button';


export default function Pending() {
    const navigate = useNavigate();




    const { data: pendingOrders = [], isLoading } = useQuery({
        queryKey: ['orders-pending'],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/order/pending`);
            return res.data.data.data;
        }
    });


    const columns = [
        {
            accessorKey: "orderNumber",
            header: "Order Number",
            cell: ({ row }) => (
                <span className="font-medium text-gray-700">
                    {row.getValue("orderNumber")}
                </span>
            )
        },
        {
            accessorKey: "customerName",
            header: "Customer Info",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 font-medium text-gray-800">
                        <User size={14} className="text-gray-500" />
                        {row.original.customerName}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone size={12} />
                        {row.original.customerPhone}
                    </div>
                </div>
            )
        },
        {
            accessorKey: "orderType",
            header: "Order Type",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${row.original.orderType === 'delivery' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {row.original.orderType}
                </span>
            )
        },
        {
            accessorKey: "totalAmount",
            header: "Total Amount",
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">
                    {row.getValue("totalAmount")} E£
                </span>
            )
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${row.original.status === 'pending' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {row.original.status.replace(/_/g, ' ')}
                </span>
            )
        },
        {
            accessorKey: "createdAt",
            header: "Date & Time",
            cell: ({ row }) => {
                const date = new Date(row.original.createdAt);
                return (
                    <div className="flex flex-col text-sm">
                        <span>{date.toLocaleDateString()}</span>
                        <span className="text-xs text-gray-500">{date.toLocaleTimeString()}</span>
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const orderId = row.original.id;

                return (
                    <div className="flex items-center justify-center">
                        {/* زر العين فقط للتوجيه لصفحة التفاصيل */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-primary/10 text-primary"
                            onClick={() => navigate(`/orders/details/${orderId}`)}
                        >
                            <Eye size={18} />
                        </Button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Pending Orders"
                columns={columns}
                data={pendingOrders}
                isLoading={isLoading}
                queryKey="orders-pending"
                onEdit={false}
                actions={false}
            />
        </div>
    );
}