import { create } from "zustand";

const getToday = () => new Date().toISOString().split("T")[0];

const useDateRangeStore = create((set) => ({
  startDate: getToday(),
  endDate: "", // تم جعل القيمة الافتراضية فارغة
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  clearDateRange: () => set({ startDate: "", endDate: "" }),
}));

export default useDateRangeStore;