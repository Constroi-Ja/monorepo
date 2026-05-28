"use client";

interface Props {
  onLogout: () => void;
}

export function ProviderPendingModal({ onLogout }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Cadastro em análise</h2>
        <p className="text-sm text-gray-500 mb-6">
          Seus antecedentes criminais estão sendo verificados. Em até <strong>1 hora</strong> você receberá acesso completo ao sistema.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs text-amber-700 font-medium mb-1">O que está acontecendo?</p>
          <ul className="text-xs text-amber-600 space-y-1">
            <li>• Seu documento foi recebido com sucesso</li>
            <li>• Nossa equipe está verificando suas informações</li>
            <li>• Você será liberado automaticamente após aprovação</li>
          </ul>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
