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
import { DollarSign, ShoppingBag, TrendingUp, Star, ShoppingCart, XCircle } from 'lucide-react';
import { useGet } from '@/hooks/useGet';

const COLORS = ['#F5A623', '#1C1B2E', '#4A90E2', '#E2574C', '#2CA01C', '#8E44AD', '#D35400'];

export default function Dashboard() {
    const [branch, setBranch] = useState('all');
    const [dateRange, setDateRange] = useState('30days');

    const { data: response, isLoading, isError } = useGet(
        ['restaurantReport', branch, dateRange],
        '/api/restaurant/report/dashboard',
        { branch, dateRange }
    );

    const isInitialLoading = isLoading && !response;

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <p className="text-lg font-semibold text-gray-600 animate-pulse">Loading dashboard data...</p>
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

    const reportData = response?.data || {};
    const {
        cards = {},
        peakHours = [],
        peakDays = [],
        topProducts = [],
        cancellations = [],
        branchesNetSales = [],
        appVsWebsite = [],
        rating = "0.00",
        geographicMap = [],
        marketBasket = []
    } = reportData;

    // --- Custom Tooltip ---
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
                    <p className="font-bold text-gray-800 mb-1">{label || payload[0].name}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color || '#333' }}>
                            {entry.name}: <span className="font-semibold">{entry.value}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Parse values for charts
    const peakDaysData = peakDays.map(d => ({ ...d, revenue: parseFloat(d.revenue || 0) }));
    const branchesData = branchesNetSales.map(b => ({ ...b, netSales: parseFloat(b.netSales || 0) }));
    const topProductsData = topProducts.map(p => ({ ...p, revenue: parseFloat(p.revenue || 0) }));
    const geoData = geographicMap.map(g => ({ ...g, revenue: parseFloat(g.revenue || 0) }));

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-left" dir="ltr">

            {/* Top Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Restaurant Analytics Dashboard</h1>
                    <p className="text-sm text-gray-500">Real-time reports & operational metrics</p>
                </div>
                <div className="flex gap-3 relative">
                    {isLoading && <span className="absolute -top-6 right-0 text-xs text-blue-500 animate-pulse">Updating...</span>}
                    <select value={branch} onChange={(e) => setBranch(e.target.value)} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-100">
                        <option value="all">All Branches</option>
                        {branchesNetSales.map((b, idx) => <option key={idx} value={b.branch}>{b.branch}</option>)}
                    </select>
                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-100">
                        <option value="30days">Last 30 Days</option>
                        <option value="7days">Last 7 Days</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{parseFloat(cards.totalRevenue || 0).toLocaleString()} EGP</h3>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-500"><DollarSign size={24} /></div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Number of Orders</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{cards.numberOfOrders || 0}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-500"><ShoppingBag size={24} /></div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Avg. Order Value</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{parseFloat(cards.averageOrderValue || 0).toFixed(2)} EGP</h3>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-xl text-orange-500"><TrendingUp size={24} /></div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Rating</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{rating} / 5.0</h3>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-xl text-yellow-500"><Star size={24} /></div>
                </div>
            </div>

            {/* Peak Hours & Peak Days */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Peak Hours (Orders)</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={peakHours}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="orders" fill="#1C1B2E" radius={[4, 4, 0, 0]} name="Orders" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Peak Days (Revenue)</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={peakDaysData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill="#F5A623" radius={[4, 4, 0, 0]} name="Revenue (EGP)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Branch Net Sales & Platform Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Branches Net Sales</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={branchesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="netSales" fill="#4A90E2" radius={[4, 4, 0, 0]} name="Net Sales (EGP)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">App vs Website Orders</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={appVsWebsite} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="orders" nameKey="platform">
                                    {appVsWebsite.map((entry, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Products & Geographic Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Top Products by Revenue</h4>
                    <div className="h-80 overflow-y-auto pr-2">
                        <ResponsiveContainer width="100%" height={topProductsData.length * 50 || 300}>
                            <BarChart data={topProductsData} layout="vertical" barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="productName" type="category" width={110} tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill="#2CA01C" radius={[0, 4, 4, 0]} name="Revenue (EGP)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Geographic Sales Map</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={geoData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="zone" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill="#8E44AD" radius={[4, 4, 0, 0]} name="Revenue (EGP)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Cancellations & Market Basket */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <XCircle size={20} className="text-red-500" />
                        <h4 className="text-md font-bold text-gray-800">Cancellations Breakdown</h4>
                    </div>
                    <div className="space-y-3">
                        {cancellations.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-sm font-semibold text-gray-700">{item.type}</span>
                                <span className="text-sm font-bold text-red-500">{item.orders} Orders</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingCart size={20} className="text-blue-500" />
                        <h4 className="text-md font-bold text-gray-800">Market Basket Analysis (Top Combos)</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-gray-100 text-gray-700 uppercase">
                                <tr>
                                    <th className="p-3 border-b">Combo Name</th>
                                    <th className="p-3 border-b text-right">Confidence %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {marketBasket.map((combo, idx) => (
                                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{combo.comboName}</td>
                                        <td className="p-3 text-right font-bold text-blue-600">{combo.confidencePercent}%</td>
                                    </tr>
                                ))}
                                {marketBasket.length === 0 && (
                                    <tr>
                                        <td colSpan="2" className="p-3 text-center text-gray-500">No combos available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}