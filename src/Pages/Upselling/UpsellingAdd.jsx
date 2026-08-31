import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useGet } from '@/hooks/useGet';
import { useTranslation } from '@/hooks/useTranslation';

const UpsellingAdd = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: foodsResponse, isLoading } = useGet(
        'foods-select',
        '/api/restaurant/recommended-foods/foods-select'
    );

    const foodOptions = useMemo(() => {
        const foodsArray = foodsResponse?.data?.data;

        if (!Array.isArray(foodsArray)) return [];

        return foodsArray.map(food => ({
            label: food.name || food.nameAr || t('noResultsFound'),
            value: food.id
        }));
    }, [foodsResponse]);

    const fields = [
        {
            name: 'foodId',
            label: t('mainFoodItem'),
            type: 'combobox',
            required: true,
            options: foodOptions,
        },
        {
            name: 'recommendedFoodIds',
            label: t('recommendedProducts'),
            type: 'multi-select',
            required: true,
            options: foodOptions,
        }
    ];

    if (isLoading) return <div className="p-4 text-center">{t('loadingProducts')}</div>;

    return (
        <div className="p-6">
            <AddPage
                title={t('upsellingProducts')}
                apiUrl="/api/restaurant/recommended-foods/assign"
                queryKey="recommended-foods"
                method="POST"
                fields={fields}
                onSuccessAction={() => navigate('/upselling')}
            />
        </div>
    );
};

export default UpsellingAdd;