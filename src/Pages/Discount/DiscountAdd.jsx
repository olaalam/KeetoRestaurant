import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Trash2, Save, ArrowLeft, ImagePlus, X, ChevronDown, Check } from 'lucide-react'; 

const FoodMultiSelect = ({ foods, selectedIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleSelect = (foodId) => {
        const stringId = String(foodId);
        if (selectedIds.includes(stringId)) {
            onChange(selectedIds.filter(id => id !== stringId));
        } else {
            onChange([...selectedIds, stringId]);
        }
    };

    const selectedFoodNames = foods
        .filter(f => selectedIds.includes(String(f.id)))
        .map(f => f.name);

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white cursor-pointer flex items-center justify-between min-h-[46px] hover:border-primary transition-colors"
            >
                <div className="flex flex-wrap gap-1.5 items-center max-w-[90%] overflow-hidden">
                    {selectedFoodNames.length > 0 ? (
                        selectedFoodNames.map((name, idx) => (
                            <span key={idx} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md font-medium border border-primary/20">
                                {name}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 text-sm">Select foods...</span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-2">
                    {foods.length > 0 ? (
                        foods.map(food => {
                            const isChecked = selectedIds.includes(String(food.id));
                            return (
                                <div 
                                    key={food.id}
                                    onClick={() => handleToggleSelect(food.id)}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                        isChecked ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    <span className="text-sm">{food.name}</span>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                        isChecked ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'
                                    }`}>
                                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-3 text-center text-sm text-gray-400">No foods available</div>
                    )}
                </div>
            )}
        </div>
    );
};

const DiscountAdd = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('basic');
    const [imagePreview, setImagePreview] = useState(null);

    const [basicData, setBasicData] = useState({
        name: '', nameAr: '', nameFr: '',
        minOrderAmount: '', usageLimit: '',
        startDate: '', endDate: '', logo: null,
        isActive: true
    });

    const [variableData, setVariableData] = useState([
        { foodIds: [], discountType: 'percentage', discountValue: '', maxDiscount: '' }
    ]);

    const { data: selectData, isLoading: isSelectDataLoading } = useQuery({
        queryKey: ['branchemenu-select-data'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/branchemenu/select-data');
            return res.data?.data?.data || { branches: [], foods: [] };
        }
    });

    const { data: DiscountData, isLoading: isFetching } = useQuery({
        queryKey: ['Discount', id],
        queryFn: async () => {
            const { data } = await api.get(`/api/restaurant/discounts/${id}`);
            return data.data.data;
        },
        // enabled: !!id && !state?.DiscountData,
    });

    const initialData = state?.DiscountData || DiscountData;

useEffect(() => {
        if (initialData) {
            setBasicData({
                name: initialData.name || '',
                nameAr: initialData.nameAr || '',
                nameFr: initialData.nameFr || '',
                minOrderAmount: initialData.minOrderAmount || '',
                usageLimit: initialData.usageLimit || '',
                startDate: initialData.startDate?.split('T')[0] || '',
                endDate: initialData.endDate?.split('T')[0] || '',
                logo: initialData.logo || null,
                isActive: initialData.isActive ?? true
            });
            
            if (initialData.logo) {
                setImagePreview(initialData.logo);
            }

            // فحص تفاصيل المنتجات بناءً على هيكل الـ Response
// فحص تفاصيل المنتجات بناءً على هيكل الـ Response
const existingDetails = initialData.groups || initialData.foodGroups || initialData.discountDetails;            
            if (existingDetails && existingDetails.length > 0) {
                const formattedDetails = existingDetails.map(d => ({
                    ...d,
                    foodIds: (d.foodIds || []).map(String),
                    maxDiscount: d.maxDiscount || ''
                }));
                setVariableData(formattedDetails);
            } else if (initialData.foodIds) {
                // التعامل مع الـ Response الجديد المباشر (Flat Response)
                setVariableData([
                    {
                        foodIds: (initialData.foodIds || []).map(String),
                        discountType: initialData.discountType || 'percentage',
                        discountValue: initialData.discountValue || '',
                        maxDiscount: initialData.maxDiscount || ''
                    }
                ]);
            }
        }
    }, [initialData]);

    const handleAddVariableRow = () => {
        setVariableData([...variableData, { foodIds: [], discountType: 'percentage', discountValue: '', maxDiscount: '' }]);
    };

    const handleRemoveVariableRow = (index) => {
        const newData = [...variableData];
        newData.splice(index, 1);
        setVariableData(newData);
    };

    const handleVariableChange = (index, field, value) => {
        const newData = [...variableData];
        newData[index][field] = value;
        setVariableData(newData);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBasicData({ ...basicData, logo: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setBasicData({ ...basicData, logo: null });
        setImagePreview(null);
    };

const mutation = useMutation({
        mutationFn: async () => {
            const payload = {
                name: basicData.name,
                nameAr: basicData.nameAr,
                nameFr: basicData.nameFr,
                minOrderAmount: basicData.minOrderAmount ? Number(basicData.minOrderAmount) : 0,
                usageLimit: basicData.usageLimit ? Number(basicData.usageLimit) : 0, // تم تصحيح basicData.usageLimit هنا
                startDate: basicData.startDate ? new Date(basicData.startDate).toISOString() : null,
                endDate: basicData.endDate ? new Date(basicData.endDate).toISOString() : null,
                isActive: basicData.isActive,
                logo: basicData.logo ? imagePreview : null,
                foodGroups: variableData.map(group => {
                    const groupData = {
                        discountType: group.discountType,
                        discountValue: Number(group.discountValue),
                        foodIds: group.foodIds
                    };
                    
                    if (group.maxDiscount !== '' && group.maxDiscount !== null) {
                        groupData.maxDiscount = Number(group.maxDiscount);
                    }

                    return groupData;
                })
            };

            if (id) {
                return await api.put(`/api/restaurant/discounts/${id}`, payload);
            } else {
                return await api.post('/api/restaurant/discounts', payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['Discounts']);
            navigate(-1);
        }
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate();
    };

    if ((id && isFetching) || isSelectDataLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-4 md:p-8 w-full max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{id ? t('editDiscount') : t('addDiscount')}</h1>
                    <p className="text-gray-500 mt-1 text-sm">{t('manageYourDiscountDetails')}</p>
                </div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('back')}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 pt-6 pb-2 border-b border-gray-100">
                    <div className="flex space-x-2 rtl:space-x-reverse bg-gray-50 p-1 rounded-xl w-max border border-gray-200">
                        <button
                            type="button"
                            onClick={() => setActiveTab('basic')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'basic' 
                                ? 'bg-white text-primary shadow-sm border border-gray-200' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {t('offerInfo')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('variable')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'variable' 
                                ? 'bg-white text-primary shadow-sm border border-gray-200' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {t('DiscountedProducts')}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {activeTab === 'basic' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Banner (Logo)
                                </label>
                                <div className="relative group rounded-xl border-2 border-dashed border-gray-300 hover:border-primary transition-colors bg-gray-50 flex flex-col justify-center items-center h-64 overflow-hidden cursor-pointer">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Banner Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={removeImage} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors mr-2">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                                <label className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
                                                    <ImagePlus className="w-5 h-5" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                            <div className="p-4 bg-primary/10 rounded-full mb-3 text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                                                <ImagePlus className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Click to upload banner</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')} *</label>
                                    <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" value={basicData.name} onChange={e => setBasicData({...basicData, name: e.target.value})} placeholder="e.g. Ramadan Offer" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('nameAr')} *</label>
                                    <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" value={basicData.nameAr} onChange={e => setBasicData({...basicData, nameAr: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('nameFr')} *</label>
                                    <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" value={basicData.nameFr} onChange={e => setBasicData({...basicData, nameFr: e.target.value})} />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('minOrderAmount')}</label>
                                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" value={basicData.minOrderAmount} onChange={e => setBasicData({...basicData, minOrderAmount: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('usageLimit')}</label>
                                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" value={basicData.usageLimit} onChange={e => setBasicData({...basicData, usageLimit: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('startDate')} *</label>
                                    <input required type="date" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" value={basicData.startDate} onChange={e => setBasicData({...basicData, startDate: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('endDate')} *</label>
                                    <input required type="date" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" value={basicData.endDate} onChange={e => setBasicData({...basicData, endDate: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'variable' && (
                        <div className="space-y-6">
                            {variableData.map((row, index) => (
                                <div key={index} className="relative bg-white border border-gray-200 shadow-sm rounded-xl p-5 hover:border-primary/50 transition-colors group">
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                        <h3 className="text-sm font-bold text-gray-700 flex items-center">
                                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 rtl:ml-2 rtl:mr-0">
                                                {index + 1}
                                            </span>
                                            Product Configuration
                                        </h3>
                                        {variableData.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveVariableRow(index)}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                                        <div className="md:col-span-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('food')} *</label>
                                            <FoodMultiSelect 
                                                foods={selectData?.foods || []}
                                                selectedIds={row.foodIds}
                                                onChange={(newIds) => handleVariableChange(index, 'foodIds', newIds)}
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('discountType')} *</label>
                                            <select 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                                                value={row.discountType}
                                                onChange={(e) => handleVariableChange(index, 'discountType', e.target.value)}
                                            >
                                                <option value="percentage">{t('percentage')} (%)</option>
                                                <option value="fixed_amount">{t('fixedAmount')} (EGP)</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('discountValue')} *</label>
                                            <div className="relative">
                                                <input 
                                                    required 
                                                    type="number" 
                                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                                                    value={row.discountValue}
                                                    onChange={(e) => handleVariableChange(index, 'discountValue', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                <div className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto pr-3 rtl:pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 text-sm">
                                                        {row.discountType === 'percentage' ? '%' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('maxDiscount')}</label>
                                            <input 
                                                type="number" 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white" 
                                                value={row.maxDiscount} 
                                                onChange={e => handleVariableChange(index, 'maxDiscount', e.target.value)} 
                                                placeholder="e.g. 50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-center mt-6">
                                <button 
                                    type="button" 
                                    onClick={handleAddVariableRow}
                                    className="flex items-center px-5 py-2.5 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-all border border-primary/20"
                                >
                                    <Plus className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('add')} Product Rule
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 mt-10 pt-6 border-t border-gray-100">
                        <button 
                            type="button" 
                            onClick={() => navigate(-1)}
                            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            type="submit" 
                            disabled={mutation.isLoading}
                            className="flex items-center justify-center px-8 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:opacity-90 shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {mutation.isLoading ? (
                                <LoadingSpinner className="w-5 h-5" /> 
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> 
                                    {t('save')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DiscountAdd;