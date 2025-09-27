"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";

interface Configuration {
  id: string;
  // CamelCase fields (local form shape)
  githubToken?: string;
  githubUsername?: string;
  createdAt?: string;
  updatedAt?: string;
  maintenanceDeploymentId?: string;
  // Snake_case fields (API response shape)
  github_token?: string;
  github_username?: string;
  updated_at?: string;
  maintenance_deployment_id?: string;
}

export default function Settings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [formData, setFormData] = useState({
    githubToken: "",
    githubUsername: "",
    maintenanceDeploymentId: "",
  });

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/auth/signin");

    fetchConfiguration();
  }, [user, loading, router]);

  const fetchConfiguration = async () => {
    try {
      const response = await fetch("/api/save-config");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.config) {
          setConfig(result.config);
          setFormData({
            githubToken: result.config.github_token || "",
            githubUsername: result.config.github_username || "",
            maintenanceDeploymentId: result.config.maintenance_deployment_id || "",
          });
        }
      }
    } catch (error) {
      console.error("Errore nel recupero configurazione:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/save-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setConfig(result.config);
        alert("✅ Configurazione salvata con successo!");
      } else {
        alert(`❌ Errore: ${result.error}`);
      }
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("❌ Errore durante il salvataggio della configurazione");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Caricamento...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Moderno */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Impostazioni
                </h1>
                <p className="text-sm text-gray-600">Configurazione API e servizi</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Amministratore</p>
              </div>
              
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/50 hover:bg-white/80 rounded-lg transition-all duration-200 border border-gray-200"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto Principale */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurazione API</h2>
            <p className="text-gray-600">Configura i token per l&apos;integrazione con GitHub e Stripe</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* GitHub Configuration */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">GitHub</h3>
                </div>
                {config && (config.github_username || config.githubUsername) && (
                  <div className="flex items-center text-green-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Configurato
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="githubToken" className="block text-sm font-medium text-gray-700">
                    GitHub Token *
                  </label>
                  <input
                    type="password"
                    id="githubToken"
                    value={formData.githubToken}
                    onChange={(e) => handleInputChange("githubToken", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Token GitHub con permessi di creazione repository
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="githubUsername" className="block text-sm font-medium text-gray-700">
                    GitHub Username *
                  </label>
                  <input
                    type="text"
                    id="githubUsername"
                    value={formData.githubUsername}
                    onChange={(e) => handleInputChange("githubUsername", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="tuo-username"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Username GitHub dell&apos;account admin
                  </p>
                </div>
              </div>
            </div>


            {/* Maintenance Deployment */}
            <div className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Maintenance Deployment</h3>
                </div>
                {formData.maintenanceDeploymentId && (
                  <div className="text-xs text-gray-600">
                    ID: <span className="font-mono">{formData.maintenanceDeploymentId}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="maintenanceDeploymentId" className="block text-sm font-medium text-gray-700">
                  Deployment ID globale
                </label>
                <input
                  type="text"
                  id="maintenanceDeploymentId"
                  value={formData.maintenanceDeploymentId}
                  onChange={(e) => handleInputChange("maintenanceDeploymentId", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm font-mono"
                  placeholder="dpl_abc123..."
                />
                <p className="text-xs text-gray-500">
                  Usato come fallback per mettere in pausa tutti i progetti: i domini verranno spostati qui.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <>
                    <span>💾 Salva Configurazione</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {config && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-green-900">Configurazione Salvata</h4>
              </div>
              <div className="text-sm text-green-800">
                <p><strong>GitHub Username:</strong> {config.github_username || config.githubUsername}</p>
                <p><strong>Ultimo aggiornamento:</strong> {config.updated_at ? new Date(config.updated_at).toLocaleString('it-IT') : (config.updatedAt ? new Date(config.updatedAt).toLocaleString('it-IT') : 'N/A')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
