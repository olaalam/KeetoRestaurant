import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'sonner';

export const useLogin = () => {
    const setLogin = useAuthStore((state) => state.setLogin);

    return useMutation({
        mutationFn: async (credentials) => {
            const { data } = await api.post('/api/restaurant/auth/login', credentials);
            return data;
        },
        onSuccess: (res) => {
            const userData = res.data?.admin;
            const token = res.data?.token;

            if (userData && token) {
                setLogin(userData, token);
                toast.success(`Welcome ${userData.name}`);
            } else {
                toast.error('Unexpected response format');
            }
        },
        onError: (error) => {

            // 💡 استخراج رسالة الخطأ بناءً على الهيكل الراجع من الـ API الخاص بكِ
            const serverErrorMessage = 
                error?.response?.data?.error?.message ||  // للتعامل مع { error: { message: "..." } }
                error?.response?.data?.message ||         // للتعامل مع { message: "..." }
                error?.message ||                          // رسالة Axios الافتراضية (مثل Network Error)
                'Invalid Credentials';                     // رسالة احتياطية عامة

            // عرض رسالة الخطأ للمستخدم عبر الـ Toast
            toast.error(serverErrorMessage);
        },
    });
};