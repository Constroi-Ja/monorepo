"use client";

import type { Provider } from "@/types";

interface Props {
  provider: Provider;
  onClose: () => void;
  onRequest: (providerId: number) => void;
}

export function ProviderDetailModal({ provider, onClose, onRequest }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 px-5 pt-10 pb-5 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
            {provider.image_url ? (
              <img src={provider.image_url} alt={provider.full_name} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>

          <h2 className="font-bold text-gray-900 text-lg">{provider.full_name}</h2>

          <span className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${provider.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${provider.is_available ? "bg-green-500" : "bg-gray-400"}`} />
            {provider.is_available ? "Disponível" : "Indisponível"}
          </span>
        </div>

        {/* Info */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {provider.distance} km de distância
            </div>
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <svg className="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {provider.rating}
              {provider.rating_count != null && (
                <span className="text-xs text-gray-400 font-normal">({provider.rating_count})</span>
              )}
            </div>
          </div>

          {provider.specialties.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Especialidades</p>
              <div className="flex flex-wrap gap-1.5">
                {provider.specialties.map((s) => (
                  <span key={s} className="bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-orange-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-gray-700">Visita técnica</span>
            <span className="font-bold text-orange-500">R$ 80,00</span>
          </div>

          <button
            onClick={() => onRequest(provider.id)}
            disabled={!provider.is_available}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {provider.is_available ? "Solicitar visita técnica" : "Prestador indisponível"}
          </button>
        </div>
      </div>
    </div>
  );
}
