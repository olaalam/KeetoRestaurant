import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Calendar, FileText } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function VideoDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, isRTL } = useTranslation();

    // جلب تفاصيل الفيديو باستخدام الـ ID
    const { data, isLoading, isError } = useGet(['video-details', id], `/api/restaurant/videos/${id}`);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner className="h-8 w-8 text-primary" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="p-6 text-center text-rose-500 font-semibold">
                {t('errorLoadingVideo', { defaultValue: 'Failed to load video details.' })}
            </div>
        );
    }

    // استخراج بيانات الفيديو بناءً على هيكل الـ Response (data.data.data)
    const video = data?.data?.data || {};

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* زر العودة */}
            <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="gap-2 rounded-xl"
            >
                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                <span>{t('back', { defaultValue: 'Back' })}</span>
            </Button>

            {/* بطاقة تفاصيل الفيديو */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl">
                            <Video className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                {isRTL ? (video.titleAr || video.title) : (video.title || video.titleAr)}
                            </h1>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {video.createdAt ? new Date(video.createdAt).toLocaleString() : '-'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                            video.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}>
                            {video.status || 'active'}
                        </span>
                    </div>
                </div>

                {/* تشغيل الفيديو مع استخدام الصورة المصغرة (Thumbnail) كـ Poster */}
                {video.videoUrl && (
                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                        <video
                            src={video.videoUrl}
                            poster={video.thumbnailUrl}
                            controls
                            className="w-full h-full object-contain"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}

                {/* الوصف بالعربية والإنجليزية */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {t('description', { defaultValue: 'Description' })}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                        {isRTL ? (video.descriptionAr || video.description) : (video.description || video.descriptionAr) || '-'}
                    </p>
                </div>
            </div>
        </div>
    );
}