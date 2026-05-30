import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'

// تطبيق اللغة المحفوظة عند أول تحميل
const savedLang = JSON.parse(localStorage.getItem("keeto-language") || '{}')?.state?.language || "en";
document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
document.documentElement.lang = savedLang;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(

  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster position="top-right" richColors />
  </QueryClientProvider>

)