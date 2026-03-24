import { v4 as uuidv4 } from 'uuid';

export interface DupeRecord {
  id: string;
  original_product: string;
  dupe_product: string;
  price_comparison: string;
  similarity_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

const store: DupeRecord[] = [];

export function insertDupe(input: {
  original_product: string;
  dupe_product: string;
  price_comparison: string;
  similarity_reason: string;
}): DupeRecord {
  const now = new Date().toISOString();
  const row: DupeRecord = {
    id: uuidv4(),
    ...input,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };
  store.push(row);
  return row;
}

export function listDupes(params: {
  status?: string;
  page: number;
  itemsPerPage: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
}): { items: DupeRecord[]; total: number; page: number; totalPages: number } {
  let rows = [...store];

  if (params.status) {
    rows = rows.filter((r) => r.status === params.status);
  }

  if (params.search.trim()) {
    const q = params.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.original_product.toLowerCase().includes(q) ||
        r.dupe_product.toLowerCase().includes(q) ||
        r.similarity_reason.toLowerCase().includes(q)
    );
  }

  const dir = params.sortOrder === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    if (params.sortBy === 'status') {
      return a.status.localeCompare(b.status) * dir;
    }
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
  });

  const total = rows.length;
  const offset = (params.page - 1) * params.itemsPerPage;
  const items = rows.slice(offset, offset + params.itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(total / params.itemsPerPage));

  return {
    items,
    total,
    page: params.page,
    totalPages,
  };
}

export function updateDupeStatus(id: string, status: DupeRecord['status']): DupeRecord[] {
  const now = new Date().toISOString();
  const updated: DupeRecord[] = [];
  for (const row of store) {
    if (row.id === id) {
      row.status = status;
      row.updated_at = now;
      updated.push({ ...row });
    }
  }
  return updated;
}

export function bulkUpdateStatus(ids: string[], status: DupeRecord['status']): DupeRecord[] {
  const now = new Date().toISOString();
  const idSet = new Set(ids);
  const updated: DupeRecord[] = [];
  for (const row of store) {
    if (idSet.has(row.id)) {
      row.status = status;
      row.updated_at = now;
      updated.push({ ...row });
    }
  }
  return updated;
}
