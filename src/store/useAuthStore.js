import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuth: false,
            schedules: [], // 1. إضافة حقل الجداول في الـ State الابتدائية

            // 2. تحديث دالة الحفظ لتستقبل وتخزن الـ schedules
            setLogin: (userData, token, schedules) => set({
                user: userData,
                token: token,
                isAuth: true,
                schedules: schedules || []
            }),

            // 3. تصفير الجداول عند تسجيل الخروج
            setLogout: () => set({
                user: null,
                token: null,
                isAuth: false,
                schedules: []
            }),
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;