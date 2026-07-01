import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Wallet } from 'lucide-react';
import { useGet } from '@/hooks/useGet';

// Brand identity colors
const COLORS = ['#F5A623', '#1C1B2E', '#4A90E2', '#E2574C', '#2CA01C', '#8E44AD', '#D35400'];

export default function Dashboard() {
    // Search filters
    const [branch, setBranch] = useState('all');
    const [dateRange, setDateRange] = useState('30days');

    // Fetch data
    const { data: response, isLoading, isError } = useGet(
        'restaurantReport',
        '/api/restaurant/report/my-restaurant',
        { branch, dateRange }
    );

    // حل مشكلة الريفريش: عرض شاشة التحميل فقط في حالة عدم وجود أي بيانات مسبقة
    // وبكده الفلتر هيتحدث في الخلفية بدون ما يعمل ريفريش للصفحة بالكامل
    const isInitialLoading = isLoading && !response;

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <p className="text-lg font-semibold text-gray-600 animate-pulse">Loading data...</p>
            </div>
        );
    }

    if (isError || !response?.success) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <p className="text-lg font-semibold text-red-500">An error occurred while loading the dashboard data.</p>
            </div>
        );
    }

    // Extracting ALL data from API response without ignoring any part
    const reportData = response.data.data;
    const {
        overview,
        financials,
        ordersBySource,
        ordersByPayment,
        ordersByType,
        ordersByStatus,
        branchBreakdown,
        dailyTrend,
        topSellingItems,
        settlement,
        wallet,
        businessPlans
    } = reportData;

    // Formatting Charts Data
    const formatLabel = (str) => str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const sourceChartData = ordersBySource.map(source => ({
        name: formatLabel(source.orderSource || 'Unknown'),
        value: source.count
    }));

    const paymentChartData = ordersByPayment.map(payment => ({
        name: formatLabel(payment.paymentMethod || 'Unknown'),
        value: payment.count
    }));

    const typeChartData = ordersByType.map(type => ({
        name: formatLabel(type.orderType || 'Unknown'),
        value: type.count
    }));

    const branchChartData = branchBreakdown.map(b => ({
        name: b.branchName,
        revenue: parseFloat(b.totalAmount)
    }));

    const topItemsData = topSellingItems.slice(0, 5).map(item => ({
        name: item.foodName,
        revenue: parseFloat(item.totalRevenue)
    }));

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-left" dir="ltr">

            {/* Top Section: Restaurant Info & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <img src={reportData.restaurant.logo} alt="Logo" className="w-12 h-12 rounded-full border bg-white" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{reportData.restaurant.name} Dashboard</h1>
                        <p className="text-sm text-gray-500">Status: <span className="capitalize text-green-600 font-medium">{reportData.restaurant.status}</span></p>
                    </div>
                </div>




                {/* Filters */}

            </div>

            {/* Statistical Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">${parseFloat(financials.totalRevenue).toLocaleString()}</h3>
                        <p className="text-xs text-gray-500 mt-1">Net: ${parseFloat(financials.netRevenue).toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Total Orders</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{overview.totalAttemptedOrders}</h3>
                        <p className="text-xs text-gray-500 mt-1">Valid: {overview.validFinancialOrders}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
                        <ShoppingBag size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Avg. Order Value</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">${parseFloat(overview.avgOrderValue).toFixed(1)}</h3>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Cancellation Rate</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{overview.cancellationRate}</h3>
                        <p className="text-xs text-red-500 mt-1">{overview.cancelledOrders} cancelled orders</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                </div>
            </div>

            {/* Main Charts: Revenue Trend & Branch Net Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Revenue & Daily Trend Analysis</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" h="100%">
                            <BarChart data={dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#1C1B2E" radius={[4, 4, 0, 0]} name="Revenue" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Net Sales by Branch</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" h="100%">
                            <BarChart data={branchChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#F5A623" radius={[4, 4, 0, 0]} name="Net Sales" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Breakdowns: Sources, Payment, Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Source Breakdown */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Orders by Source</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" h="100%">
                            <PieChart>
                                <Pie data={sourceChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                    {sourceChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Orders by Payment</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" h="100%">
                            <PieChart>
                                <Pie data={paymentChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                    {paymentChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Type Breakdown */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Orders by Type</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" h="100%">
                            <PieChart>
                                <Pie data={typeChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                    {typeChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Items & Orders By Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Selling Items */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Top 5 Selling Items</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" h="100%">
                            <BarChart data={topItemsData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#4A90E2" radius={[0, 4, 4, 0]} name="Revenue" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders by Status Details */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-auto h-[340px]">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Orders Status Breakdown</h4>
                    <div className="space-y-3">
                        {ordersByStatus.map((statusItem, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 capitalize">{formatLabel(statusItem.status)}</p>
                                    <p className="text-xs text-gray-500">{statusItem.count} orders</p>
                                </div>
                                <p className="text-sm font-bold text-gray-800">{statusItem.totalAmount} EGP</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Financial, Wallet & Settlement Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Settlement Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Settlement Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">Cash Collected by You</p>
                            <p className="text-md font-bold text-gray-800 mt-1">{settlement.cashCollectedByYou}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">Digital by Platform</p>
                            <p className="text-md font-bold text-gray-800 mt-1">{settlement.digitalCollectedByPlatform}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                        <p className="text-sm text-amber-700 font-medium">Settlement Status</p>
                        <p className="text-md font-bold text-amber-900 mt-1 capitalize">{settlement.status}</p>
                    </div>
                </div>

                {/* Wallet Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Wallet size={20} className="text-gray-800" />
                        <h4 className="text-md font-bold text-gray-800">Wallet Summary</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 border rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Total Earning</p>
                            <p className="text-lg font-bold text-green-600">{wallet.totalEarning}</p>
                        </div>
                        <div className="p-4 border rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Collected Cash</p>
                            <p className="text-lg font-bold text-gray-800">{wallet.collectedCash}</p>
                        </div>
                        <div className="p-4 border rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Pending Withdraw</p>
                            <p className="text-lg font-bold text-orange-500">{wallet.pendingWithdraw}</p>
                        </div>
                        <div className="p-4 border rounded-xl bg-gray-50">
                            <p className="text-xs text-gray-500 mb-1">Balance</p>
                            <p className={`text-lg font-bold ${parseFloat(wallet.balance) < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                                {wallet.balance}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Plans Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-md font-bold text-gray-800 mb-4">Business Plans & Commission Rates</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-3 border-b">Platform Type</th>
                                <th className="p-3 border-b">Commission Rate</th>
                                <th className="p-3 border-b">Service Fee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {businessPlans.map((plan, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-800">{formatLabel(plan.platformType) || 'Default / None'}</td>
                                    <td className="p-3">{plan.commissionRate}%</td>
                                    <td className="p-3">{plan.serviceFee}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}