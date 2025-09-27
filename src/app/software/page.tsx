"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import { Software } from "@/types";

export default function SoftwarePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [software, setSoftware] = useState<Software[]>([]);
  const [loadingSoftware, setLoadingSoftware] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<Software | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    github_repo_template: "",
    github_token: "",
    payment_template_subject: "Completa il pagamento per {software_name}",
    payment_template_body: "Ciao {first_name},\n\nPer completare l'abbonamento a {software_name}, clicca sul link qui sotto:\n\n{payment_link}\n\nCordiali saluti,\nIl team di {software_name}",
    is_active: true,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/auth/signin");
    loadSoftware();
  }, [user, loading, router]);

  const loadSoftware = async () => {
    try {
      const response = await fetch("/api/software");
      if (response.ok) {
        const result = await response.json();
        setSoftware(result.software || []);
      }
    } catch (error) {
      console.error("Errore nel caricamento software:", error);
    } finally {
      setLoadingSoftware(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingSoftware ? `/api/software/${editingSoftware.id}` : "/api/software";
      const method = editingSoftware ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(editingSoftware ? "✅ Software aggiornato!" : "✅ Software creato!");
        setShowForm(false);
        setEditingSoftware(null);
        resetForm();
        loadSoftware();
      } else {
        alert(`❌ Errore: ${result.error}`);
      }
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("❌ Errore durante il salvataggio");
    }
  };

  const handleEdit = (software: Software) => {
    setEditingSoftware(software);
    setFormData({
      name: software.name,
      description: software.description || "",
      github_repo_template: software.github_repo_template,
      github_token: software.github_token,
      payment_template_subject: software.payment_template_subject,
      payment_template_body: software.payment_template_body,
      is_active: software.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo software?")) return;
    
    try {
      const response = await fetch(`/api/software/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      
      if (result.success) {
        alert("✅ Software eliminato!");
        loadSoftware();
      } else {
        alert(`❌ Errore: ${result.error}`);
      }
    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
      alert("❌ Errore durante l'eliminazione");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      github_repo_template: "",
      github_token: "",
      payment_template_subject: "Completa il pagamento per {software_name}",
      payment_template_body: "Ciao {first_name},\n\nPer completare l'abbonamento a {software_name}, clicca sul link qui sotto:\n\n{payment_link}\n\nCordiali saluti,\nIl team di {software_name}",
      is_active: true,
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSoftware(null);
    resetForm();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Caricamento...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🛠️ Gestione Software
          </h1>
          <p className="text-gray-600">
            Configura i software che puoi offrire ai tuoi clienti
          </p>
        </div>

        {/* Add Software Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Aggiungi Software
          </button>
        </div>

        {/* Software List */}
        {loadingSoftware ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {software.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.description || "Nessuna descrizione"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Repository:</span>
                    <span className="ml-2 text-gray-600 truncate block">{item.github_repo_template}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Token GitHub:</span>
                    <span className="ml-2 text-gray-600">••••••••••••••••</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingSoftware ? "Modifica Software" : "Aggiungi Software"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Software *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="es. MyApp Pro"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrizione
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Breve descrizione del software"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repository Template GitHub *
                    </label>
                    <input
                      type="url"
                      value={formData.github_repo_template}
                      onChange={(e) => setFormData({...formData, github_repo_template: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://github.com/username/template-repo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token GitHub *
                    </label>
                    <input
                      type="password"
                      value={formData.github_token}
                      onChange={(e) => setFormData({...formData, github_token: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Oggetto Email Pagamento *
                    </label>
                    <input
                      type="text"
                      value={formData.payment_template_subject}
                      onChange={(e) => setFormData({...formData, payment_template_subject: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Completa il pagamento per {software_name}"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usa {"{software_name}"}, {"{first_name}"} per personalizzare
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Corpo Email Pagamento *
                    </label>
                    <textarea
                      value={formData.payment_template_body}
                      onChange={(e) => setFormData({...formData, payment_template_body: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ciao {first_name}, ..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usa {"{software_name}"}, {"{first_name}"}, {"{payment_link}"} per personalizzare
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                      Software attivo
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                    >
                      {editingSoftware ? "Aggiorna" : "Crea"} Software
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                    >
                      Annulla
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
