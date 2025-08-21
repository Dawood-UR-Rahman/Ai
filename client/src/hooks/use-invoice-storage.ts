import { useState, useEffect } from 'react';
import { InvoiceWithLineItems } from '@shared/schema';

const STORAGE_KEY = 'invoice-generator-drafts';

export function useInvoiceStorage() {
  const [drafts, setDrafts] = useState<InvoiceWithLineItems[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDrafts(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse stored drafts:', error);
      }
    }
  }, []);

  const saveDraft = (invoice: InvoiceWithLineItems) => {
    const updatedDrafts = drafts.filter(d => d.id !== invoice.id);
    updatedDrafts.push({ ...invoice, status: 'draft' });
    setDrafts(updatedDrafts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDrafts));
  };

  const removeDraft = (invoiceId: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== invoiceId);
    setDrafts(updatedDrafts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDrafts));
  };

  const getDraft = (invoiceId: string) => {
    return drafts.find(d => d.id === invoiceId);
  };

  return {
    drafts,
    saveDraft,
    removeDraft,
    getDraft,
  };
}
