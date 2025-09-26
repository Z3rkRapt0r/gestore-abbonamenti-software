"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { ModernSubscriberForm } from "@/components/forms/modern-subscriber-form";
import EditSubscriberModal from "@/components/modals/edit-subscriber-modal";
import SubscriberDetailsModal from "@/components/modals/subscriber-details-modal";
import { Subscriber } from "@/types";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [maintenanceLoading, setMaintenanceLoading] = useState<string | null>(null);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [viewingSubscriber, setViewingSubscriber] = useState<Subscriber | null>(null);

  // Funzione per caricare gli abbonati
  const loadSubscribers = async () => {
    try {
      setLoadingSubscribers(true);
      const response = await fetch('/api/dashboard/subscribers');
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data);
      } else {
        console.error('Errore nel caricamento abbonati');
      }
    } catch (error) {
      console.error('Errore nel caricamento abbonati:', error);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  // Funzione per toggle manutenzione
  const toggleMaintenance = async (subscriberId: string, maintenance: boolean) => {
    try {
      setMaintenanceLoading(subscriberId);
      
      const response = await fetch('/api/dashboard/maintenance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriberId,
          maintenance
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ Errore: ${result.error}`);
        if (result.detail) {
          console.error('Dettagli errore:', result.detail);
        }
      }
    } catch (error) {
      console.error('Errore durante il toggle manutenzione:', error);
      alert('❌ Errore durante l\'operazione di manutenzione');
    } finally {
      setMaintenanceLoading(null);
    }
  };

  // Funzione per aggiornare subscriber dopo modifica
  const handleSubscriberUpdate = (updatedSubscriber: Subscriber) => {
    setSubscribers(prev => 
      prev.map(sub => sub.id === updatedSubscriber.id ? updatedSubscriber : sub)
    );
  };

  // Funzione per eliminare subscriber
  const handleSubscriberDelete = async (subscriberId: string) => {
    try {
      const response = await fetch(`/api/subscribers/${subscriberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        // Rimuovi il subscriber dalla lista
        setSubscribers(prev => prev.filter(sub => sub.id !== subscriberId));
        alert('Cliente eliminato con successo');
      } else {
        alert(`Errore durante l'eliminazione: ${result.error}`);
      }
    } catch (error) {
      console.error('Errore eliminazione subscriber:', error);
      alert('Errore di connessione durante l\'eliminazione');
    }
  };

  // Funzione per creare link di pagamento
  const createPaymentLink = async (subscriberId: string) => {
    try {
      // Crea checkout session
      const checkoutResponse = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriberId,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`
        }),
      });

      const checkoutResult = await checkoutResponse.json();
      
      if (checkoutResult.success) {
        // Invia email con link pagamento
        const emailResponse = await fetch('/api/email/send-payment-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subscriberId,
            checkoutUrl: checkoutResult.checkout_url
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (emailResult.success) {
          alert(`Link di pagamento inviato a ${emailResult.email}`);
          // Ricarica la lista per aggiornare lo stato
          await loadSubscribers();
        } else {
          alert(`Errore invio email: ${emailResult.error}`);
        }
      } else {
        alert(`Errore creazione checkout: ${checkoutResult.error}`);
      }
    } catch (error) {
      console.error('Errore nella creazione link pagamento:', error);
      alert('Errore di connessione');
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/auth/signin");
    else {
      loadSubscribers();
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSubmit = async (data: unknown) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/edge-create-subscriber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert('🎉 Abbonato creato con successo!');
        setShowAddForm(false);
        // Ricarica la lista degli abbonati
        await loadSubscribers();
      } else {
        const error = await response.json();
        alert(`❌ Errore: ${error.error}`);
      }
    } catch (error) {
      console.error('Errore durante la creazione:', error);
      alert('❌ Errore durante la creazione dell\'abbonato');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Moderno */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Gestore Abbonamenti
                </h1>
                <p className="text-sm text-gray-600">Piattaforma di gestione software</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Amministratore</p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push("/settings")}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/50 hover:bg-white/80 rounded-lg transition-all duration-200 border border-gray-200"
                >
                  ⚙️ Impostazioni
                </button>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-lg transition-all duration-200 shadow-lg"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto Principale */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showAddForm ? (
          <>
            {/* Statistiche */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Abbonati Attivi</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loadingSubscribers ? '...' : subscribers.filter(s => s.is_active).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ricavi Mensili</p>
                    <p className="text-2xl font-bold text-gray-900">€0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Progetti Attivi</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Crescita</p>
                    <p className="text-2xl font-bold text-gray-900">+0%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista Abbonati */}
            {subscribers.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">I Tuoi Abbonati</h2>
                  <button
                    onClick={loadSubscribers}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    🔄 Aggiorna
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscribers.map((subscriber) => (
                    <div key={subscriber.id} className="bg-white/50 rounded-xl p-6 border border-white/30">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {subscriber.first_name} {subscriber.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">{subscriber.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subscriber.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscriber.is_active ? 'Attivo' : 'Inattivo'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Progetto:</span> {subscriber.project_name}</p>
                        <p><span className="font-medium">Prezzo:</span> €{subscriber.subscription_price}/mese</p>
                        {subscriber.edge_config_id && (
                          <p><span className="font-medium">Edge Config:</span> ✅ Configurato</p>
                        )}
                      </div>
                      
                      {/* Toggle Manutenzione */}
                {/* Stato Abbonamento */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 mb-2">💳 Stato Abbonamento</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      subscriber.subscription_status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      subscriber.subscription_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      subscriber.subscription_status === 'PAST_DUE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {subscriber.subscription_status === 'ACTIVE' ? '✅ Attivo' :
                       subscriber.subscription_status === 'PENDING' ? '⏳ In Attesa' :
                       subscriber.subscription_status === 'PAST_DUE' ? '⚠️ Scaduto' :
                       '❌ Inattivo'}
                    </span>
                    {subscriber.subscription_status === 'PENDING' && (
                      <button
                        onClick={() => createPaymentLink(subscriber.id)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        📧 Invia Link Pagamento
                      </button>
                    )}
                  </div>
                </div>

                {/* Manutenzione Vercel */}
                {subscriber.edge_config_id && subscriber.vercel_token && subscriber.subscription_status === 'ACTIVE' ? (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-medium text-yellow-800 mb-2">🔧 Manutenzione Vercel</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleMaintenance(subscriber.id, true)}
                        disabled={maintenanceLoading === subscriber.id}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {maintenanceLoading === subscriber.id ? '⏳' : '🚫'} Attiva Manutenzione
                      </button>
                      <button
                        onClick={() => toggleMaintenance(subscriber.id, false)}
                        disabled={maintenanceLoading === subscriber.id}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {maintenanceLoading === subscriber.id ? '⏳' : '✅'} Disattiva Manutenzione
                      </button>
                    </div>
                  </div>
                ) : subscriber.subscription_status !== 'ACTIVE' ? (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600">
                      ⚠️ Manutenzione disponibile solo per abbonamenti attivi
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600">
                      ⚠️ Edge Config non configurato
                    </p>
                  </div>
                )}
                      
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => setEditingSubscriber(subscriber)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors"
                        >
                          Modifica
                        </button>
                        <button 
                          onClick={() => setViewingSubscriber(subscriber)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                        >
                          Dettagli
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Area Principale */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Benvenuto nella Dashboard
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Gestisci i tuoi abbonati, monitora i pagamenti e automatizza i deployment. 
                  Inizia aggiungendo il tuo primo abbonato!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    ✨ Aggiungi Nuovo Abbonato
                  </button>
                  
                  <button 
                    onClick={() => router.push("/settings")}
                    className="px-8 py-4 bg-white/80 text-gray-700 font-semibold rounded-xl hover:bg-white transition-all duration-200 border border-gray-200 shadow-lg hover:shadow-xl"
                  >
                    ⚙️ Configura Impostazioni
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Form di Aggiunta Abbonato */
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Nuovo Abbonato</h2>
                <p className="text-gray-600">Compila i dati per creare un nuovo abbonato</p>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <ModernSubscriberForm 
              onSubmit={handleSubmit} 
              loading={isSubmitting}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}
      </div>

      {/* Modali */}
      <EditSubscriberModal
        isOpen={!!editingSubscriber}
        onClose={() => setEditingSubscriber(null)}
        subscriber={editingSubscriber}
        onUpdate={handleSubscriberUpdate}
      />

      <SubscriberDetailsModal
        isOpen={!!viewingSubscriber}
        onClose={() => setViewingSubscriber(null)}
        subscriber={viewingSubscriber}
        onDelete={handleSubscriberDelete}
      />
    </div>
  );
}
