"use client";

import { useState } from 'react';
import { CreateSubscriberData } from '@/types';
import { validateEmail, validateRequired } from '@/utils';

interface CreateSubscriberFormProps {
  onSubmit: (data: CreateSubscriberData) => Promise<void>;
  loading?: boolean;
}

export function CreateSubscriberForm({ onSubmit, loading = false }: CreateSubscriberFormProps) {
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

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
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
    } catch (error) {
      console.error('Errore durante la creazione dell\'abbonato:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
            Nome *
          </label>
          <input
            type="text"
            name="first_name"
            id="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              errors.first_name ? 'border-red-300' : ''
            }`}
            placeholder="Mario"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
            Cognome *
          </label>
          <input
            type="text"
            name="last_name"
            id="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              errors.last_name ? 'border-red-300' : ''
            }`}
            placeholder="Rossi"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.email ? 'border-red-300' : ''
          }`}
          placeholder="mario.rossi@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="project_name" className="block text-sm font-medium text-gray-700">
          Nome Progetto/Azienda *
        </label>
        <input
          type="text"
          name="project_name"
          id="project_name"
          value={formData.project_name}
          onChange={handleInputChange}
          className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.project_name ? 'border-red-300' : ''
          }`}
          placeholder="Azienda Mario Rossi"
        />
        {errors.project_name && (
          <p className="mt-1 text-sm text-red-600">{errors.project_name}</p>
        )}
      </div>

      <div>
        <label htmlFor="github_repo_template" className="block text-sm font-medium text-gray-700">
          Template Repository GitHub *
        </label>
        <input
          type="text"
          name="github_repo_template"
          id="github_repo_template"
          value={formData.github_repo_template}
          onChange={handleInputChange}
          className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.github_repo_template ? 'border-red-300' : ''
          }`}
          placeholder="gestore-abbonamenti-software"
        />
        <p className="mt-1 text-sm text-gray-500">
          Nome del repository template da clonare (senza il nome utente)
        </p>
        {errors.github_repo_template && (
          <p className="mt-1 text-sm text-red-600">{errors.github_repo_template}</p>
        )}
      </div>

      <div>
        <label htmlFor="vercel_token" className="block text-sm font-medium text-gray-700">
          Token Vercel del Cliente *
        </label>
        <input
          type="password"
          name="vercel_token"
          id="vercel_token"
          value={formData.vercel_token}
          onChange={handleInputChange}
          className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            errors.vercel_token ? 'border-red-300' : ''
          }`}
          placeholder="vercel_xxx_xxx"
        />
        {errors.vercel_token && (
          <p className="mt-1 text-sm text-red-600">{errors.vercel_token}</p>
        )}
      </div>

      <div>
        <label htmlFor="vercel_team_id" className="block text-sm font-medium text-gray-700">
          Team ID Vercel (opzionale)
        </label>
        <input
          type="text"
          name="vercel_team_id"
          id="vercel_team_id"
          value={formData.vercel_team_id}
          onChange={handleInputChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="team_xxx"
        />
      </div>

      <div>
        <label htmlFor="supabase_info" className="block text-sm font-medium text-gray-700">
          Info Database Supabase (opzionale)
        </label>
        <textarea
          name="supabase_info"
          id="supabase_info"
          rows={3}
          value={formData.supabase_info}
          onChange={handleInputChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Informazioni aggiuntive sul database..."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="subscription_price" className="block text-sm font-medium text-gray-700">
            Prezzo Sottoscrizione (€) *
          </label>
          <input
            type="number"
            name="subscription_price"
            id="subscription_price"
            min="0"
            step="0.01"
            value={formData.subscription_price}
            onChange={handleInputChange}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              errors.subscription_price ? 'border-red-300' : ''
            }`}
            placeholder="29.99"
          />
          {errors.subscription_price && (
            <p className="mt-1 text-sm text-red-600">{errors.subscription_price}</p>
          )}
        </div>

        <div>
          <label htmlFor="subscription_type" className="block text-sm font-medium text-gray-700">
            Tipo Sottoscrizione
          </label>
          <select
            name="subscription_type"
            id="subscription_type"
            value={formData.subscription_type}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="monthly">Mensile</option>
            <option value="yearly">Annuale</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Creazione...' : 'Crea Abbonato'}
        </button>
      </div>
    </form>
  );
}

