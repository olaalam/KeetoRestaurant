import React, { useState } from 'react';
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useGet } from "@/hooks/useGet"; // استخدام الـ hook الموجود عندك

export default function ReasonDialog({ isOpen, onClose, onConfirm, title }) {
    const { t } = useTranslation();
    const [selectedReasonId, setSelectedReasonId] = useState("");
    
    // جلب الأسباب
    const { data: reasonsResponse, isLoading } = useGet("order-reasons", "/api/restaurant/order/reasons");
    const reasons = reasonsResponse?.data?.data || [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <label className="text-sm font-medium mb-2 block">{t("selectReason")}</label>
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">{t("loading")}...</div>
                    ) : (
                        <Select onValueChange={setSelectedReasonId} value={selectedReasonId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t("chooseReason")} />
                            </SelectTrigger>
                            <SelectContent>
                                {reasons.map((reason) => (
                                    <SelectItem key={reason.id} value={reason.id}>
                                        {reason.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
                    <Button 
                        onClick={() => onConfirm(selectedReasonId)} 
                        disabled={!selectedReasonId}
                    >
                        {t("confirm")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}