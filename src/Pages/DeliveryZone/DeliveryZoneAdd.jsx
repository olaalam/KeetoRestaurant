import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from "@/hooks/useTranslation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import InteractiveZoneMap from './InteractiveZoneMap';

const DeliveryZoneAdd = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const isEdit = Boolean(id);

    const isAr = useMemo(() => {
        try {
            const keetoLang = localStorage.getItem('keeto-language');
            if (keetoLang) {
                const parsed = JSON.parse(keetoLang);
                return parsed?.state?.language === 'ar';
            }
        } catch (e) {
            console.error("Language parse error", e);
        }
        return false;
    }, []);

    // الحالات
    const [selectedCityId, setSelectedCityId] = useState('');
    const [selectedZoneId, setSelectedZoneId] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState(''); // 💡 حالة الفرع الجديد
    const [coverageType, setCoverageType] = useState('RADIUS'); 
    const [deliveryFee, setDeliveryFee] = useState('0.00');
    const [minOrderAmount, setMinOrderAmount] = useState('0.00');
    const [customRadiusKm, setCustomRadiusKm] = useState('5.00');
    const [coordinates, setCoordinates] = useState([]);
    
    const [dataLoaded, setDataLoaded] = useState(false);

    // 1️⃣ جلب قائمة الخيارات (تضمنت الفروع branches)
    const { data: selectionData = { zones: [], cities: [], branches: [] }, isLoading: isLoadingZones } = useQuery({
        queryKey: ['DeliveryZonesSelect'],
        queryFn: async () => {
            const res = await api.get('/api/restaurant/restaurant-zone-delivery-fees/select');
            const responseData = res.data?.data?.data || res.data?.data || {};
            return {
                zones: responseData.zonesselect || [],
                cities: responseData.citiesselect || [],
                branches: responseData.branchesselect || responseData.branches || [] // 💡 جلب الفروع
            };
        }
    });

    // 2️⃣ جلب بيانات العنصر للتعديل
    const { data: fetchedItemData, isLoading: isLoadingItem } = useQuery({
        queryKey: ['DeliveryZoneSingle', id],
        queryFn: async () => {
            const res = await api.get(`/api/restaurant/restaurant-zone-delivery-fees/${id}`);
            return res.data?.data?.data || res.data?.data || res.data;
        },
        enabled: isEdit,
    });

    const editData = fetchedItemData || location.state?.DeliveryZoneData;

    // 3️⃣ 🎯 تعبئة الحالات وتأخير ظهور الفورم لحد ما كل حاجة تجهز
    useEffect(() => {
        if (!isEdit) {
            setDataLoaded(true);
            return;
        }

        if (editData && selectionData.cities.length > 0 && !dataLoaded) {
            const cId = String(editData.city?.id || editData.cityId || '');
            const zId = String(editData.zone?.id || editData.zoneId || '');
            const bId = String(editData.branch?.id || editData.branchId || ''); // 💡 قراءة الفرع عند التعديل

            setSelectedCityId(cId);
            setSelectedZoneId(zId);
            setSelectedBranchId(bId); // 💡 تعيين قيمة الفرع

            setDeliveryFee(String(editData.deliveryFee ?? '0.00'));
            setMinOrderAmount(String(editData.minOrderAmount ?? '0.00'));
            
            const apiCoverageType = editData.coverageType || 'RADIUS';
            setCoverageType(apiCoverageType);
            
            if (editData.customRadiusKm || editData.coverageAreaRadiusKm) {
                setCustomRadiusKm(String(editData.customRadiusKm || editData.coverageAreaRadiusKm));
            }

            let rawCoords = editData?.customCoordinates;
            if (!rawCoords || (Array.isArray(rawCoords) && rawCoords.length === 0)) {
                rawCoords = editData?.zone?.defaultCoordinates || editData?.coordinates;
            }
            
            if (rawCoords) {
                if (Array.isArray(rawCoords)) {
                    setCoordinates(rawCoords);
                } else if (typeof rawCoords === 'string') {
                    try {
                        setCoordinates(JSON.parse(rawCoords));
                    } catch (e) {
                        setCoordinates([]);
                    }
                } else {
                     setCoordinates([]);
                }
            }

            setDataLoaded(true);
        }
    }, [isEdit, editData, selectionData, dataLoaded]);

    // 4️⃣ فلترة المناطق بناءً على المدينة
    const filteredZones = useMemo(() => {
        if (!selectedCityId) return [];
        return selectionData.zones.filter(z => String(z.cityId) === String(selectedCityId));
    }, [selectedCityId, selectionData.zones]);

    // 💡 5️⃣ فلترة الفروع بناءً على المدينة (أو المنطقة إذا كانت مرتبطة بها)
    const filteredBranches = useMemo(() => {
        if (!selectedCityId) return [];
        return selectionData.branches.filter(b => {
            const branchCityId = b.cityId || b.city_id;
            return !branchCityId || String(branchCityId) === String(selectedCityId);
        });
    }, [selectedCityId, selectionData.branches]);

    const handleZoneChange = (zoneId) => {
        setSelectedZoneId(zoneId);
        const zone = selectionData.zones.find(z => String(z.id) === String(zoneId));
        
        if (zone) {
            setDeliveryFee(zone.deliveryFee || '0.00');
            setMinOrderAmount(zone.minOrderAmount || '0.00');
            
            if (zone?.coordinates) {
                const coords = typeof zone?.coordinates === 'string' 
                    ? JSON.parse(zone?.coordinates) 
                    : zone?.coordinates;
                setCoordinates(coords);
            } else {
                setCoordinates([]);
            }

            if (zone?.coverageAreaRadiusKm) {
                setCustomRadiusKm(String(zone?.coverageAreaRadiusKm));
                setCoverageType('RADIUS');
            }
        }
    };

    const handleCoverageTypeChange = (isPolygon) => {
        const newType = isPolygon ? 'POLYGON' : 'RADIUS';
        setCoverageType(newType);

        if (newType === 'RADIUS' && coordinates.length > 1) {
            setCoordinates([coordinates[0]]);
        }
    };

    const fields = [
        {
            name: 'cityId',
            label: t('city') || 'City',
            required: true,
            type: 'select',
            value: selectedCityId,
            defaultValue: selectedCityId,
            options: selectionData.cities.map(c => ({
                value: String(c.id),
                label: isAr ? (c.nameAr || c.displayNameAr || c.name) : c.name
            })),
            onChange: (val) => {
                if (val === selectedCityId) return; 
                
                setSelectedCityId(val);
                setSelectedZoneId('');
                setSelectedBranchId(''); // 💡 تصفير الفرع عند تغير المدينة
                setCoordinates([]);
            }
        },
        {
            name: 'zoneId',
            label: t('zone') || 'Zone',
            required: true,
            type: 'select',
            value: selectedZoneId,
            defaultValue: selectedZoneId,
            options: filteredZones.map(z => ({
                value: String(z.id),
                label: isAr ? (z.nameAr || z.displayNameAr || z.name) : z.name
            })),
            disabled: !selectedCityId,
            onChange: (val) => {
                if (val === selectedZoneId) return; 
                handleZoneChange(val);
            }
        },
        // 💡 إضافة حقل الفرع (Branch) ليظهر بعد الـ Zone مباشرة
        {
            name: 'branchId',
            label: t('branch') || 'Branch',
            required: true,
            type: 'select',
            value: selectedBranchId,
            defaultValue: selectedBranchId,
            options: filteredBranches.map(b => ({
                value: String(b.id),
                label: isAr ? (b.nameAr || b.name) : b.name
            })),
            disabled: !selectedCityId,
            onChange: (val) => {
                if (val === selectedBranchId) return;
                setSelectedBranchId(val);
            }
        }
    ];

    const transformPayload = (formData) => {
        const payload = {
            cityId: formData.cityId || selectedCityId,
            zoneId: formData.zoneId || selectedZoneId,
            branchId: formData.branchId || selectedBranchId, // 💡 إرسال الفرع ضمن الـ Payload
            coverageType: coverageType,
            deliveryFee: parseFloat(deliveryFee),
            minOrderAmount: parseFloat(minOrderAmount),
            status: 'active',
            customCoordinates: coordinates
        };

        if (coverageType === 'RADIUS') {
            payload.customRadiusKm = parseFloat(customRadiusKm);
        }

        return payload;
    };

    if (isLoadingZones || (isEdit && isLoadingItem) || !dataLoaded) {
        return <LoadingSpinner />;
    }

    const initialValues = {
        cityId: selectedCityId,
        zoneId: selectedZoneId,
        branchId: selectedBranchId, // 💡 القيمة الابتدائية للفرع
        deliveryFee: deliveryFee,
        minOrderAmount: minOrderAmount,
    };

    return (
        <AddPage
            key={`form-${selectedCityId}-${selectedZoneId}-${selectedBranchId}`}
            title={t('deliveryZoneFee') || 'Delivery Zone Fee'}
            apiUrl={isEdit ? `/api/restaurant/restaurant-zone-delivery-fees/${id}` : '/api/restaurant/restaurant-zone-delivery-fees'}
            method={isEdit ? 'PUT' : 'POST'}
            queryKey="DeliveryZone"
            fields={fields}
            initialData={initialValues}
            transformPayload={transformPayload}
            onSuccessAction={(res) => {
                const targetId = String(
                    res?.data?.data?.id ||
                    res?.data?.id ||
                    res?.id ||
                    id ||
                    selectedZoneId
                );

                navigate('/delivery-zones', { state: { highlightedId: targetId } });
            }}
        >
            {() => (
                selectedZoneId ? (
                    <div className="col-span-full space-y-6 border-t pt-6 mt-4">
                        
                        {/* Switch نوع التغطية */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                            <div>
                                <Label className="text-base font-semibold">
                                    {isAr ? 'نوع التغطية' : 'Coverage Type'}
                                </Label>
                                <p className="text-sm text-slate-500">
                                    {coverageType === 'RADIUS'
                                        ? (isAr ? 'اختر نقطة واحدة على الخريطة لرسم دائرة التغطية بنصف القطر المحدد' : 'Click 1 point on the map to automatically draw a coverage circle with the radius')
                                        : (isAr ? 'انقر عدة مرات على الخريطة لرسم شكل مضلع مخصص' : 'Click multiple points on the map to draw a custom polygon region')}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium ${coverageType === 'RADIUS' ? 'text-primary' : 'text-slate-400'}`}>RADIUS</span>
                                <Switch
                                    checked={coverageType === 'POLYGON'}
                                    onCheckedChange={handleCoverageTypeChange}
                                />
                                <span className={`text-sm font-medium ${coverageType === 'POLYGON' ? 'text-primary' : 'text-slate-400'}`}>POLYGON</span>
                            </div>
                        </div>

                        {/* الحقول المتاحة */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>{isAr ? 'رسوم التوصيل' : 'Delivery Fee'}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={deliveryFee}
                                    onChange={(e) => setDeliveryFee(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{isAr ? 'الحد الأدنى للطلب' : 'Min Order Amount'}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={minOrderAmount}
                                    onChange={(e) => setMinOrderAmount(e.target.value)}
                                />
                            </div>

                            {coverageType === 'RADIUS' && (
                                <div className="space-y-2">
                                    <Label>{isAr ? 'نصف القطر (كم)' : 'Custom Radius (Km)'}</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={customRadiusKm}
                                        onChange={(e) => setCustomRadiusKm(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* الخريطة */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-semibold">
                                    {isAr ? 'الخريطة التفاعلية' : 'Interactive Map Coverage'}
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCoordinates([])}
                                >
                                    {isAr ? 'مسح النقاط' : 'Clear Points'}
                                </Button>
                            </div>

                            <InteractiveZoneMap
                                coverageType={coverageType}
                                coordinates={coordinates}
                                setCoordinates={setCoordinates}
                                radiusKm={customRadiusKm}
                            />
                        </div>
                    </div>
                ) : null
            )}
        </AddPage>
    );
};

export default DeliveryZoneAdd;