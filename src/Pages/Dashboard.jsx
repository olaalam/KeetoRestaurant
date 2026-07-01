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
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Wallet, Activity, CreditCard } from 'lucide-react';
import { useGet } from '@/hooks/useGet';

// Brand identity colors
const COLORS = ['#F5A623', '#1C1B2E', '#4A90E2', '#E2574C', '#2CA01C', '#8E44AD', '#D35400'];

export default function Dashboard() {
    const [branch, setBranch] = useState('all');
    const [dateRange, setDateRange] = useState('30days');

    const { data: response, isLoading, isError } = useGet(
        ['restaurantReport', branch, dateRange],
        '/api/restaurant/report/my-restaurant',
        { branch, dateRange }
    );

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

    const reportData = response.data.data;
    const {
        overview, financials, ordersBySource, ordersByPayment, ordersByType, ordersByStatus,
        branchBreakdown, dailyTrend, topSellingItems, settlement, wallet, businessPlans
    } = reportData;

    // --- Formatting Tools ---
    const formatLabel = (str) => str ? str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';

    // --- Data Prep for Charts ---
    const sourceChartData = ordersBySource.map(s => ({ name: formatLabel(s.orderSource), count: s.count, amount: parseFloat(s.totalAmount) }));
    const paymentChartData = ordersByPayment.map(p => ({ name: formatLabel(p.paymentMethod), count: p.count, amount: parseFloat(p.totalAmount) }));
    const typeChartData = ordersByType.map(t => ({ name: formatLabel(t.orderType), count: t.count, amount: parseFloat(t.totalAmount) }));

    const branchChartData = branchBreakdown.map(b => ({
        name: b.branchName, revenue: parseFloat(b.totalAmount), totalOrders: b.totalOrders, cancelledOrders: b.cancelledOrders
    }));

    const trendData = dailyTrend.map(d => ({
        date: d.date, revenue: parseFloat(d.revenue), orders: d.orders
    }));

    const topItemsData = topSellingItems.map(item => ({
        name: item.foodName, revenue: parseFloat(item.totalRevenue), quantity: item.totalQuantity
    }));

    // --- Custom Tooltips to show all hidden data ---
    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
                    <p className="font-bold text-gray-800 mb-1">{data.name}</p>
                    <p className="text-gray-600">Orders Count: <span className="font-semibold text-gray-800">{data.count}</span></p>
                    <p className="text-gray-600">Total Amount: <span className="font-semibold text-gray-800">{data.amount} EGP</span></p>
                </div>
            );
        }
        return null;
    };

    const CustomBarTooltip = ({ active, payload, label, extraLabels }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
                    <p className="font-bold text-gray-800 mb-2 border-b pb-1">{label}</p>
                    {extraLabels.map((item, idx) => (
                        <p key={idx} className="text-gray-600">{item.label}: <span className="font-semibold text-gray-800">{data[item.key]}</span></p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-left" dir="ltr">

            {/* Top Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <img src={reportData.restaurant.logo} alt="Logo" className="w-12 h-12 rounded-full border bg-white" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{reportData.restaurant.name} Dashboard</h1>
                        <p className="text-sm text-gray-500">Status: <span className="capitalize text-green-600 font-medium">{reportData.restaurant.status}</span></p>
                    </div>
                </div>
                <div className="flex gap-3 relative">
                    {isLoading && <span className="absolute -top-6 right-0 text-xs text-blue-500 animate-pulse">Updating...</span>}
                    <select value={branch} onChange={(e) => setBranch(e.target.value)} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-100">
                        <option value="all">All Branches</option>
                        {branchBreakdown.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
                    </select>
                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-100">
                        <option value="30days">Last 30 Days</option>
                        <option value="7days">Last 7 Days</option>
                    </select>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{parseFloat(financials.totalRevenue).toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-500"><DollarSign size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Total Orders (Attempted)</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{overview.totalAttemptedOrders}</h3>
                        <p className="text-xs text-green-600 mt-1">Valid Financial: {overview.validFinancialOrders}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-500"><ShoppingBag size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Avg. Order Value</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{parseFloat(overview.avgOrderValue).toFixed(2)}</h3>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-xl text-orange-500"><TrendingUp size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Cancellation Rate</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{overview.cancellationRate}</h3>
                        <p className="text-xs text-red-500 mt-1">{overview.cancelledOrders} cancelled</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl text-red-500"><AlertTriangle size={24} /></div>
                </div>
            </div>

            {/* In-Depth Financial Breakdown */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Activity size={20} className="text-gray-800" />
                    <h4 className="text-md font-bold text-gray-800">Detailed Financial Breakdown</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                    <div className="p-4 border rounded-xl bg-gray-50"><p className="text-xs text-gray-500 mb-1">Total Subtotal</p><p className="font-bold">{financials.totalSubtotal}</p></div>
                    <div className="p-4 border rounded-xl bg-gray-50"><p className="text-xs text-gray-500 mb-1">Delivery Fees</p><p className="font-bold">{financials.totalDeliveryFees}</p></div>
                    <div className="p-4 border rounded-xl bg-gray-50"><p className="text-xs text-gray-500 mb-1">Service Fees</p><p className="font-bold">{financials.totalServiceFees}</p></div>
                    <div className="p-4 border rounded-xl bg-gray-50"><p className="text-xs text-gray-500 mb-1">App Commission</p><p className="font-bold text-red-500">{financials.totalAppCommission}</p></div>
                    <div className="p-4 border rounded-xl bg-green-50"><p className="text-xs text-green-700 mb-1">Net Revenue</p><p className="font-bold text-green-800">{financials.netRevenue}</p></div>
                    <div className="p-4 border rounded-xl bg-blue-50"><p className="text-xs text-blue-700 mb-1">Total Revenue</p><p className="font-bold text-blue-800">{financials.totalRevenue}</p></div>
                </div>
            </div>

            {/* Settlement & Wallet Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Settlement Statement</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="p-3 border rounded-lg"><span className="text-gray-500 block text-xs">Cash Collected By You:</span><span className="font-bold">{settlement.cashCollectedByYou}</span></div>
                        <div className="p-3 border rounded-lg"><span className="text-gray-500 block text-xs">Digital Collected By Platform:</span><span className="font-bold">{settlement.digitalCollectedByPlatform}</span></div>
                        <div className="p-3 border rounded-lg bg-red-50"><span className="text-red-600 block text-xs">You Owe Platform:</span><span className="font-bold text-red-700">{settlement.youOwePlatform}</span></div>
                        <div className="p-3 border rounded-lg bg-green-50"><span className="text-green-600 block text-xs">Platform Owes You:</span><span className="font-bold text-green-700">{settlement.platformOwesYou}</span></div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-800 text-white rounded-xl">
                        <div><p className="text-xs text-gray-300">Net Balance</p><p className="text-lg font-bold">{settlement.netBalance}</p></div>
                        <div className="text-right"><p className="text-xs text-gray-300">Status</p><p className="text-sm font-semibold capitalize">{settlement.status}</p></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Wallet size={20} className="text-gray-800" />
                        <h4 className="text-md font-bold text-gray-800">Wallet Summary</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 border rounded-xl"><p className="text-xs text-gray-500 mb-1">Total Earning</p><p className="font-bold text-green-600">{wallet.totalEarning}</p></div>
                        <div className="p-4 border rounded-xl"><p className="text-xs text-gray-500 mb-1">Collected Cash</p><p className="font-bold">{wallet.collectedCash}</p></div>
                        <div className="p-4 border rounded-xl"><p className="text-xs text-gray-500 mb-1">Pending Withdraw</p><p className="font-bold text-orange-500">{wallet.pendingWithdraw}</p></div>
                        <div className="p-4 border rounded-xl"><p className="text-xs text-gray-500 mb-1">Total Withdrawn</p><p className="font-bold text-gray-700">{wallet.totalWithdrawn}</p></div>
                        <div className="p-4 border rounded-xl col-span-2 md:col-span-1 bg-gray-50"><p className="text-xs text-gray-500 mb-1">Final Balance</p><p className={`font-bold ${parseFloat(wallet.balance) < 0 ? 'text-red-500' : 'text-gray-800'}`}>{wallet.balance}</p></div>
                    </div>
                </div>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Revenue & Daily Orders Trend</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" h="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip content={<CustomBarTooltip extraLabels={[{ label: 'Revenue (EGP)', key: 'revenue' }, { label: 'Orders Count', key: 'orders' }]} />} />
                                <Bar dataKey="revenue" fill="#1C1B2E" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Branch Performance Details</h4>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" h="100%">
                            <BarChart data={branchChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip content={<CustomBarTooltip extraLabels={[{ label: 'Revenue', key: 'revenue' }, { label: 'Total Orders', key: 'totalOrders' }, { label: 'Cancelled', key: 'cancelledOrders' }]} />} />
                                <Bar dataKey="revenue" fill="#F5A623" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Pie Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[{ title: "Orders by Source", data: sourceChartData }, { title: "Orders by Payment", data: paymentChartData }, { title: "Orders by Type", data: typeChartData }].map((chart, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h4 className="text-md font-bold text-gray-800 mb-4">{chart.title}</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" h="100%">
                                <PieChart>
                                    <Pie data={chart.data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="count">
                                        {chart.data.map((entry, i) => <Cell key={`cell-${i}`} fill={COLORS[(i + idx * 2) % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ))}
            </div>

            {/* Top Items & Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">All Top Selling Items</h4>
                    <div className="h-80 overflow-y-auto pr-2">
                        <ResponsiveContainer width="100%" height={topItemsData.length * 50}>
                            <BarChart data={topItemsData} layout="vertical" barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomBarTooltip extraLabels={[{ label: 'Revenue', key: 'revenue' }, { label: 'Quantity Sold', key: 'quantity' }]} />} />
                                <Bar dataKey="revenue" fill="#4A90E2" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-auto h-[380px]">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Complete Orders Status Breakdown</h4>
                    <div className="space-y-3">
                        {ordersByStatus.map((statusItem, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
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

            {/* Business Plans Fully Detailed Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCard size={20} className="text-gray-800" />
                    <h4 className="text-md font-bold text-gray-800">Full Business Plans & Subscriptions</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                        <thead className="bg-gray-100 text-gray-700 uppercase">
                            <tr>
                                <th className="p-3 border-b">Platform Type</th>
                                <th className="p-3 border-b">Commission Rate</th>
                                <th className="p-3 border-b">Service Fee</th>
                                <th className="p-3 border-b text-center border-l">Monthly (Active / Amt)</th>
                                <th className="p-3 border-b text-center border-l">Quarterly (Active / Amt)</th>
                                <th className="p-3 border-b text-center border-l">Annually (Active / Amt)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {businessPlans.map((plan, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-800">{formatLabel(plan.platformType) || 'Default/None'}</td>
                                    <td className="p-3">{plan.commissionRate}%</td>
                                    <td className="p-3">{plan.serviceFee}%</td>

                                    <td className="p-3 text-center border-l">
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${plan.isMonthlyActive ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                        {plan.monthlyAmount}
                                    </td>
                                    <td className="p-3 text-center border-l">
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${plan.isQuarterlyActive ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                        {plan.quarterlyAmount}
                                    </td>
                                    <td className="p-3 text-center border-l">
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${plan.isAnnuallyActive ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                        {plan.annuallyAmount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}