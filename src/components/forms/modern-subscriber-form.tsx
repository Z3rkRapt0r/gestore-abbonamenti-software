"use client";

import { useState } from 'react';
import { CreateSubscriberData } from '@/types';
import { validateEmail, validateRequired } from '@/utils';

interface ModernSubscriberFormProps {
  // Accetta il payload camelCase inviato all'API semplificata
  onSubmit: (data: unknown) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

export function ModernSubscriberForm({ onSubmit, loading = false, onCancel }: ModernSubscriberFormProps) {
  const [formData, setFormData] = useState<CreateSubscriberData>({
    first_name: '',
    last_name: '',
    email: '',
    project_name: '',
    github_repo_template: '',
    vercel_token: '',
    vercel_team_id: '',
    supabase_info: '',
    custom_config: {},
    subscription_price: 0,
    subscription_type: 'monthly',
  });

  // Campi opzionali per Edge Config (salvati dentro custom_config)
  const [edgeConfigId, setEdgeConfigId] = useState<string>("");
  const [edgeKey, setEdgeKey] = useState<string>("maintenance");
  
  // Stato abbonamento (default: PENDING)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'PENDING' | 'ACTIVE'>('PENDING');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      // Validazione Step 1: Dati Personali
      if (!validateRequired(formData.first_name)) {
        newErrors.first_name = 'Il nome è obbligatorio';
      }

      if (!validateRequired(formData.last_name)) {
        newErrors.last_name = 'Il cognome è obbligatorio';
      }

      if (!validateRequired(formData.email)) {
        newErrors.email = 'L\'email è obbligatoria';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'L\'email non è valida';
      }

      if (!validateRequired(formData.project_name)) {
        newErrors.project_name = 'Il nome del progetto è obbligatorio';
      }
    } else if (currentStep === 2) {
      // Validazione Step 2: Configurazione
      if (!validateRequired(formData.github_repo_template)) {
        newErrors.github_repo_template = 'Il template GitHub è obbligatorio';
      }

      if (!validateRequired(formData.vercel_token)) {
        newErrors.vercel_token = 'Il token Vercel è obbligatorio';
      }

      if (!validateRequired(formData.vercel_team_id)) {
        newErrors.vercel_team_id = 'Il Team ID Vercel è obbligatorio';
      }

      if (formData.subscription_price <= 0) {
        newErrors.subscription_price = 'Il prezzo deve essere maggiore di 0';
      }
    }
    // Step 3 non ha validazioni obbligatorie

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(formData.first_name)) {
      newErrors.first_name = 'Il nome è obbligatorio';
    }

    if (!validateRequired(formData.last_name)) {
      newErrors.last_name = 'Il cognome è obbligatorio';
    }

    if (!validateRequired(formData.email)) {
      newErrors.email = 'L\'email è obbligatoria';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'L\'email non è valida';
    }

    if (!validateRequired(formData.project_name)) {
      newErrors.project_name = 'Il nome del progetto è obbligatorio';
    }

    if (!validateRequired(formData.github_repo_template)) {
      newErrors.github_repo_template = 'Il template del repository è obbligatorio';
    }

    if (!validateRequired(formData.vercel_token)) {
      newErrors.vercel_token = 'Il token Vercel è obbligatorio';
    }

    if (formData.subscription_price <= 0) {
      newErrors.subscription_price = 'Il prezzo deve essere maggiore di 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se non siamo all'ultimo step, vai al prossimo
    if (currentStep < totalSteps) {
      if (!validateCurrentStep()) {
        return;
      }
      nextStep();
      return;
    }
    
    // Se siamo all'ultimo step, valida tutto e invia
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email,
        projectName: formData.project_name,
        githubRepoTemplate: formData.github_repo_template,
        vercelToken: formData.vercel_token,
        vercelTeamId: formData.vercel_team_id,
        subscriptionPrice: formData.subscription_price,
        supabaseInfo: formData.supabase_info,
        customConfig: formData.custom_config,
        edgeConfigId: edgeConfigId || undefined,
        edgeKey: edgeKey || 'maintenance',
        subscriptionStatus: subscriptionStatus,
      };

      // Usa l'endpoint Edge per la creazione
      const response = await fetch('/api/edge-create-subscriber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Errore nella creazione del subscriber');
      }

      // Chiama la callback per aggiornare la dashboard
      await onSubmit(result);
      // Reset form on success
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        project_name: '',
        github_repo_template: '',
        vercel_token: '',
        vercel_team_id: '',
        supabase_info: '',
        custom_config: {},
        subscription_price: 0,
        subscription_type: 'monthly',
      });
      setEdgeConfigId("");
      setEdgeKey("maintenance");
      setSubscriptionStatus('PENDING');
      setCurrentStep(1);
    } catch (error) {
      console.error('Errore durante la creazione dell\'abbonato:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      project_name: '',
      github_repo_template: '',
      vercel_token: '',
      vercel_team_id: '',
      supabase_info: '',
      custom_config: {},
      subscription_price: 0,
      subscription_type: 'monthly',
    });
    setCurrentStep(1);
    setErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Informazioni Abbonato</h3>
          <span className="text-sm text-gray-500">Passo {currentStep} di {totalSteps}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Dati Personali */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Dati Personali</h3>
              <p className="text-gray-600">Inserisci le informazioni di base del cliente</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  Nome *
                </label>
                <input
                  type="text"
                  name="first_name"
                  id="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                    errors.first_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mario"
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Cognome *
                </label>
                <input
                  type="text"
                  name="last_name"
                  id="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                    errors.last_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Rossi"
                />
                {errors.last_name && (
                  <p className="text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="mario.rossi@azienda.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="project_name" className="block text-sm font-medium text-gray-700">
                Nome Progetto/Azienda *
              </label>
              <input
                type="text"
                name="project_name"
                id="project_name"
                value={formData.project_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                  errors.project_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Azienda Rossi SRL"
              />
              {errors.project_name && (
                <p className="text-sm text-red-600">{errors.project_name}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Configurazione Tecnica */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Configurazione Tecnica</h3>
              <p className="text-gray-600">Imposta i parametri per GitHub e Vercel</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="github_repo_template" className="block text-sm font-medium text-gray-700">
                Template GitHub *
              </label>
              <input
                type="text"
                name="github_repo_template"
                id="github_repo_template"
                value={formData.github_repo_template}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                  errors.github_repo_template ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="gestore-abbonamenti-software"
              />
              <p className="text-xs text-gray-500">Slug del repository template da clonare</p>
              {errors.github_repo_template && (
                <p className="text-sm text-red-600">{errors.github_repo_template}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="vercel_token" className="block text-sm font-medium text-gray-700">
                  Token Vercel *
                </label>
                <input
                  type="password"
                  name="vercel_token"
                  id="vercel_token"
                  value={formData.vercel_token}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                    errors.vercel_token ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="vercel_xxxxxxxxxxxx"
                />
                {errors.vercel_token && (
                  <p className="text-sm text-red-600">{errors.vercel_token}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="vercel_team_id" className="block text-sm font-medium text-gray-700">
                  Team ID Vercel (opzionale)
                </label>
                <input
                  type="text"
                  name="vercel_team_id"
                  id="vercel_team_id"
                  value={formData.vercel_team_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="team_xxxxxxxxxxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="subscription_price" className="block text-sm font-medium text-gray-700">
                  Prezzo Sottoscrizione (€) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input
                    type="number"
                    name="subscription_price"
                    id="subscription_price"
                    min="0"
                    step="0.01"
                    value={formData.subscription_price}
                    onChange={handleInputChange}
                    className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                      errors.subscription_price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="29.99"
                  />
                </div>
                {errors.subscription_price && (
                  <p className="text-sm text-red-600">{errors.subscription_price}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="subscription_type" className="block text-sm font-medium text-gray-700">
                  Tipo Sottoscrizione
                </label>
                <select
                  name="subscription_type"
                  id="subscription_type"
                  value={formData.subscription_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                >
                  <option value="monthly">Mensile</option>
                  <option value="yearly">Annuale</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Stato Abbonamento
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="subscription_status"
                    value="PENDING"
                    checked={subscriptionStatus === 'PENDING'}
                    onChange={(e) => setSubscriptionStatus(e.target.value as 'PENDING' | 'ACTIVE')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">⏳ In Attesa</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="subscription_status"
                    value="ACTIVE"
                    checked={subscriptionStatus === 'ACTIVE'}
                    onChange={(e) => setSubscriptionStatus(e.target.value as 'PENDING' | 'ACTIVE')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">✅ Attivo</span>
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Seleziona "In Attesa" per nuovi clienti che devono ancora pagare, "Attivo" per clienti già paganti.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Configurazioni Aggiuntive */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Configurazioni Aggiuntive</h3>
              <p className="text-gray-600">Parametri opzionali per personalizzare il progetto</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="supabase_info" className="block text-sm font-medium text-gray-700">
                Info Database Supabase
              </label>
              <textarea
                name="supabase_info"
                id="supabase_info"
                rows={3}
                value={formData.supabase_info}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none"
                placeholder="Informazioni aggiuntive sul database Supabase del cliente..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="custom_config" className="block text-sm font-medium text-gray-700">
                Configurazione Personalizzata
              </label>
              <textarea
                name="custom_config"
                id="custom_config"
                rows={3}
                value={typeof formData.custom_config === 'string' ? formData.custom_config : JSON.stringify(formData.custom_config, null, 2)}
                onChange={(e) => handleInputChange({ ...e, target: { ...e.target, name: 'custom_config', value: e.target.value } })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none font-mono text-sm"
                placeholder="Variabili ambiente o configurazioni specifiche del progetto..."
              />
            </div>

            {/* Edge Config per manutenzione 1-click */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="edge_config_id" className="block text-sm font-medium text-gray-700">
                  Edge Config ID (ecfg_…)
                </label>
                <input
                  type="text"
                  id="edge_config_id"
                  value={edgeConfigId}
                  onChange={(e) => setEdgeConfigId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm font-mono"
                  placeholder="ecfg_xxxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-gray-500">ID Edge Config del progetto Vercel del cliente (Storage → Edge Config).</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="edge_key" className="block text-sm font-medium text-gray-700">
                  Edge Key (default: maintenance)
                </label>
                <input
                  type="text"
                  id="edge_key"
                  value={edgeKey}
                  onChange={(e) => setEdgeKey(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="maintenance"
                />
              <p className="text-xs text-gray-500">Chiave booleana letta dalla guard; lascia &quot;maintenance&quot; se non ti serve personalizzarla.</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 text-gray-700 bg-white/80 hover:bg-white border border-gray-300 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                ← Indietro
              </button>
            )}
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200"
            >
              🔄 Cancella
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-gray-700 bg-red-100 hover:bg-red-200 rounded-xl font-medium transition-all duration-200"
              >
                ❌ Annulla
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creazione...</span>
                </>
              ) : currentStep < totalSteps ? (
                <>
                  <span>Avanti →</span>
                </>
              ) : (
                <>
                  <span>✨ Crea Abbonato</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
