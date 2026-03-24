import { randomUUID } from 'crypto';

export interface EmbeddingRecord {
  id: string;
  imageUrl: string;
  brand?: string | null;
  price?: number | null;
  material?: string | null;
  embedding: number[];
}

declare global {
  // eslint-disable-next-line no-var
  var __threadTwinEmbeddingStore: EmbeddingRecord[] | undefined;
}

function getStore(): EmbeddingRecord[] {
  if (!globalThis.__threadTwinEmbeddingStore) {
    globalThis.__threadTwinEmbeddingStore = [];
  }
  return globalThis.__threadTwinEmbeddingStore;
}

export function memoryEmbeddingCreate(data: Omit<EmbeddingRecord, 'id'>): EmbeddingRecord {
  const row: EmbeddingRecord = { ...data, id: randomUUID() };
  getStore().push(row);
  return row;
}

export function memoryEmbeddingFindAll(): EmbeddingRecord[] {
  return [...getStore()];
}
