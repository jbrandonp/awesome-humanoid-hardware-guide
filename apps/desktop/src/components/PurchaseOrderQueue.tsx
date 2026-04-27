import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface InventoryItem {
  name: string;
  moq: number;
}

export interface PurchaseOrderItem {
  quantity: number;
  inventoryItem: InventoryItem;
}

export interface PurchaseOrderDraft {
  id: string;
  createdAt: string;
  supplierId: string;
  items: PurchaseOrderItem[];
}

export function PurchaseOrderQueue({ apiUrl }: { apiUrl: string }) {
  const [drafts, setDrafts] = useState<PurchaseOrderDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      // In a real app we would pass the Auth token here.
      // Assuming GET /procurement/drafts
      const token = await invoke<string>('get_token').catch(() => '');
      const response = await fetch(`${apiUrl}/api/procurement/drafts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setDrafts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [apiUrl]);

  const handleApprove = async (draftId: string, item: PurchaseOrderItem, supplierId: string, quantity: number) => {
    try {
      const token = await invoke<string>('get_token').catch(() => '');
      const response = await fetch(`${apiUrl}/api/procurement/${draftId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity,
          supplierId
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const approvedOrder = await response.json();
      
      // Call Rust backend to generate PDF
      try {
        await invoke('generate_purchase_order_pdf', { orderJson: JSON.stringify(approvedOrder) });
        setFeedbackMessage({ type: 'success', text: 'Commande approuvée et PDF généré avec succès.' });
      } catch (pdfErr: unknown) {
        setFeedbackMessage({ type: 'error', text: `Commande approuvée, mais erreur lors de la génération du PDF: ${pdfErr}` });
      }

      fetchDrafts();
    } catch (err: unknown) {
      setFeedbackMessage({ type: 'error', text: `Erreur d'approbation: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  if (loading) return <div>Chargement des brouillons...</div>;
  if (error) return <div className="text-red-500">Erreur: {error}</div>;

  return (
    <div className="mt-8 p-6 bg-medical-surface rounded-lg shadow-md border border-medical-border">
      <h2 className="text-2xl font-bold mb-4">Commandes en Attente d'Approbation</h2>
      {feedbackMessage && (
        <div className={`p-4 mb-4 rounded ${feedbackMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} role="alert">
          {feedbackMessage.text}
        </div>
      )}
      {drafts.length === 0 ? (
        <p className="text-gray-400">Aucune commande critique à approuver.</p>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => {
            const item = draft.items[0]; // Assuming 1 item
            return (
              <DraftRow 
                key={draft.id} 
                draft={draft} 
                item={item} 
                onApprove={handleApprove} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function DraftRow({ draft, item, onApprove }: { draft: PurchaseOrderDraft, item: PurchaseOrderItem, onApprove: (id: string, item: PurchaseOrderItem, supplierId: string, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [supplierId, setSupplierId] = useState(draft.supplierId);

  return (
    <div className="flex flex-col gap-2 p-4 border border-medical-border rounded bg-slate-800">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-lg">{item.inventoryItem.name}</span>
        <span className="text-sm text-gray-400">Date: {new Date(draft.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="flex gap-4 items-end mt-2">
        <div className="flex flex-col">
          <label className="text-sm text-gray-400">Quantité</label>
          <input 
            type="number" 
            value={quantity} 
            onChange={e => setQuantity(Number(e.target.value))} 
            className="px-2 py-1 bg-slate-700 rounded text-white border border-slate-600 focus:outline-none focus:border-medical-primary"
            min={item.inventoryItem.moq}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-400">Fournisseur ID</label>
          <input 
            type="text" 
            value={supplierId} 
            onChange={e => setSupplierId(e.target.value)} 
            className="px-2 py-1 bg-slate-700 rounded text-white border border-slate-600 focus:outline-none focus:border-medical-primary w-64"
          />
        </div>
        <button 
          onClick={() => onApprove(draft.id, item, supplierId, quantity)}
          className="ml-auto bg-medical-primary hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          Approuver & Générer PDF
        </button>
      </div>
    </div>
  );
}
