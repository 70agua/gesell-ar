// ============================================================
//  src/lib/supabase.js
//  Conexión central a Supabase — importar desde cualquier archivo
// ============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wxuvexwcypgzlboasdvx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vRei2o9O5s_d3Bf8z3daSA_GwlBNO46';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);