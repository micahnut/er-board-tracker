import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function toDbPatient(patient) {
  return {
    id: patient.id,
    code: patient.code || '',
    mrn: patient.mrn || '',
    age: patient.age || '',
    sex: patient.sex || '',
    age_sex: patient.ageSex || '',
    complaint: patient.complaint || '',
    impression: patient.impression || '',
    er_bed: patient.erBed || '',
    service: patient.service || '',
    physician: patient.physician || '',
    pgi: patient.pgi || '',
    status: patient.status || 'Consult',
    disposition: patient.disposition || '',
    room: patient.room || '',
    notes: patient.notes || '',
    tasks: patient.tasks || [],
    created_at_ms: patient.createdAt || Date.now(),
    updated_at_ms: patient.updatedAt || Date.now(),
    updated_label: patient.updatedLabel || ''
  };
}

export function fromDbPatient(row) {
  return {
    id: row.id,
    code: row.code || '',
    mrn: row.mrn || '',
    age: row.age || '',
    sex: row.sex || '',
    ageSex: row.age_sex || '',
    complaint: row.complaint || '',
    impression: row.impression || '',
    erBed: row.er_bed || '',
    service: row.service || '',
    physician: row.physician || '',
    pgi: row.pgi || '',
    status: row.status || 'Consult',
    disposition: row.disposition || '',
    room: row.room || '',
    notes: row.notes || '',
    tasks: row.tasks || [],
    createdAt: row.created_at_ms || Date.now(),
    updatedAt: row.updated_at_ms || Date.now(),
    updatedLabel: row.updated_label || ''
  };
}
