// useGet.js
import api from '@/api/axios';
import { useQuery } from '@tanstack/react-query';

export const useGet = (key, url, params = {}, options = {}) => {
    return useQuery({
        queryKey: Array.isArray(key) ? [...key, params] : [key, params],
        queryFn: async () => {
            if (!url) return null;
            const { data } = await api.get(url, { params });
            return data;
        },
        enabled: !!url && (options.enabled ?? true),
        ...options,
    });
};