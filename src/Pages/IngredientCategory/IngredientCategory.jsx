import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import GenericDataTable from '@/components/GenericDataTable';
import { useNavigate } from 'react-router-dom';

export default function IngredientCategory() {
    const navigate = useNavigate();

    const { data: ingredientCategories = [], isLoading } = useQuery({
        queryKey: ['ingredient-category'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/ingredientcategory');
            return res.data.data.data; // بناءً على هيكل الـ Response الخاص بكِ
        }
    });



    const columns = [
        { accessorKey: 'name', header: 'name' },
        { accessorKey: 'nameAr', header: 'nameAr' },
        { accessorKey: 'nameFr', header: 'nameFr' },


        {
            accessorKey: 'status',
            header: 'status',
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${row.original.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.original.status}
                </span>
            )
        },
    ];

    return (
        <div className="container mx-auto py-10">
            <GenericDataTable
                title="Ingredient Category"
                columns={columns}
                data={ingredientCategories}
                isLoading={isLoading}
                queryKey="ingredient-category"
                deleteApiUrl="/api/restaurant/ingredientcategory"
                onAdd={() => navigate("/ingredient-category/add")}
                onEdit={(city) => navigate(`/ingredient-category/edit/${city.id}`)}
            />
        </div>
    );
}