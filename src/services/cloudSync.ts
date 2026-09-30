/**
 * TULA - Unified Legal Metrology Platform
 * Cloud Data & Backend Synchronization Service
 * 
 * Coordinates real-time sync between:
 * - Local Storage (instant offline-first cache)
 * - Supabase PostgreSQL (cloud persistence)
 * - Google Gemini AI (regulatory scrutiny and assistant)
 */

import { supabase, isSupabaseConfigured, checkSupabaseConnection } from './supabase';
import { testGeminiConnection, isGeminiConfigured } from './gemini';
import { Instrument, Application, VerificationCertificate } from '../types';

export interface CloudStatus {
  supabase: {
    configured: boolean;
    connected: boolean;
    tablesExist: boolean;
    projectUrl: string;
    message: string;
  };
  gemini: {
    configured: boolean;
    connected: boolean;
    model: string;
    message: string;
  };
}

export async function getCloudServicesStatus(): Promise<CloudStatus> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
  
  // Test Supabase
  let supabaseResult: { ok: boolean; tablesExist: boolean; message: string } = {
    ok: false,
    tablesExist: false,
    message: 'Not configured'
  };
  if (isSupabaseConfigured) {
    const res = await checkSupabaseConnection();
    supabaseResult = {
      ok: res.ok,
      tablesExist: Boolean(res.tablesExist),
      message: res.message
    };
  }

  // Test Gemini
  let geminiResult: { ok: boolean; message: string; model: string } = {
    ok: false,
    message: 'Not configured',
    model: 'gemini-3.5-flash'
  };
  if (isGeminiConfigured) {
    const res = await testGeminiConnection();
    geminiResult = {
      ok: res.ok,
      message: res.message,
      model: res.model || 'gemini-3.5-flash'
    };
  }


  return {
    supabase: {
      configured: isSupabaseConfigured,
      connected: supabaseResult.ok,
      tablesExist: Boolean(supabaseResult.tablesExist),
      projectUrl: supabaseUrl,
      message: supabaseResult.message
    },
    gemini: {
      configured: isGeminiConfigured,
      connected: geminiResult.ok,
      model: geminiResult.model || 'gemini-3.5-flash',
      message: geminiResult.message
    }
  };
}

/**
 * Sync instruments from Supabase if table exists, otherwise return null
 */
export async function fetchInstrumentsFromCloud(): Promise<Instrument[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase.from('instruments').select('*').limit(100);
    if (error || !data) return null;
    return data as Instrument[];
  } catch {
    return null;
  }
}

/**
 * Sync an instrument to Supabase
 */
export async function pushInstrumentToCloud(instrument: Instrument): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from('instruments').upsert(instrument);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Sync an application to Supabase
 */
export async function pushApplicationToCloud(application: Application): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from('applications').upsert(application);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Sync a certificate to Supabase
 */
export async function pushCertificateToCloud(certificate: VerificationCertificate): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from('certificates').upsert(certificate);
    return !error;
  } catch {
    return false;
  }
}
