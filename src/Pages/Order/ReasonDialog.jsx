import React, { useState, useEffect } from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useGet } from "@/hooks/useGet";
import { AlertCircle, MessageSquareText, PenTool } from "lucide-react";

export default function ReasonDialog({ isOpen, onClose, onConfirm, title }) {
    const { t } = useTranslation();
    const [selectedReasonId, setSelectedReasonId] = useState("");
    const [customReason, setCustomReason] = useState("");

    const { data: reasonsResponse, isLoading } = useGet("order-reasons", "/api/restaurant/order/reasons");
    const reasons = reasonsResponse?.data?.data || [];

    // تصفير القيم عند إغلاق الديالوج
    useEffect(() => {
        if (!isOpen) {
            setSelectedReasonId("");
            setCustomReason("");
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (selectedReasonId === "others") {
            onConfirm({ customReason: customReason.trim() });
        } else {
            onConfirm({ cancelReasonId: selectedReasonId });
        }
    };

    const isOthers = selectedReasonId === "others";
    // التحقق من صحة المدخلات (لو اختار أخرى لازم يكتب 3 حروف على الأقل)
    const isValid = !isOthers || customReason.trim().length >= 3;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-2xl bg-white shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-3 space-y-4">
                    {/* حقل اختيار السبب */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                            {t("selectReason") || "سبب الإلغاء / الرفض"}
                        </label>
                        {isLoading ? (
                            <div className="text-sm text-muted-foreground p-2">{t("loading")}...</div>
                        ) : (
                            <Select onValueChange={setSelectedReasonId} value={selectedReasonId}>
                                <SelectTrigger className="w-full h-11 rounded-xl border-gray-300">
                                    <SelectValue placeholder={t("chooseReason") || "اختر السبب من القائمة..."} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {reasons.map((reason) => (
                                        <SelectItem key={reason.id} value={reason.id.toString()}>
                                            {reason.name}
                                        </SelectItem>
                                    ))}

                                    {/* فاصل بصري ليجعل خيار "أخرى" بارزاً ومفصولاً */}
                                    <SelectSeparator className="my-1 bg-gray-200" />

                                    {/* خيار أخرى بشكل مميز */}
                                    <SelectItem
                                        value="others"
                                        className="font-bold text-amber-700 bg-amber-50/50 focus:bg-amber-100 focus:text-amber-800 my-0.5 rounded-lg cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <PenTool className="w-4 h-4 text-amber-600" />
                                            <span>{t("others") || "سبب آخر (أخرى - Others)"}</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* كارت كتابة السبب المخصص بشكل واضح جداً */}
                    {isOthers && (
                        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                                <span className="flex items-center gap-1.5">
                                    <MessageSquareText className="w-4 h-4 text-amber-600" />
                                    {t("typeCustomReason") || "توضيح السبب المخصص:"}
                                </span>
                                <span className="text-[11px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                                    مطلوب
                                </span>
                            </div>

                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                rows={3}
                                autoFocus
                                className="w-full p-3 text-sm bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all resize-none shadow-2xs placeholder:text-gray-400 font-medium"
                                placeholder={t("typeReasonHere") || "اكتب تفاصيل سبب الإلغاء هنا..."}
                            />

                            {/* تنبيه بسيط لو النص قصير */}
                            {customReason.length > 0 && customReason.trim().length < 3 && (
                                <p className="text-xs text-primary font-medium">
                                    يرجى كتابة سبب واضح (3 حروف على الأقل).
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                    <Button variant="outline" className="rounded-xl" onClick={onClose}>
                        {t("cancel") || "إلغاء"}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="rounded-xl bg-primary hover:bg-primary/80 text-white font-semibold px-5"
                        disabled={!selectedReasonId || !isValid}
                    >
                        {t("confirm") || "تأكيد"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}