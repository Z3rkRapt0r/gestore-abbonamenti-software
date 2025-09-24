"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { CreateSubscriberForm } from '@/components/forms/create-subscriber-form';
import { CreateSubscriberData } from '@/types';

export default function NewSubscriber() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Caricamento...</div>;
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  const handleSubmit = async (data: CreateSubscriberData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/simple-subscriber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Abbonato creato con successo!');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error('Errore durante la creazione:', error);
      alert('Errore durante la creazione dell\'abbonato');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Nuovo Abbonato
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 mr-4"
              >
                Torna alla Dashboard
              </button>
              <span className="text-gray-700">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Crea Nuovo Abbonato
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Inserisci i dati del nuovo abbonato. Il sistema creerà automaticamente il repository GitHub, 
                il deployment Vercel e la sottoscrizione Stripe.
              </p>

              <CreateSubscriberForm 
                onSubmit={handleSubmit} 
                loading={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
