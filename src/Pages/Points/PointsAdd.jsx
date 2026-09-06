import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// مكون القائمة المنسدلة المزودة بالبحث للمنتج
const ProductCombobox = ({ value, onChange, options, t }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((f) => String(f.id) === String(value));

  const filteredOptions = search.trim()
    ? options.filter((f) =>
        `${f.name} ${f.price}`.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left h-10 bg-white border-input"
        >
          <span className="truncate">
            {selectedOption
              ? `${selectedOption.name} - (${selectedOption.price} ${t("EGP") || "ج.م"})`
              : t("Select Product")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("Search Product...") || "بحث عن منتج..."}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{t("noResultsFound") || "لا توجد نتائج"}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((food) => (
                <CommandItem
                  key={food.id}
                  value={String(food.id)}
                  onSelect={() => {
                    onChange(String(food.id));
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(value) === String(food.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {food.name} - ({food.price} {t("EGP") || "ج.م"})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const PointsAdd = () => {
  const { pointId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // حالة لتخزين مصفوفة المنتجات المطلوب إرسالها
  const [items, setItems] = useState([
    { foodId: "", pointsRequiredForRedeem: "" },
  ]);

  // جلب البيانات في حالة التعديل
  const { data: PointsData, isLoading: isFetching } = useQuery({
    queryKey: ["PointsAdd", pointId],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurant/points-products/${pointId}`);
      return data.data.data;
    },
    enabled: !!pointId && !state?.PointsData,
  });

  // جلب قائمة الأطعمة/المنتجات المتاحة
  const { data: selectData } = useQuery({
    queryKey: ["pointsSelect"],
    queryFn: async () => {
      const { data } = await api.get("/api/restaurant/points-products/food-select");
      return data.data.data;
    },
  });

  const rawData = state?.PointsData || PointsData;

  // تعبئة البيانات المبدئية عند التعديل
  useEffect(() => {
    if (rawData) {
      if (Array.isArray(rawData.items)) {
        setItems(rawData.items);
      } else if (rawData.foodId) {
        setItems([
          {
            foodId: rawData.foodId,
            pointsRequiredForRedeem: rawData.pointsRequiredForRedeem || rawData.points || 0,
          },
        ]);
      }
    }
  }, [rawData]);

  // التحكم في إضافة عنصر جديد للقائمة
  const handleAddItem = () => {
    setItems([...items, { foodId: "", pointsRequiredForRedeem: "" }]);
  };

  // التحكم في حذف عنصر من القائمة
  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // التعديل على قيم منتج معين
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = field === "pointsRequiredForRedeem" ? Number(value) : value;
    setItems(updatedItems);
  };

  // Mutation لإرسال البيانات للباك إند
  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (pointId) {
        return await api.put(`/api/restaurant/points-products/${pointId}`, payload);
      }
      return await api.post("/api/restaurant/points-products", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["points"]);
      navigate(-1);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // تجهيز الـ Body بالظبط بالشكل المطلوب
    const payload = {
      items: items.map((item) => ({
        foodId: item.foodId,
        pointsRequiredForRedeem: Number(item.pointsRequiredForRedeem),
      })),
    };

    mutation.mutate(payload);
  };

  if (pointId && isFetching) return <LoadingSpinner />;

  // استخراج خيارات الأطعمة
  const foodOptions = selectData?.foods || selectData || [];

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {pointId ? t("Edit Points") : t("Add Points")}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex gap-4 items-end border p-4 rounded-md bg-gray-50">
            {/* اختيار المنتج مع خاصية البحث */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{t("Product")}</label>
              <ProductCombobox
                value={item.foodId}
                onChange={(val) => handleItemChange(index, "foodId", val)}
                options={foodOptions}
                t={t}
              />
            </div>

            {/* عدد النقاط المطلوبة للاستبدال */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                {t("Points Required For Redeem")}
              </label>
              <input
                type="number"
                min="1"
                value={item.pointsRequiredForRedeem}
                onChange={(e) =>
                  handleItemChange(index, "pointsRequiredForRedeem", e.target.value)
                }
                required
                placeholder="150"
                className="w-full border rounded p-2 focus:ring focus:ring-primary h-10"
              />
            </div>

            {/* زر الحذف */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded h-10 flex items-center justify-center"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        ))}

        {/* زر إضافة منتج جديد */}
        <button
          type="button"
          onClick={handleAddItem}
          className="flex items-center gap-2 text-primary font-medium hover:underline py-2"
        >
          <Plus size={18} />
          {t("Add Another Product")}
        </button>

        {/* أزرار الحفظ والإلغاء */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
          >
            {t("Cancel")}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
          >
            {mutation.isPending ? t("Saving...") : t("Save")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PointsAdd;