'use client';

import { Subscriber } from '@/types';

interface SubscriberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: Subscriber | null;
  onDelete?: (subscriberId: string) => void;
}

export default function SubscriberDetailsModal({ 
  isOpen, 
  onClose, 
  subscriber,
  onDelete 
}: SubscriberDetailsModalProps) {
  if (!isOpen || !subscriber) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: '⏳ In Attesa' },
      'ACTIVE': { color: 'bg-green-100 text-green-800', text: '✅ Attivo' },
      'PAST_DUE': { color: 'bg-red-100 text-red-800', text: '⚠️ Scaduto' },
      'CANCELED': { color: 'bg-gray-100 text-gray-800', text: '❌ Cancellato' },
      'PAUSED': { color: 'bg-orange-100 text-orange-800', text: '⏸️ In Pausa' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              👤 Dettagli Subscriber
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informazioni Personali */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Informazioni Personali
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                  <p className="text-gray-900 font-medium">
                    {subscriber.first_name} {subscriber.last_name}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{subscriber.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Progetto</label>
                  <p className="text-gray-900 font-medium">{subscriber.project_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Stato Abbonamento</label>
                  <div className="mt-1">
                    {getStatusBadge(subscriber.subscription_status)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Attivo</label>
                  <p className="text-gray-900">
                    {subscriber.is_active ? '✅ Sì' : '❌ No'}
                  </p>
                </div>
              </div>
            </div>

            {/* Informazioni Abbonamento */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Informazioni Abbonamento
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Prezzo Mensile</label>
                  <p className="text-gray-900 font-medium">
                    {subscriber.subscription_price ? `€${subscriber.subscription_price}` : 'Non impostato'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Prossima Fatturazione</label>
                  <p className="text-gray-900">
                    {subscriber.next_billing_date ? formatDate(subscriber.next_billing_date) : 'Non impostata'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Ultimo Pagamento</label>
                  <p className="text-gray-900">
                    {subscriber.last_payment_date ? formatDate(subscriber.last_payment_date) : 'Nessuno'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Stripe Customer ID</label>
                  <p className="text-gray-900 font-mono text-sm">
                    {subscriber.stripe_customer_id || 'Non impostato'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Stripe Subscription ID</label>
                  <p className="text-gray-900 font-mono text-sm">
                    {subscriber.stripe_subscription_id || 'Non impostato'}
                  </p>
                </div>
              </div>
            </div>

            {/* Configurazione Vercel */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Configurazione Vercel
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Edge Config ID</label>
                  <p className="text-gray-900 font-mono text-sm">
                    {subscriber.edge_config_id || 'Non impostato'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Edge Key</label>
                  <p className="text-gray-900 font-mono text-sm">
                    {subscriber.edge_key || 'maintenance'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Vercel Token</label>
                  <p className="text-gray-900 font-mono text-sm">
                    {subscriber.vercel_token ? '••••••••••••••••' : 'Non impostato'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Vercel Team ID</label>
                  <p className="text-gray-900 font-mono text-sm">
                    {subscriber.vercel_team_id || 'Non impostato'}
                  </p>
                </div>
              </div>
            </div>

            {/* Configurazione GitHub */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Configurazione GitHub
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Repository Template</label>
                  <p className="text-gray-900 font-mono text-sm">
                    {subscriber.github_repo_template || 'Non impostato'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Supabase Info</label>
                  <p className="text-gray-900 text-sm">
                    {subscriber.supabase_info || 'Non impostato'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          {subscriber.notes && (
            <div className="mt-6 bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Note
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{subscriber.notes}</p>
            </div>
          )}

          {/* Informazioni Sistema */}
          <div className="mt-6 bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informazioni Sistema
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">ID Subscriber</label>
                <p className="text-gray-900 font-mono text-sm">{subscriber.id}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Data Creazione</label>
                <p className="text-gray-900">{formatDate(subscriber.created_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Ultimo Aggiornamento</label>
                <p className="text-gray-900">
                  {subscriber.updated_at ? formatDate(subscriber.updated_at) : 'Non disponibile'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <div>
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Sei sicuro di voler eliminare il cliente "${subscriber.first_name} ${subscriber.last_name}"?\n\nQuesta azione non può essere annullata.`)) {
                      onDelete(subscriber.id);
                      onClose();
                    }
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🗑️ Elimina Cliente
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
