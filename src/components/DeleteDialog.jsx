import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDelete } from "@/hooks/useDelete";
import { useTranslation } from "@/hooks/useTranslation";

const DeleteDialog = ({
    isOpen,
    onClose,
    apiUrl,
    onSuccessKey,
    id,
}) => {
    const deleteMutation = useDelete(apiUrl, onSuccessKey);
    const { t } = useTranslation();

    const handleConfirm = () => {
        // لو الـ id عبارة عن "single" أو null، نمرر undefined حتى لا يتم إضافته للرابط
        const actualId = (id === "single" || id === null) ? undefined : id;

        deleteMutation.mutate(actualId, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("deleteWarning")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteMutation.isPending}>
                        {t("cancelBtn")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? t("deletingBtn") : t("confirmDelete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteDialog;