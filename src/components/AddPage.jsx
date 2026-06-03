import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form'; 
import { usePost } from '@/hooks/usePost';
import { useUpdate } from '@/hooks/useUpdate';

// استيراد مكونات Shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Check, ChevronsUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// استيراد مكونات الـ Combobox الجديدة (Popover + Command)
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const AddPage = ({
    title,
    apiUrl,
    queryKey,
    method,
    fields = [],
    initialData,
    onSuccessAction,
    children,
    transformPayload,
}) => {
    const isEdit = method === 'PUT' || !!initialData?.id;
    const formMethods = useForm({
        defaultValues: initialData || {}
    });
    const { control, handleSubmit, register, reset, formState: { errors } } = formMethods;
    const postMutation = usePost(apiUrl, 'post', queryKey);
    const updateMutation = useUpdate(apiUrl, queryKey);
    
    // حالة لتتبع أي القوائم المنسدلة للـ combobox مفتوحة حالياً بناءً على اسم الحقل
    const [openCombobox, setOpenCombobox] = useState({});

    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    useEffect(() => {
        if (initialData) {
            const formattedData = { ...initialData };

            fields.forEach(field => {
                if (field.type === 'date' && initialData[field.name]) {
                    formattedData[field.name] = new Date(initialData[field.name])
                        .toISOString()
                        .split('T')[0];
                }
            });

            reset(formattedData, { keepDirtyValues: true });
        }
    }, [initialData, reset, fields]);

    const onSubmit = (data) => {
        const payloadToSend = transformPayload ? transformPayload(data) : data;
        if (isEdit) {
            updateMutation.mutate(
                { id: initialData.id, payload: payloadToSend }, 
                { onSuccess: () => onSuccessAction?.() }
            );
        } else {
            postMutation.mutate(payloadToSend, { 
                onSuccess: () => onSuccessAction?.()
            });
        }
    };

    const isLoading = postMutation.isPending || updateMutation.isPending;

    return (
        <Card className="mx-auto shadow-lg border-none">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight text-capitalize">
                    {isEdit ? `Edit ${title}` : `Add ${title}`}
                </CardTitle>
                <CardDescription>
                    Please fill the following data, the marked fields are required.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fields.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name}>
                                    {field.label} {field.required && <span className="text-destructive">*</span>}
                                </Label>

                                {(field.type === 'select' || field.type === 'combobox') ? (
                                    /* 🌟 إضافة دعم الـ Combobox الذكي هنا سيعمل مع الفلترة والبحث السريع */
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        defaultValue={initialData?.[field.name] || ""}
                                        rules={{ required: field.required }}
                                        render={({ field: { onChange, value } }) => {
                                            const stringVal = value != null ? String(value) : "";
                                            const [searchVal, setSearchVal] = React.useState("");
                                            const filteredOptions = searchVal.trim()
                                                ? field.options?.filter(o => o.label.toLowerCase().includes(searchVal.toLowerCase()))
                                                : field.options;
                                            return (
                                            <Popover 
                                                open={openCombobox[field.name] || false} 
                                                onOpenChange={(isOpen) => {
                                                    setOpenCombobox(prev => ({ ...prev, [field.name]: isOpen }));
                                                    if (!isOpen) setSearchVal("");
                                                }}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between font-normal text-left h-10 bg-white border-input",
                                                            errors[field.name] ? "border-destructive text-destructive" : ""
                                                        )}
                                                    >
                                                        {stringVal
                                                            ? field.options?.find((option) => String(option.value) === stringVal)?.label
                                                            : `Select ${field.label}...`}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 PopoverContent" align="start">
                                                    <Command shouldFilter={false}>
                                                        <CommandInput
                                                            placeholder={`Search ${field.label}...`}
                                                            value={searchVal}
                                                            onValueChange={setSearchVal}
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>No results found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {filteredOptions?.map((option) => (
                                                                    <CommandItem
                                                                        key={option.value}
                                                                        value={String(option.value)}
                                                                        onSelect={() => {
                                                                            onChange(String(option.value));
                                                                            setOpenCombobox(prev => ({ ...prev, [field.name]: false }));
                                                                            setSearchVal("");
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                stringVal === String(option.value) ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {option.label}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            );
                                        }}
                                    />
                                ) : field.type === 'multi-select' ? (
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        defaultValue={initialData?.[field.name] || []}
                                        rules={{ required: field.required }}
                                        render={({ field: { onChange, value = [] } }) => {
                                            const safeValue = Array.isArray(value) ? value : [];
                                            const handleToggleOption = (optionValue) => {
                                                const stringValue = String(optionValue);
                                                if (safeValue.includes(stringValue)) {
                                                    onChange(safeValue.filter(v => v !== stringValue));
                                                } else {
                                                    onChange([...safeValue, stringValue]);
                                                }
                                            };

                                            return (
                                                <div className="space-y-2">
                                                    <Select onValueChange={handleToggleOption} value="">
                                                        <SelectTrigger className={errors[field.name] ? "border-destructive w-full" : "w-full"}>
                                                            <SelectValue placeholder={`Select ${field.label}...`} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {field.options?.map((option) => {
                                                                const isSelected = safeValue.includes(String(option.value));
                                                                return (
                                                                    <SelectItem 
                                                                        key={option.value} 
                                                                        value={String(option.value)}
                                                                        className={isSelected ? "bg-accent text-accent-foreground font-medium" : ""}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <input 
                                                                                type="checkbox" 
                                                                                checked={isSelected} 
                                                                                readOnly 
                                                                                className="rounded border-gray-300 text-primary focus:ring-primary h-3 w-3"
                                                                            />
                                                                            {option.label}
                                                                        </div>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>

                                                    {safeValue.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30">
                                                            {safeValue.map((val) => {
                                                                const option = field.options?.find(o => String(o.value) === String(val));
                                                                return (
                                                                    <span 
                                                                        key={val} 
                                                                        className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-sm shadow-sm"
                                                                    >
                                                                        {option ? option.label : val}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => onChange(safeValue.filter(v => v !== val))}
                                                                            className="hover:bg-primary-foreground/20 rounded-full w-3 h-3 inline-flex items-center justify-center text-[10px] font-bold"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                ) : field.type === 'file' ? (
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        rules={{ required: isEdit ? false : field.required }}
                                        render={({ field: { onChange, value } }) => (
                                            <div className="space-y-3">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const base64 = await toBase64(file);
                                                            onChange(base64);
                                                        }
                                                    }}
                                                    className={errors[field.name] ? "border-destructive" : ""}
                                                />
                                                {value && (
                                                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                                                        <img
                                                            src={value} 
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-1">
                                                            Current
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    />
                                ) : field.type === 'switch' ? (
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        defaultValue={false}
                                        render={({ field: { onChange, value } }) => (
                                            <Switch
                                                checked={value}
                                                onCheckedChange={onChange}
                                            />
                                        )}
                                    />
                                ) : (
                                    <Input
                                        id={field.name}
                                        type={field.type || 'text'}
                                        {...register(field.name, { 
                                            required: field.required,
                                            valueAsNumber: field.type === 'number'
                                        })}
                                        className={errors[field.name] ? "border-destructive" : ""}
                                    />
                                )}

                                {errors[field.name] && <p className="text-destructive text-xs">Required</p>}
                            </div>
                        ))}
                        {children && (
                            <div className="col-span-full">
                                {typeof children === 'function'
                                    ? children(formMethods)
                                    : children}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 border-t">
                        <Button type="submit" disabled={isLoading} className="w-full md:w-32">
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> saving...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> {isEdit ? 'update' : 'save'}</>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default AddPage;