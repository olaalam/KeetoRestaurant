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
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react';
import { useGet } from '@/hooks/useGet';

// Brand identity colors from Figma
const COLORS = ['#F5A623', '#1C1B2E', '#4A90E2', '#E2574C', '#2CA01C'];

export default function Dashboard() {
    // Search filters (Branches and Date ranges)
    const [branch, setBranch] = useState('all');
    const [dateRange, setDateRange] = useState('30days');

    // Fetch data using your custom useGet Hook
    const { data: response, isLoading, isError } = useGet(
        'restaurantReport', 
        '/api/restaurant/report/my-restaurant', 
        { branch, dateRange }
    );

    // Loading State
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <p className="text-lg font-semibold text-gray-600 animate-pulse">Loading data...</p>
            </div>
        );
    }

    // Error State
    if (isError || !response?.success) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <p className="text-lg font-semibold text-red-500">An error occurred while loading the dashboard data.</p>
            </div>
        );
    }

    // Extracting data from API response
    const reportData = response.data.data;
    const { overview, financials, ordersBySource, branchBreakdown, dailyTrend, topSellingItems } = reportData;

    // Map Order Sources data
    const sourceChartData = ordersBySource.map(source => ({
        name: source.orderSource === 'food_aggregator' ? 'Food Aggregator' : 'Online Order',
        value: source.count
    }));

    // Map Branches data
    const branchChartData = branchBreakdown.map(b => ({
        name: b.branchName,
        revenue: parseFloat(b.totalAmount)
    }));

    // Map Top Selling Items data (Top 5 only)
    const topItemsData = topSellingItems.slice(0, 5).map(item => ({
        name: item.foodName,
        revenue: parseFloat(item.totalRevenue)
    }));

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-left" dir="ltr">
            
            {/* Top Section: Restaurant Info & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <img src={reportData.restaurant.logo} alt="Logo" className="w-12 h-12 rounded-full border" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{reportData.restaurant.name} Dashboard</h1>
                        <p className="text-sm text-gray-500">Status: <span className="capitalize">{reportData.restaurant.status}</span></p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                    <select 
                        value={branch} 
                        onChange={(e) => setBranch(e.target.value)}
                        className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none"
                    >
                        <option value="all">All Branches</option>
                        {branchBreakdown.map(b => (
                            <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                        ))}
                    </select>

                    <select 
                        value={dateRange} 
                        onChange={(e) => setDateRange(e.target.value)}
                        className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none"
                    >
                        <option value="30days">Last 30 Days</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>
            </div>

            {/* Statistical Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Total Revenue Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">${parseFloat(financials.totalRevenue).toLocaleString()}</h3>
                        <p className="text-xs text-green-500 mt-1 font-semibold">+12.5% from last month</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
                        <DollarSign size={24} />
                    </div>
                </div>

                {/* Total Orders Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Total Orders</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{overview.totalAttemptedOrders}</h3>
                        <p className="text-xs text-green-500 mt-1 font-semibold">+8.2% from last month</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
                        <ShoppingBag size={24} />
                    </div>
                </div>

                {/* Avg Order Value Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Avg. Order Value</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">${parseFloat(overview.avgOrderValue).toFixed(1)}</h3>
                        <p className="text-xs text-green-500 mt-1 font-semibold">+3.8% from last month</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
                        <TrendingUp size={24} />
                    </div>
                </div>

                {/* Cancellation Rate Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Cancellation Rate</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{overview.cancellationRate}</h3>
                        <p className="text-xs text-gray-500 mt-1">{overview.cancelledOrders} cancelled orders</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                </div>
            </div>

            {/* Charts Section - Part 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Daily Revenue Trend Chart */}
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

                {/* Top Selling Items Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Top 5 Selling Items by Revenue</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" h="100%">
                            <BarChart data={topItemsData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#F5A623" radius={[0, 4, 4, 0]} name="Revenue" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Section - Part 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Sources Donut Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Order Sources</h4>
                    <div className="h-64 flex flex-col justify-center items-center">
                        <ResponsiveContainer width="100%" h="100%">
                            <PieChart>
                                <Pie
                                    data={sourceChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sourceChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Branch Breakdown Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Net Sales by Branch</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" h="100%">
                            <BarChart data={branchChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#F5A623" radius={[4, 4, 0, 0]} name="Net Sales" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Financial Settlements Section */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-md font-bold text-gray-800 mb-4">Settlements & Current Financial Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Cash Collected by You</p>
                        <p className="text-lg font-bold text-gray-800 mt-1">{reportData.settlement.cashCollectedByYou} EGP</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Digital Collected by Platform</p>
                        <p className="text-lg font-bold text-gray-800 mt-1">{reportData.settlement.digitalCollectedByPlatform} EGP</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-700 font-medium">Settlement Status</p>
                        <p className="text-md font-bold text-amber-900 mt-1 capitalize">{reportData.settlement.status}</p>
                    </div>
                </div>
            </div>

        </div>
    );
}