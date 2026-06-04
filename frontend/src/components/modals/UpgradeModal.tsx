"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "consumer" | "provider" | "company";
}

const upgradeData = {
  consumer: {
    title: "Upgrade para Premium",
    benefits: [
      "Livre de taxas de compras e visitas",
      "Entregas mais rápidas",
      "Possibilidade de agendamento de prestadores",
    ],
    price: "R$ 29,90/mês",
  },
  provider: {
    title: "Upgrade para Premium",
    benefits: [
      "Destaque no perfil para consumidores",
      "Sem taxas de visitas",
      "Sem taxas nas compras de materiais",
    ],
    price: "R$ 49,90/mês",
  },
  company: {
    title: "Upgrade para Premium",
    benefits: [
      "Possibilidade de gerenciamento de estoque",
      "Cadastro de gastos, recebimentos e contas a pagar",
      "Livre de taxas nas suas vendas",
    ],
    price: "R$ 99,90/mês",
  },
};

export function UpgradeModal({ isOpen, onClose, userType }: UpgradeModalProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("upgrade") === "true") {
      // Modal will be opened via URL param
    }
  }, [searchParams]);

  if (!isOpen) return null;

  const data = upgradeData[userType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full mx-4 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center z-10 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Section */}
        <div className="relative h-64 bg-white flex items-end justify-center overflow-hidden">
          {/* Light background with wooden surface */}
          <div className="absolute inset-0 bg-gray-50"></div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-amber-50"></div>
          
          {/* Wooden blocks pyramid illustration */}
          <div className="relative z-10 flex flex-col items-center justify-end mb-8">
            <div className="flex flex-col items-center space-y-1">
              {/* Base row - 4 blocks */}
              <div className="flex space-x-1">
                <div className="w-10 h-10 bg-amber-200 rounded-sm shadow-sm"></div>
                <div className="w-10 h-10 bg-amber-200 rounded-sm shadow-sm"></div>
                <div className="w-10 h-10 bg-amber-200 rounded-sm shadow-sm"></div>
                <div className="w-10 h-10 bg-amber-200 rounded-sm shadow-sm"></div>
              </div>
              {/* Second row - 3 blocks */}
              <div className="flex space-x-1">
                <div className="w-10 h-10 bg-amber-300 rounded-sm shadow-sm"></div>
                <div className="w-10 h-10 bg-amber-300 rounded-sm shadow-sm"></div>
                <div className="w-10 h-10 bg-amber-300 rounded-sm shadow-sm"></div>
              </div>
              {/* Third row - 2 blocks */}
              <div className="flex space-x-1">
                <div className="w-10 h-10 bg-amber-400 rounded-sm shadow-sm"></div>
                <div className="w-10 h-10 bg-amber-400 rounded-sm shadow-sm"></div>
              </div>
              {/* Top block with hand placing */}
              <div className="relative">
                <div className="w-10 h-10 bg-amber-500 rounded-sm shadow-sm"></div>
                {/* Hand placing block - positioned above */}
                <div className="absolute -right-3 -top-4 w-8 h-8 bg-amber-600 rounded-sm shadow-md transform rotate-12"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-gray-800 p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">{data.title}</h2>

          {/* Benefits List */}
          <ul className="space-y-4 mb-8">
            {data.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-white text-sm">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <button
            onClick={() => {
              // Handle subscription
              alert("Funcionalidade de assinatura em desenvolvimento");
            }}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold rounded-lg transition-colors"
          >
            Assinar por {data.price}
          </button>
        </div>
      </div>
    </div>
  );
}
