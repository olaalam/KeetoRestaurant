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
    Cell,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Star, Filter, Calendar as CalendarIcon, User } from 'lucide-react';
import { useGet } from '@/hooks/useGet';
import { useTranslation } from '@/hooks/useTranslation';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ألوان مطابقة لتصميم Figma
const BRAND_YELLOW = '#F5A623';
const BRAND_NAVY = '#1C1B2E';
const COLORS = [BRAND_YELLOW, BRAND_NAVY, '#E2574C', '#4A90E2', '#2CA01C', '#8E44AD'];

export default function Dashboard() {
    const { t, isRTL } = useTranslation();
    const [branch, setBranch] = useState('all');
    const [dateRange, setDateRange] = useState('30days');
    
    // حالات النطاق المخصص للتاريخ
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [isCustomOpen, setIsCustomOpen] = useState(false);

    // جلب البيانات بناءً على التاريخ المخصص أو الجاهز
    const queryParams = {
        branch,
        ...(dateRange === 'custom' 
            ? { startDate: customStartDate, endDate: customEndDate }
            : { dateRange })
    };

    const { data: response, isLoading, isError } = useGet(
        ['restaurantReport', branch, dateRange, customStartDate, customEndDate],
        '/api/restaurant/report/dashboard',
        queryParams
    );

    const isInitialLoading = isLoading && !response;

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#F8FAFC]" dir={isRTL ? "rtl" : "ltr"}>
                <p className="text-lg font-semibold text-gray-600 animate-pulse">{t("loadingDashboard")}</p>
            </div>
        );
    }

    if (isError || !response?.success) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#F8FAFC]" dir={isRTL ? "rtl" : "ltr"}>
                <p className="text-lg font-semibold text-red-500">{t("errorLoadingDashboard")}</p>
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
        discountEffectiveness = [],
        branchesNetSales = [],
        appVsWebsite = [],
        rating = "0.00",
        geographicMap = [],
        marketBasket = [],
        couponAnalysis = []
    } = reportData;

    // Tooltip مخصص للمخططات
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl text-sm" dir={isRTL ? "rtl" : "ltr"}>
                    <p className="font-bold text-gray-800 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color || BRAND_NAVY }} className="font-medium">
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // معالجة البيانات للأرقام
    const peakDaysData = peakDays.map(d => ({ ...d, revenue: parseFloat(d.revenue || 0) }));
    const branchesData = branchesNetSales.map(b => ({ ...b, netSales: parseFloat(b.netSales || 0) }));
    const topProductsData = topProducts.map(p => ({ ...p, revenue: parseFloat(p.revenue || 0) }));
    const discountData = discountEffectiveness.map(d => ({
        discountPercent: parseFloat(d.discountPercent || 0),
        revenue: parseFloat(d.revenue || 0),
        bubbleSize: parseFloat(d.bubbleSize || 0)
    }));
    const couponData = couponAnalysis.map(c => ({
        ...c,
        revenueBeforeDiscount: parseFloat(c.revenueBeforeDiscount || 0),
        revenueAfterDiscount: parseFloat(c.revenueAfterDiscount || 0)
    }));
    const marketBasketData = marketBasket.map(m => ({
        ...m,
        confidencePercent: parseFloat(m.confidencePercent || 0)
    }));
    const filteredAppVsWebsite = appVsWebsite.filter(
        item => item.platform && item.platform.toLowerCase() !== 'unknown'
    );
    const filteredGeoData = geographicMap
        .filter(g => g.zone && g.zone.toLowerCase() !== 'unknown zone' && g.zone.toLowerCase() !== 'unknown')
        .map((g, index) => ({ 
            ...g, 
            revenue: parseFloat(g.revenue || 0),
            index: index 
        }));

    // دالة إغلاق النافذة المنبثقة وتطبيق التاريخ
    const handleApplyCustomRange = () => {
        if (customStartDate && customEndDate) {
            setDateRange('custom');
            setIsCustomOpen(false); // إغلاق الـ Dialog تلقائياً
        }
    };

    return (
        <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen text-gray-800" dir={isRTL ? "rtl" : "ltr"}>
            
            {/* عنوان الصفحة والفلاتر */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{t("Analytics Dashboard")}</h1>
                    <p className="text-xs md:text-sm text-gray-500">{t("Sales & Order Performance Overview")}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
                    <div className="flex items-center px-2 text-gray-400">
                        <Filter size={18} className={isRTL ? "ml-2" : "mr-2"} />
                        <span className="text-sm font-medium">{t("Filters")}</span>
                    </div>
                    <select 
                        value={branch} 
                        onChange={(e) => setBranch(e.target.value)} 
                        className="p-2 bg-gray-50 border-none rounded-lg text-xs md:text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-yellow-400 flex-1 sm:flex-none"
                    >
                        <option value="all">{t("All Branches")}</option>
                        {branchesNetSales.map((b, idx) => <option key={idx} value={b.branch}>{b.branch}</option>)}
                    </select>
                    
                    <select 
                        value={dateRange} 
                        onChange={(e) => {
                            setDateRange(e.target.value);
                            if (e.target.value !== 'custom') {
                                setCustomStartDate('');
                                setCustomEndDate('');
                            }
                        }} 
                        className="p-2 bg-gray-50 border-none rounded-lg text-xs md:text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-yellow-400 flex-1 sm:flex-none"
                    >
                        <option value="30days">{t("Last 30 Days")}</option>
                        <option value="7days">{t("Last 7 Days")}</option>
                        {dateRange === 'custom' && <option value="custom">{t("Custom Range")}</option>}
                    </select>

                    {/* نافذة اختيار الفترة المخصصة Custom Range */}
                    <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
                        <PopoverTrigger asChild>
                            <button className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors w-full sm:w-auto">
                                <CalendarIcon size={16} />
                                <span className="truncate">
                                    {dateRange === 'custom' && customStartDate && customEndDate
                                        ? `${customStartDate} - ${customEndDate}`
                                        : t("Custom Range")}
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 sm:w-80 p-4 bg-white rounded-2xl shadow-xl border border-slate-100" align="end">
                            <div className="space-y-4">
                                <h4 className="font-bold text-sm text-slate-800">{t("Select Custom Range") || "حدد الفترة الزمنية"}</h4>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">{t("From") || "من"}:</label>
                                    <Input 
                                        type="date" 
                                        value={customStartDate} 
                                        onChange={(e) => setCustomStartDate(e.target.value)} 
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">{t("To") || "إلى"}:</label>
                                    <Input 
                                        type="date" 
                                        value={customEndDate} 
                                        onChange={(e) => setCustomEndDate(e.target.value)} 
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setIsCustomOpen(false)}
                                        className="rounded-xl h-8 text-xs"
                                    >
                                        {t("Cancel") || "إلغاء"}
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        onClick={handleApplyCustomRange}
                                        disabled={!customStartDate || !customEndDate}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl h-8 text-xs"
                                    >
                                        {t("Apply") || "تطبيق"}
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* البطاقات العلوية المتجاوبة (Responsive Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                
                {/* كارت Total Revenue */}
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-3.5 min-w-0">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/40 rounded-xl text-yellow-500 shrink-0">
                        <DollarSign size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm text-gray-500 font-medium truncate mb-0.5">{t("Total Revenue")}</p>
                        <h3 className="text-xl md:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
                            {parseFloat(cards.totalRevenue || 0).toLocaleString()} <span className="text-xs md:text-sm font-semibold">EGP</span>
                        </h3>
                    </div>
                </div>

                {/* كارت Total Orders */}
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-3.5 min-w-0">
                    <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-xl text-gray-600 dark:text-gray-300 shrink-0">
                        <ShoppingCart size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm text-gray-500 font-medium truncate mb-0.5">{t("Total Orders")}</p>
                        <h3 className="text-xl md:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
                            {cards.numberOfOrders || 0}
                        </h3>
                    </div>
                </div>

                {/* كارت Avg. Order Value */}
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-3.5 min-w-0">
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/40 rounded-xl text-orange-500 shrink-0">
                        <TrendingUp size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm text-gray-500 font-medium truncate mb-0.5">{t("Avg. Order Value")}</p>
                        <h3 className="text-xl md:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
                            {parseFloat(cards.averageOrderValue || 0).toFixed(2)} <span className="text-xs md:text-sm font-semibold">EGP</span>
                        </h3>
                    </div>
                </div>

                {/* كارت Total Users */}
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-3.5 min-w-0">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-500 shrink-0">
                        <User size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm text-gray-500 font-medium truncate mb-0.5">{t("Total Users")}</p>
                        <h3 className="text-xl md:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
                            {cards.totalUsers || 0}
                        </h3>
                    </div>
                </div>

            </div>

            {/* صفحة المخططات الرئيسية - عمودين */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                
                {/* 1. Peak Hours */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 overflow-hidden">
                    <h4 className="text-base font-semibold text-gray-800 mb-6">{t("Peak Hours Analysis")}</h4>
                    <div className="w-full h-72" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-5} orientation={isRTL ? "right" : "left"} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                                <Bar dataKey="orders" fill={BRAND_YELLOW} radius={[4, 4, 0, 0]} barSize={20} name={t("Orders")} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Peak Days */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 overflow-hidden">
                    <h4 className="text-base font-semibold text-gray-800 mb-6">{t("Peak Days Analysis")}</h4>
                    <div className="w-full h-72" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <BarChart data={peakDaysData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-5} orientation={isRTL ? "right" : "left"} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                                <Bar dataKey="revenue" fill={BRAND_NAVY} radius={[4, 4, 0, 0]} barSize={24} name={t("Revenue")} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Top Products */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 overflow-hidden">
                    <h4 className="text-base font-semibold text-gray-800 mb-6">{t("Top Products by Revenue")}</h4>
                    <div className="w-full h-72" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <BarChart data={topProductsData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                <YAxis dataKey="productName" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#334155' }} width={95} orientation={isRTL ? "right" : "left"} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                                <Bar dataKey="revenue" fill={BRAND_YELLOW} radius={[0, 4, 4, 0]} barSize={16} name={t("Revenue")} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Cancellations (Pie) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 overflow-hidden">
                    <h4 className="text-base font-semibold text-gray-800 mb-6">{t("Cancellation Analysis")}</h4>
                    <div className="w-full h-72" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <PieChart>
                                <Pie data={cancellations} cx="50%" cy="45%" outerRadius={75} dataKey="orders" nameKey="type">
                                    {cancellations.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? BRAND_YELLOW : BRAND_NAVY} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Discount Effectiveness (Scatter) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 overflow-hidden">
                    <h4 className="text-base font-semibold text-gray-800 mb-6">{t("Discount Effectiveness (Scatter)")}</h4>
                    <div className="w-full h-72" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="discountPercent" type="number" name="Discount %" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                <YAxis dataKey="revenue" type="number" name="Revenue" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} orientation={isRTL ? "right" : "left"} />
                                <ZAxis dataKey="bubbleSize" type="number" range={[60, 400]} name="Volume" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                <Scatter data={discountData} fill={BRAND_YELLOW} opacity={0.8} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6. Branches by Net Sales (Donut) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 overflow-hidden">
                    <h4 className="text-base font-semibold text-gray-800 mb-6">{t("Branches by Net Sales (Donut)")}</h4>
                    <div className="w-full h-72" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <PieChart>
                                <Pie data={branchesData} cx="50%" cy="45%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="netSales" nameKey="branch">
                                    {branchesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 7. Order Source */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 overflow-hidden">
                    <h4 className="text-base font-semibold text-gray-800 mb-6">{t("Order Source")}</h4>
                    <div className="w-full h-72" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <PieChart>
                                <Pie 
                                    data={filteredAppVsWebsite} 
                                    cx="50%" 
                                    cy="45%" 
                                    outerRadius={75} 
                                    dataKey="orders" 
                                    nameKey="platform"
                                >
                                    {filteredAppVsWebsite.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? BRAND_YELLOW : BRAND_NAVY} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 8. Customer Ratings */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center w-full min-w-0">
                    <h4 className="text-base font-semibold text-gray-800 mb-6 self-start w-full">{t("Customer Ratings")}</h4>
                    <div className="flex flex-col items-center justify-center flex-1">
                        <h2 className="text-5xl md:text-6xl font-bold text-yellow-500 mb-2">{rating} <span className="text-xl md:text-2xl text-gray-400">/ 5</span></h2>
                        <div className="flex gap-1 mb-2 text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} fill={i < Math.floor(rating) ? "currentColor" : "none"} strokeWidth={1.5} size={28} />
                            ))}
                        </div>
                        <p className="text-gray-500 text-xs md:text-sm mt-2 text-center">{t("Overall Rating Based on Recent Feedback")}</p>
                    </div>
                </div>

            </div>

            {/* المخططات العريضة (Full Width) */}
            <div className="grid grid-cols-1 gap-6 mb-8">
                
                {/* 9. Geographic Revenue Map */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 overflow-hidden">
                    <h4 className="text-base font-semibold text-gray-800 mb-6">{t("Geographic Revenue Map — Zones by Revenue")}</h4>
                    <div className="w-full h-[400px]" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                <XAxis dataKey="zone" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                <YAxis dataKey="revenue" type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} orientation={isRTL ? "right" : "left"} />
                                <ZAxis dataKey="revenue" type="number" range={[500, 3000]} name="Revenue" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                <Scatter data={filteredGeoData} fill={BRAND_YELLOW} opacity={0.8} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 10. Market Basket Analysis */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 overflow-hidden">
                    <h4 className="text-base font-semibold text-gray-800 mb-6">{t("Market Basket Analysis — Top Recommended Combos")}</h4>
                    <div className="w-full h-80" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <BarChart data={marketBasketData} layout="vertical" margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis 
                                    type="number" 
                                    domain={[0, 100]} 
                                    ticks={[0, 25, 50, 75, 100]} 
                                    interval={0}
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fill: '#64748B' }} 
                                    tickFormatter={(val) => `${val}%`} 
                                />
                                <YAxis 
                                    dataKey="comboName" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fill: '#334155' }} 
                                    width={85} 
                                    orientation={isRTL ? "right" : "left"} 
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                                <Bar dataKey="confidencePercent" fill={BRAND_YELLOW} radius={[0, 4, 4, 0]} barSize={16} name={t("Confidence %")} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 11. Revenue Before & After Coupon */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 overflow-hidden">
                    <h4 className="text-base font-semibold text-gray-800 mb-6">{t("Revenue Before & After Coupon")}</h4>
                    <div className="w-full h-96" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                            <BarChart data={couponData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="couponName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dx={-5} orientation={isRTL ? "right" : "left"} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                <Bar dataKey="revenueBeforeDiscount" fill={BRAND_NAVY} radius={[4, 4, 0, 0]} barSize={18} name={t("Revenue Before Discount")} />
                                <Bar dataKey="revenueAfterDiscount" fill={BRAND_YELLOW} radius={[4, 4, 0, 0]} barSize={18} name={t("Revenue After Discount")} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}