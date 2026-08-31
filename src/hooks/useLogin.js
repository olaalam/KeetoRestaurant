import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'sonner';

// في ملف useLogin.js
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
            const schedules = res.data?.schedules; // 👈 استخراج الجداول من الاستجابة

            if (userData && token) {
                setLogin(userData, token, schedules); // 👈 تمريرها لدالة الحفظ
                toast.success(`Welcome ${userData.name}`);
            } else {
                toast.error('Unexpected response format');
            }
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