import { NextResponse } from 'next/server';
import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 120,
  useClones: false
});

export async function GET() {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    }
  };
  
  return NextResponse.json(status);
} 