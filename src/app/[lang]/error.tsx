"use client";

import { useEffect } from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()
  const lang = (params?.lang as string) === 'ru' ? 'ru' : 'uz'

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-[#FAFAF6]">
      <div className="bg-white/90 backdrop-blur-xl rounded-[32px] border border-[rgba(15,20,16,0.08)] shadow-xs p-8 md:p-12 max-w-md w-full text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-red-50/80 border border-red-500/10 rounded-2xl flex items-center justify-center mb-5 text-red-500">
          <AlertCircle size={32} />
        </div>
        
        <h2 className="text-xl font-bold text-[#111612] mb-2 tracking-tight">
          {lang === 'ru' ? 'Что-то пошло не так' : "Nimadir noto'g'ri ketdi"}
        </h2>
        <p className="text-[rgba(15,20,16,0.62)] text-sm max-w-xs mx-auto mb-8 font-normal leading-relaxed">
          {lang === 'ru' 
            ? 'Произошла неожиданная ошибка. Пожалуйста, обновите страницу или вернитесь на главную.'
            : "Kutilmagan xatolik yuz berdi. Iltimos, sahifani yangilang yoki asosiy sahifaga qayting."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            onClick={() => {
              try { reset(); } catch {}
              window.location.reload();
            }}
            className="flex items-center justify-center gap-2 bg-[#2D6E3E] hover:bg-[#235831] text-white px-6 py-3 rounded-full font-semibold text-xs active:scale-95 transition-transform duration-150 will-change-transform shadow-sm cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>{lang === 'ru' ? 'Повторить (Обновить)' : 'Qayta urinish (Yangilash)'}</span>
          </button>
          
          <Link
            href={`/${lang}`}
            onClick={() => {
              window.location.href = `/${lang}`;
            }}
            className="flex items-center justify-center gap-2 bg-[rgba(15,20,16,0.05)] hover:bg-[rgba(15,20,16,0.08)] text-[#111612] px-6 py-3 rounded-full font-semibold text-xs active:scale-95 transition-transform duration-150 will-change-transform"
          >
            <Home size={15} />
            <span>{lang === 'ru' ? 'Главная' : 'Bosh sahifa'}</span>
          </Link>
        </div>

        {error?.message && (
          <div className="mt-6 p-3.5 bg-red-50/80 border border-red-200/80 rounded-2xl text-left max-w-full overflow-auto">
            <p className="text-[11px] font-mono text-red-600 font-semibold break-words">{error.message}</p>
            {error.digest && <p className="text-[10px] font-mono text-gray-400 mt-1">Kod: {error.digest}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
