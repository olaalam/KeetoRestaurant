import React from "react";
import AddPage from "@/components/AddPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller, useFieldArray } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

// All allergen options
const ALLERGEN_OPTIONS = [
  "Dairy",
  "Gluten",
  "Eggs",
  "Nuts",
  "Peanuts",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
  "Wheat",
];

// Helper: parse "Dairy | Gluten" string → ["Dairy", "Gluten"]
const parseAllergens = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val.split("|").map((s) => s.trim()).filter(Boolean);
};

// Helper: ["Dairy", "Gluten"] → "Dairy | Gluten"
const serializeAllergens = (arr) => arr.join(" | ");

const FoodAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { data: selectOptions, isLoading: isSelectLoading } = useQuery({
    queryKey: ["food-select-options"],
    queryFn: async () => {
      const response = await api.get("/api/restaurant/food/select");
      return response.data?.data?.data || {};
    },
  });

  const { data: foodData, isLoading: isFetching } = useQuery({
    queryKey: ["food", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurant/food/${id}`);
      const raw = data.data.data;

      return {
        // All keys in camelCase to match API payload exactly
        name: raw.name || "",
        nameAr: raw.nameAr || raw.name_ar || "",
        nameFr: raw.nameFr || raw.name_fr || "",
        description: raw.description || "",
        descriptionAr: raw.descriptionAr || raw.description_ar || "",
        descriptionFr: raw.descriptionFr || raw.description_fr || "",
        image: raw.image || "",
        categoryid: String(raw.categoryid || raw.categories?.id || raw.category?.id || ""),
        subcategoryid: String(raw.subcategoryid || raw.subcategories?.id || raw.subcategory?.id || ""),
        foodtype: raw.foodtype || "",
        Nutrition: raw.Nutrition || raw.nutrition || "",
        allergen_ingredients: parseAllergens(raw.allergen_ingredients),
        is_Halal: Boolean(raw.is_Halal),
        startTime: raw.startTime || raw.start_time || "",
        endTime: raw.endTime || raw.end_time || "",
        search_tags: raw.search_tags || "",
        price: raw.price ? Number(raw.price) : "",
        discount_type: raw.discount_type || "none",
        discount_value: raw.discount_value ? Number(raw.discount_value) : 0,
        Maximum_Purchase: raw.Maximum_Purchase ? Number(raw.Maximum_Purchase) : 5,
        stock_type: raw.stock_type || "unlimited",
        status: raw.status || "active",
        variations:
          raw.variations?.map((v) => ({
            name: v.name || "",
            nameAr: v.nameAr || "",
            nameFr: v.nameFr || "",
            isRequired: Boolean(v.isRequired),
            selectionType: v.selectionType || "single",
            min: v.min ? Number(v.min) : 1,
            max: v.max ? Number(v.max) : 1,
            options:
              v.options?.map((o) => ({
                optionName: o.optionName || "",
                optionNameAr: o.optionNameAr || "",
                optionNameFr: o.optionNameFr || "",
                additionalPrice: o.additionalPrice ? Number(o.additionalPrice) : 0,
              })) || [],
          })) || [],
      };
    },
    enabled: !!id && !state?.foodData,
  });

  const initialData = state?.foodData || foodData;
  if (isSelectLoading || (id && isFetching)) {
    return <LoadingSpinner />;
  }

  // Transform form data before submit: allergens array → string
  const transformBeforeSubmit = (formData) => ({
    ...formData,
    allergen_ingredients: Array.isArray(formData.allergen_ingredients)
      ? serializeAllergens(formData.allergen_ingredients)
      : formData.allergen_ingredients,
  });

  return (
    <AddPage
      title="Food Item"
      apiUrl="/api/restaurant/food"
      queryKey={["foods"]}
      fields={[]}
      initialData={initialData}
      transformData={transformBeforeSubmit}
      onSuccessAction={() => navigate("/foods")}
    >
      {({ register, control, formState: { errors }, setValue, watch }) => {
        const imagePreview = watch("image");
        const selectedCategoryId = watch("categoryid");
        const selectedAllergens = watch("allergen_ingredients") || [];

        const toggleAllergen = (allergen) => {
          const current = Array.isArray(selectedAllergens) ? selectedAllergens : [];
          const updated = current.includes(allergen)
            ? current.filter((a) => a !== allergen)
            : [...current, allergen];
          setValue("allergen_ingredients", updated);
        };

        return (
          <Tabs defaultValue="basic" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
              <TabsTrigger value="variations">Variations</TabsTrigger>
            </TabsList>

            {/* Tab 1: Basic Info */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Food Name *</Label>
                  <Input
                    {...register("name", { required: "Name is required" })}
                    placeholder="e.g. Cheese Burger"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <span className="text-destructive text-xs">{errors.name.message}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Food Name (AR) *</Label>
                  <Input
                    {...register("nameAr", { required: "Arabic name is required" })}
                    placeholder="مثال: برجر بالجبنة"
                    className={errors.nameAr ? "border-destructive" : ""}
                  />
                  {errors.nameAr && (
                    <span className="text-destructive text-xs">{errors.nameAr.message}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Food Name (FR) *</Label>
                  <Input
                    {...register("nameFr", { required: "French name is required" })}
                    placeholder="e.g. Burger au fromage"
                    className={errors.nameFr ? "border-destructive" : ""}
                  />
                  {errors.nameFr && (
                    <span className="text-destructive text-xs">{errors.nameFr.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    {...register("description", { required: "Description is required" })}
                    placeholder="Brief description..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (AR) *</Label>
                  <Input
                    {...register("descriptionAr", { required: "Arabic description is required" })}
                    placeholder="وصف قصير..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (FR) *</Label>
                  <Input
                    {...register("descriptionFr", { required: "French description is required" })}
                    placeholder="Description brève..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Food Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const base = await toBase64(file);
                        setValue("image", base);
                      }
                    }}
                  />
                  {imagePreview && (
                    <div className="w-16 h-16 border rounded overflow-hidden shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Controller
                    name="categoryid"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          setValue("subcategoryid", "");
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectOptions?.categories?.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sub Category</Label>
                  <Controller
                    name="subcategoryid"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Sub Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectOptions?.subcategories
                            ?.filter((sub) => sub.categoryId === selectedCategoryId)
                            ?.map((sub) => (
                              <SelectItem key={sub.id} value={String(sub.id)}>
                                {sub.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Details */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">

                {/* Food Type: veg / non-veg select */}
                <div className="space-y-2">
                  <Label>Food Type</Label>
                  <Controller
                    name="foodtype"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select food type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="veg">🟢 Veg</SelectItem>
                          <SelectItem value="non-veg">🔴 Non-Veg</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nutrition</Label>
                  <Input
                    {...register("Nutrition")}
                    placeholder="e.g. 500 kcal - 20g Protein"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Search Tags</Label>
                  <Input
                    {...register("search_tags")}
                    placeholder="burger beef fastfood"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" {...register("startTime")} />
                </div>

                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" {...register("endTime")} />
                </div>

                <div className="space-y-2 flex items-center pt-8 gap-3">
                  <Controller
                    name="is_Halal"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label>Is Halal?</Label>
                </div>
              </div>

              {/* Allergens multi-select as toggle buttons */}
              <div className="space-y-2">
                <Label>Allergen Ingredients</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ALLERGEN_OPTIONS.map((allergen) => {
                    const isSelected = Array.isArray(selectedAllergens) &&
                      selectedAllergens.includes(allergen);
                    return (
                      <button
                        key={allergen}
                        type="button"
                        onClick={() => toggleAllergen(allergen)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          isSelected
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-600 border-gray-300 hover:border-orange-400"
                        }`}
                      >
                        {allergen}
                      </button>
                    );
                  })}
                </div>
                {Array.isArray(selectedAllergens) && selectedAllergens.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {selectedAllergens.join(", ")}
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Tab 3: Pricing & Stock */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Price *</Label>
                  <Input
                    type="number"
                    {...register("price", { required: true, valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Controller
                    name="discount_type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="No Discount" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    {...register("discount_value", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Maximum Purchase Limit</Label>
                  <Input
                    type="number"
                    {...register("Maximum_Purchase", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stock Type</Label>
                  <Controller
                    name="stock_type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                          <SelectItem value="limited">Limited</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 4: Variations */}
            <TabsContent value="variations">
              <VariationsSection
                control={control}
                register={register}
                setValue={setValue}
                watch={watch}
              />
            </TabsContent>
          </Tabs>
        );
      }}
    </AddPage>
  );
};

const VariationsSection = ({ control, register, setValue, watch }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variations",
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="text-lg font-semibold">Product Variations</h3>
        <Button
          type="button"
          onClick={() =>
            append({
              name: "",
              nameAr: "",
              nameFr: "",
              isRequired: false,
              selectionType: "single",
              min: 1,
              max: 1,
              options: [{ optionName: "", optionNameAr: "", optionNameFr: "", additionalPrice: 0 }],
            })
          }
          className="bg-orange-500 hover:bg-orange-600"
        >
          + Add Variation
        </Button>
      </div>

      {fields.map((item, index) => {
        const selectionType = watch(`variations.${index}.selectionType`);

        return (
          <div key={item.id} className="p-6 border-2 rounded-xl bg-white relative space-y-4 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              onClick={() => remove(index)}
              className="absolute top-2 right-2 text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Variation Name (EN)</Label>
                <Input {...register(`variations.${index}.name`)} placeholder="e.g. Size" />
              </div>
              <div className="space-y-2">
                <Label>Variation Name (AR)</Label>
                <Input {...register(`variations.${index}.nameAr`)} placeholder="مثال: الحجم" />
              </div>
              <div className="space-y-2">
                <Label>Variation Name (FR)</Label>
                <Input {...register(`variations.${index}.nameFr`)} placeholder="e.g. Taille" />
              </div>

              <div className="space-y-2">
                <Label>Selection Type</Label>
                <Controller
                  name={`variations.${index}.selectionType`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        if (val === "single") {
                          setValue(`variations.${index}.min`, 1);
                          setValue(`variations.${index}.max`, 1);
                        }
                      }}
                      value={field.value}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single (Radio)</SelectItem>
                        <SelectItem value="multiple">Multiple (Checkbox)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Controller
                  name={`variations.${index}.isRequired`}
                  control={control}
                  render={({ field }) => (
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label>Required?</Label>
              </div>
            </div>

            {selectionType === "multiple" && (
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Min Selection</Label>
                  <Input
                    type="number"
                    {...register(`variations.${index}.min`, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Selection</Label>
                  <Input
                    type="number"
                    {...register(`variations.${index}.max`, { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <OptionsSection nestIndex={index} control={control} register={register} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OptionsSection = ({ nestIndex, control, register }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variations.${nestIndex}.options`,
  });

  return (
    <div className="space-y-3">
      <Label className="text-blue-600 font-bold">Options & Pricing</Label>
      {fields.map((item, k) => (
        <div key={item.id} className="flex items-end gap-4 bg-slate-50 p-3 rounded-lg">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Option Name</Label>
            <Input
              {...register(`variations.${nestIndex}.options.${k}.optionName`)}
              className="bg-white"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Option Name (AR)</Label>
            <Input
              {...register(`variations.${nestIndex}.options.${k}.optionNameAr`)}
              className="bg-white"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Option Name (FR)</Label>
            <Input
              {...register(`variations.${nestIndex}.options.${k}.optionNameFr`)}
              className="bg-white"
            />
          </div>
          <div className="w-32 space-y-1">
            <Label className="text-xs">Extra Price</Label>
            <Input
              type="number"
              {...register(`variations.${nestIndex}.options.${k}.additionalPrice`, {
                valueAsNumber: true,
              })}
              className="bg-white"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => remove(k)}
            disabled={fields.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ optionName: "", optionNameAr: "", optionNameFr: "", additionalPrice: 0 })}
        className="mt-2 text-blue-600 border-blue-600"
      >
        + Add Option
      </Button>
    </div>
  );
};

export default FoodAdd;
