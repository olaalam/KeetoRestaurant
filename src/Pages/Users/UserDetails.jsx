import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { 
  ArrowLeft, ArrowRight, Star, 
  ShoppingCart, CreditCard, Mail, Phone, User, CheckCircle2
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import LoadingSpinner from '@/components/LoadingSpinner';

const SOURCE_COLORS = [
  'hsl(var(--primary))',
  '#fde047',
  '#3b82f6',
  '#10b981',
];

export default function UserDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isRTL } = useTranslation();

    // جلب البيانات مباشرة من الـ Backend
    const { data: response, isLoading } = useGet(['user-stats', id], `/api/restaurant/restaurant-users/${id}/stats`);

    // استخراج الهيكل الداخلي للـ API
    const statsData = response?.data?.data;
    const user = statsData?.user;
    const stats = statsData?.stats;
    const orderSourceBreakdown = statsData?.orderSourceBreakdown || [];
    const topItems = statsData?.topItems || [];
    const recentOrders = statsData?.recentOrders || [];

    // حساب إجمالي مصدر الطلبات للرسم البياني الدائري
    const totalSourceOrders = orderSourceBreakdown.reduce((sum, item) => sum + item.count, 0);

    // إنتاج التدرج الدائري للـ Donut Chart حركياً
    let cumulativePercentage = 0;
    const gradientStops = orderSourceBreakdown.map((item, index) => {
        const pct = totalSourceOrders > 0 ? (item.count / totalSourceOrders) * 100 : 0;
        const start = cumulativePercentage;
        cumulativePercentage += pct;
        const color = SOURCE_COLORS[index % SOURCE_COLORS.length];
        return `${color} ${start}% ${cumulativePercentage}%`;
    }).join(', ');

    const dynamicConicGradient = gradientStops 
        ? `conic-gradient(${gradientStops})` 
        : 'conic-gradient(#e2e8f0 0% 100%)';

    // تنسيق مساعدة لتسمية المصادر
    const formatSourceLabel = (src) => {
        switch (src) {
            case 'online_order_web': return 'Web';
            case 'online_order_app': return 'Application';
            case 'food_aggregator': return 'Aggregator';
            default: return src;
        }
    };

    // تنسيق التواريخ
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner className="h-8 w-8 text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-8 text-center text-slate-500 font-medium">
                No user data found.
            </div>
        );
    }

    const maxUnits = Math.max(...topItems.map(item => Number(item.totalQuantity) || 0), 1);

    return (
        <div className="p-4 md:p-8 bg-[#FDFBF7] min-h-screen w-full font-sans text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors text-primary"
                    >
                        {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Customer Profile</h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span>📅</span>
                    <span>Joined: {formatDate(user.createdAt)}</span>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden border border-primary/20">
                        {user.photo ? (
                            <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <User size={32} strokeWidth={1.5} />
                        )}
                    </div>
                    <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold">{user.name}</h2>
                            {user.isVerified && (
                                <CheckCircle2 size={16} className="text-primary" />
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail size={14} className="text-slate-400" />
                            <span>{user.email || '-'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Phone size={14} className="text-slate-400" />
                            <span className="font-mono">{user.phone || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        user.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-rose-50 text-rose-600'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        {user.status === 'active' ? 'Active Customer' : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Star size={24} fill="currentColor" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Points</p>
                        <p className="text-xl font-bold">{stats?.points?.toLocaleString() ?? 0}</p>
                    </div>
                </div>
                
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                        <ShoppingCart size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Total Orders</p>
                        <p className="text-xl font-bold">{stats?.totalOrders ?? 0}</p>
                    </div>
                </div>
                
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <CreditCard size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Total Spendings</p>
                        <p className="text-xl font-bold">
                            {Number(stats?.totalSpendings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} EGP
                        </p>
                    </div>
                </div>
            </div>

            {/* Order Details Table */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 overflow-x-auto">
                <h3 className="text-base font-bold mb-4">Order Details</h3>
                <table className="w-full min-w-[600px] text-sm text-left">
                    <thead>
                        <tr className="text-xs font-bold text-slate-500 border-b border-slate-100">
                            <th className="pb-3 w-12 text-center">#</th>
                            <th className="pb-3">Order ID</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3 text-center">Source</th>
                            <th className="pb-3 text-center">Amount</th>
                            <th className="pb-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order, index) => (
                                <tr key={order.orderNumber || index} className="border-b border-dashed border-slate-200 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 text-center font-bold text-slate-700">{index + 1}</td>
                                    <td className="py-4 font-bold text-slate-700">{order.dailyOrderNumber}</td>
                                    <td className="py-4 font-medium text-slate-600">{formatDate(order.createdAt)}</td>
                                    <td className="py-4 text-center">
                                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-bold">
                                            {formatSourceLabel(order.orderSource)}
                                        </span>
                                    </td>
                                    <td className="py-4 text-center font-bold text-slate-700">{order.totalAmount} EGP</td>
                                    <td className="py-4 text-center">
                                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                                            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                                            order.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                            {order.status?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-6 text-center text-slate-400">No recent orders found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Orders by Source */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-base font-bold">Orders by Source</h3>
                    <p className="text-xs text-slate-500 mb-8 mt-1">Number of orders from each source</p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-8 px-2">
                        {/* Dynamic Donut Chart */}
                        <div 
                            className="relative w-32 h-32 rounded-full shrink-0 flex items-center justify-center transition-all"
                            style={{ background: dynamicConicGradient }}
                        >
                            <div className="w-20 h-20 bg-white rounded-full"></div>
                        </div>
                        
                        <div className="flex flex-col gap-3 w-full">
                            {orderSourceBreakdown.map((item, idx) => {
                                const percentage = totalSourceOrders > 0 
                                    ? ((item.count / totalSourceOrders) * 100).toFixed(1) 
                                    : 0;
                                const color = SOURCE_COLORS[idx % SOURCE_COLORS.length];

                                return (
                                    <div key={item.source} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
                                            <span className="font-bold text-slate-700">{formatSourceLabel(item.source)}</span>
                                        </div>
                                        <span className="text-slate-500 text-xs">{item.count} orders</span>
                                        <span className="font-bold">{percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Top 5 Purchased Products */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-base font-bold">Top 5 Purchased Products</h3>
                    <p className="text-xs text-slate-500 mb-6 mt-1">Units sold per product</p>
                    
                    {/* Dynamic Bar Chart */}
                    <div className="flex items-end justify-between gap-2 mt-auto h-40">
                        {topItems.length > 0 ? (
                            topItems.slice(0, 5).map((product, i) => {
                                const units = Number(product.totalQuantity) || 0;
                                const heightPercentage = (units / maxUnits) * 100;

                                return (
                                    <div key={product.foodId || i} className="flex flex-col items-center gap-2 flex-1 group">
                                        <span className="font-bold text-slate-700 text-sm">{units}</span>
                                        <div
                                            className="w-full max-w-[32px] rounded-t-sm transition-all bg-primary hover:opacity-80"
                                            style={{ 
                                                height: `${heightPercentage}%`, 
                                                minHeight: '6px',
                                                opacity: 1 - (i * 0.15)
                                            }}
                                        ></div>
                                        <span className="text-[10px] text-slate-500 text-center font-medium leading-tight h-8 max-w-[65px] line-clamp-2" title={isRTL && product.nameAr ? product.nameAr : product.name}>
                                            {(isRTL && product.nameAr) ? product.nameAr : product.name}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full text-center text-slate-400 my-auto text-sm">
                                No items data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}