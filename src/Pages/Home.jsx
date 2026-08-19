import { getModules } from "@/config/modules";
import useSidebarStore from "@/store/useSidebarStore";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function Home() {
  const setActiveModule = useSidebarStore((s) => s.setActiveModule);
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState("");
  const { t } = useTranslation();
  const modules = getModules(t);

  const getDefaultItemUrl = (module) => {
    const firstItem = module.items?.[0];
    if (!firstItem) return "/";

    if (firstItem.subItems?.length) {
      return firstItem.subItems[0].url;
    }

    return firstItem.url || "/";
  };

  // منطق الفلترة: نبحث في اسم الموديول أو أسماء العناصر الداخلية
  const filteredModules = modules.filter((module) => {
    const searchTerm = globalFilter.toLowerCase();
    const matchesModuleName = module.name.toLowerCase().includes(searchTerm);
    const matchesItems = module.items.some((item) =>
      item.title.toLowerCase().includes(searchTerm),
    );
    return matchesModuleName || matchesItems;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">
      {/* الترويسة + السيرش */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t("modules") || "Modules"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("everythingInOnePlace") || "Everything you can manage, in one place"}
          </p>
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchModules")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 h-11 rounded-full border-border/60 bg-card shadow-sm focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* شبكة الكروت بالتصميم الجديد وتأثيرات Hover */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredModules.map((module) => {
          // جلب الأيقونة من الموديول، وإذا لم تكن موجودة نجلبها من أول عنصر فرعي
          const Icon = module.icon || module.items?.[0]?.icon || LayoutGrid;

          const visibleItems = module.items.filter((item) =>
            globalFilter
              ? item.title.toLowerCase().includes(globalFilter.toLowerCase())
              : true,
          );

          const description =
            module.description || visibleItems.map((i) => i.title).join(", ");

          return (
            <Card
              key={module.key}
              onClick={() => {
                setActiveModule(module);
                navigate(getDefaultItemUrl(module));
              }}
              // الكارت الأساسي (تمت إضافة group للتحكم في العناصر الداخلية عند الـ hover)
              className="group cursor-pointer border-none rounded-2xl bg-card shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300"
            >
              <CardContent className="p-8 flex flex-col items-center text-center h-full justify-center">

                {/* 
                  مربع الأيقونة 
                  - الحالة العادية: خلفية شفافة بلون الموقع (bg-primary/10) وأيقونة ملونة (text-primary)
                  - حالة الـ Hover: خلفية صلبة بلون الموقع (group-hover:bg-primary) وأيقونة بلون فاتح (group-hover:text-primary-foreground)
                */}
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <Icon size={28} strokeWidth={2} />
                </div>

                {/* العنوان والوصف */}
                <div className="space-y-2">
                  {/* 
                    عنوان الكارت
                    - حالة الـ Hover: يتغير للون الأساسي (group-hover:text-primary)
                  */}
                  <h2 className="text-[17px] font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {module.name}
                  </h2>
                  {description && (
                    <p className="text-[13px] text-muted-foreground font-medium leading-relaxed line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* حالة عدم وجود نتائج */}
      {filteredModules.length === 0 && (
        <div className="text-center py-24">
          <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No results found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different keyword
          </p>
        </div>
      )}
    </div>
  );
}