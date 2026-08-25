import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { toast } from 'sonner';

export const useDelete = (url, onSuccessKey) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            // التحقق: لو الـ id موجود ومحدد، ادمجه مع الرابط. وإلا استخدم الرابط الأساسي فقط.
            const endpoint = id ? `${url}/${id}` : url;
            const { data } = await api.delete(endpoint);
            return data;
        },
        onSuccess: () => {
            if (onSuccessKey) {
                queryClient.invalidateQueries({ queryKey: [onSuccessKey] });
            }
            toast.success("success");
        },
        onError: (error) => {
            const serverErrorMessage = 
                error?.response?.data?.error?.message ||  
                error?.response?.data?.message ||         
                error?.message ||                          
                'Invalid Credentials';                     

            toast.error(serverErrorMessage);
        },
    });
};