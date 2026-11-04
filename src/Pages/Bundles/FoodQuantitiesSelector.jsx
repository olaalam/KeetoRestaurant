import React from 'react';

const FoodQuantitiesSelector = ({ foods, value = [], onChange }) => {
    // value عبارة عن مصفوفة تحتوي على: [{ foodId, quantity }]

    const handleToggleFood = (foodId) => {
        const existingIndex = value.findIndex(item => item.foodId === foodId);
        if (existingIndex > -1) {
            // إذا كان الـ Food محدد مسبقاً وسحبنا الاختيار، نحذفه
            const updated = value.filter(item => item.foodId !== foodId);
            onChange(updated);
        } else {
            // إضافة عنصر جديد بـ quantity = 1 افتراضياً
            onChange([...value, { foodId, quantity: 1, variations: [] }]);
        }
    };

    const handleQuantityChange = (foodId, delta) => {
        const updated = value.map(item => {
            if (item.foodId === foodId) {
                const newQty = Math.max(1, (item.quantity || 1) + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        });
        onChange(updated);
    };

    return (
        <div className="border rounded-md p-3 space-y-2 bg-white max-h-60 overflow-y-auto">
            {foods?.map((food) => {
                const foodIdStr = String(food.id);
                const selectedItem = value.find(item => String(item.foodId) === foodIdStr);
                const isSelected = !!selectedItem;

                return (
                    <div key={food.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 border-b last:border-b-0">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleFood(foodIdStr)}
                                className="rounded border-gray-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                            />
                            {food.name || food.nameAr || food.title}
                        </label>

                        {/* العداد الكاونتر يظهر فقط عند تحديد العنصر */}
                        {isSelected && (
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange(foodIdStr, -1)}
                                    className="w-6 h-6 flex items-center justify-center bg-white rounded text-gray-700 hover:bg-gray-200 border font-bold text-xs"
                                >
                                    -
                                </button>
                                <span className="w-6 text-center font-semibold text-sm">
                                    {selectedItem.quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleQuantityChange(foodIdStr, 1)}
                                    className="w-6 h-6 flex items-center justify-center bg-white rounded text-gray-700 hover:bg-gray-200 border font-bold text-xs"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default FoodQuantitiesSelector;