/**
 * =========================================================================
 * ACADEMIX SENA - Realtime Engine & Supabase Storage Integration (Vanilla JS)
 * Standalone HTML5 / ES6 Web Application for GitHub Pages & Local Hosting
 * =========================================================================
 */

// Supabase Connection Credentials (Real project database)
const SUPABASE_URL = 'https://gusbmqyaiacyllexfkkc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rCcY7oDdFQ7up5W4QGuACA_zdHJezBo';

let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (typeof window !== 'undefined') {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabaseClient;
      } catch (e) {
        console.warn('Error inicializando window.supabase:', e);
      }
    }
  }
  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return supabaseClient;
    } catch (e) {
      console.warn('Error inicializando supabase:', e);
    }
  }
  return null;
}

// Resilient direct REST API fetch for Supabase (100% reliable)
async function supabaseRestFetch(endpoint, query = '') {
  try {
    const fullUrl = `${SUPABASE_URL}/rest/v1/${endpoint}${query ? (query.startsWith('?') ? query : '?' + query) : ''}`;
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      console.warn(`Supabase REST fetch status ${response.status} en ${endpoint}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.warn(`Supabase REST fetch network error en ${endpoint}:`, err);
    return null;
  }
}

async function supabaseRestUpsert(table, payload, onConflict = '') {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (err) {
    console.warn(`Supabase REST upsert error en ${table}:`, err);
    return false;
  }
}

// Default Initial Competencias with RAPs
const SEED_COMPETENCIAS = [
  {
    codigo: '220501096',
    nombre: 'Desarrollar la estructura de datos y la lógica del software según especificaciones técnicas',
    horas: 180,
    estado: 'Activo',
    resultados: [
      { id: 'RAP1', codigo: 'RAP-01', descripcion: 'Diseñar la base de datos relacional y definir modelos de entidad relación de acuerdo a los requerimientos del sistema.' },
      { id: 'RAP2', codigo: 'RAP-02', descripcion: 'Construir la capa de persistencia mediante consultas SQL optimizadas y procedimientos almacenados.' },
      { id: 'RAP4', codigo: 'RAP-04', descripcion: 'Integrar componentes interactivos y gestionar consumo de servicios web API REST.' }
    ]
  },
  {
    codigo: '220501097',
    nombre: 'Implementar la arquitectura frontend según lineamientos de diseño y experiencia de usuario',
    horas: 160,
    estado: 'Activo',
    resultados: [
      { id: 'RAP3', codigo: 'RAP-03', descripcion: 'Maquetar interfaces de usuario accesibles y adaptables a diferentes pantallas y resoluciones.' }
    ]
  },
  {
    codigo: '220501095',
    nombre: 'Diseñar la solución de software de acuerdo con los procedimientos y requisitos técnicos',
    horas: 140,
    estado: 'Activo',
    resultados: [
      { id: 'RAP5', codigo: 'RAP-05', descripcion: 'Elaborar prototipos de interfaz de usuario y especificaciones de diseño aplicando heurísticas de usabilidad.' }
    ]
  }
];

// Standard curriculum evaluation activities
const DEFAULT_ACTIVITIES = [
  {
    id: 'act-01',
    codigo: 'GA4-220501096-AA2-EV01',
    nombre: 'Interfaz interactiva y consumo de API REST con React y TypeScript',
    tipo: 'De Producto (Código Fuente)',
    competenciaCodigo: '220501096',
    rapCodigo: 'RAP-04',
    fechaLimite: '2026-05-25',
  },
  {
    id: 'act-02',
    codigo: 'GA4-220501096-AA1-EV02',
    nombre: 'Diseño de arquitectura de software y diagramas de componentes',
    tipo: 'De Conocimiento (Informe Técnico)',
    competenciaCodigo: '220501096',
    rapCodigo: 'RAP-01',
    fechaLimite: '2026-05-10',
  },
  {
    id: 'act-03',
    codigo: 'GA4-220501097-AA1-EV01',
    nombre: 'Script DDL/DML de base de datos relacional y políticas de seguridad',
    tipo: 'De Desempeño (Sustentación BD)',
    competenciaCodigo: '220501097',
    rapCodigo: 'RAP-02',
    fechaLimite: '2026-04-28',
  },
  {
    id: 'act-04',
    codigo: 'GA3-220501095-AA3-EV01',
    nombre: 'Prototipo UI/UX en Figma con guía de estilos y pruebas de usabilidad',
    tipo: 'De Producto (Figma & Rúbrica)',
    competenciaCodigo: '220501095',
    rapCodigo: 'RAP-05',
    fechaLimite: '2026-04-15',
  },
];

// Global Application State (Initialized with real Supabase data structure)
const APP_STATE = {
  isLoggedIn: false,
  currentUserRole: 'instructor', // 'instructor' | 'aprendiz' | 'admin'
  currentUserNombre: 'Zahedys Manuel Rodriguez Villarreal',
  currentUserDoc: '8787499',
  
  // Fichas
  fichas: [
    {
      id: 'd95065f7-9a39-49e2-8424-8141283c2ff8',
      codigo: '3532730',
      programa: 'Análisis y Desarrollo de Software ADSO',
      jornada: 'Jornada Mixta',
      ambiente: 'ADSO 2',
      instructorLider: 'Zahedys Manuel Rodriguez Villarreal',
      centroFormacion: 'Centro de Servicios y Gestión Empresarial',
      regional: 'Regional Antioquia'
    },
    {
      id: 'c98f959d-59c0-46e0-9572-8fab74e6d9ff',
      codigo: '3231752',
      programa: 'Análisis y Desarrollo de Software (ADSO)',
      jornada: 'Jornada Tarde (12:00m - 6:00pm)',
      ambiente: 'ADSO 2',
      instructorLider: 'Zahedys Manuel Rodriguez Villarreal',
      centroFormacion: 'Centro de Servicios y Gestión Empresarial',
      regional: 'Regional Antioquia'
    },
    {
      id: '961259d4-d497-4f60-9227-4822b918a121',
      codigo: '3294087',
      programa: 'Análisis y Desarrollo de Software (ADSO)',
      jornada: 'Jornada Tarde (12:00m - 6:00pm)',
      ambiente: 'ADSO 3',
      instructorLider: 'Zahedys Manuel Rodriguez Villarreal',
      centroFormacion: 'Centro de Servicios y Gestión Empresarial',
      regional: 'Regional Antioquia'
    }
  ],
  currentFichaCodigo: '3532730',
  
  // Core Records
  aprendices: [],
  competencias: SEED_COMPETENCIAS,
  activities: DEFAULT_ACTIVITIES,
  asistencias: {},
  calificaciones: {},
  llamados: [],
  
  // Instructor Profile
  instructorProfile: {
    nombres: 'Zahedys Manuel',
    apellidos: 'Rodriguez Villarreal',
    documento: '8787499',
    email: 'instructor@sena.edu.co',
    cargo: 'Instructor Líder de Formación ADSO',
    centroFormacion: 'Centro de Servicios y Gestión Empresarial',
    foto: '',
    firmaDigital: 'Zahedys Manuel Rodriguez Villarreal'
  }
};

// =========================================================================
// 1. SUPABASE REAL DATABASE FETCHING & SYNCING
// =========================================================================
async function fetchRealDataFromSupabase() {
  try {
    console.log('🔄 Conectando con Supabase para obtener información real...');
    
    // 1. Fetch Fichas directly from REST endpoint
    const fichasData = await supabaseRestFetch('fichas', 'select=*&order=codigo.asc');
    const fichaIdToCodeMap = {};
    const fichaCodeToIdMap = {};

    if (Array.isArray(fichasData) && fichasData.length > 0) {
      APP_STATE.fichas = fichasData.map(f => {
        const c = String(f.codigo || '').trim();
        if (f.id && c) {
          fichaIdToCodeMap[f.id] = c;
          fichaCodeToIdMap[c] = f.id;
        }
        return {
          id: f.id,
          codigo: c,
          programa: f.programa || 'Análisis y Desarrollo de Software ADSO',
          jornada: f.jornada || 'Jornada Mixta',
          ambiente: f.ambiente || 'ADSO 2',
          instructorLider: APP_STATE.currentUserNombre,
          centroFormacion: APP_STATE.instructorProfile.centroFormacion,
          regional: 'Regional Antioquia'
        };
      });

      // Ensure active ficha exists in fetched list
      const hasCurrent = APP_STATE.fichas.some(f => f.codigo === APP_STATE.currentFichaCodigo);
      if (!hasCurrent && APP_STATE.fichas.length > 0) {
        APP_STATE.currentFichaCodigo = APP_STATE.fichas[0].codigo;
      }
      console.log(`✅ ${APP_STATE.fichas.length} fichas reales cargadas desde Supabase. Ficha activa: ${APP_STATE.currentFichaCodigo}`);
    }

    // 2. Fetch Real Aprendices from Supabase
    const apData = await supabaseRestFetch('aprendices', 'select=*&order=apellidos.asc,nombres.asc');
    if (Array.isArray(apData) && apData.length > 0) {
      APP_STATE.aprendices = apData.map(a => {
        const directCode = a.ficha_codigo ? String(a.ficha_codigo).trim() : '';
        const mappedCode = (a.ficha_id && fichaIdToCodeMap[a.ficha_id]) ? String(fichaIdToCodeMap[a.ficha_id]).trim() : '';
        const finalFicha = directCode || mappedCode || '';

        return {
          id: String(a.id || a.documento),
          ficha_id: a.ficha_id || '',
          fichaCodigo: finalFicha,
          ficha_codigo: finalFicha,
          tipoDoc: a.tipo_doc || a.tipo_documento || 'CC',
          documento: String(a.documento || '').trim(),
          nombres: a.nombres || '',
          apellidos: a.apellidos || '',
          correo: a.email || a.correo || `${a.documento}@misena.edu.co`,
          usuario: String(a.usuario || a.documento || ''),
          password: String(a.password || a.contrasena || a.documento || ''),
          estado: a.estado_matricula || a.estado || 'En Formación',
          foto: a.foto || '',
          rachaAsistencia: Number(a.racha_asistencia || 100),
          fallasConsecutivas: Number(a.fallas_consecutivas || 0)
        };
      });
      console.log(`✅ ${APP_STATE.aprendices.length} aprendices reales cargados desde Supabase.`);
    }

    // 3. Fetch Instructor Profile
    const instData = await supabaseRestFetch('instructores', 'select=*&limit=1');
    if (Array.isArray(instData) && instData.length > 0) {
      const dbInst = instData[0];
      APP_STATE.instructorProfile = {
        nombres: dbInst.nombres || APP_STATE.instructorProfile.nombres,
        apellidos: dbInst.apellidos || APP_STATE.instructorProfile.apellidos,
        documento: dbInst.documento || APP_STATE.instructorProfile.documento,
        email: dbInst.email || APP_STATE.instructorProfile.email,
        cargo: dbInst.cargo || APP_STATE.instructorProfile.cargo,
        centroFormacion: dbInst.centro_formacion || APP_STATE.instructorProfile.centroFormacion,
        foto: dbInst.foto || APP_STATE.instructorProfile.foto,
        firmaDigital: dbInst.firma_digital || `${dbInst.nombres} ${dbInst.apellidos}`
      };
      APP_STATE.currentUserNombre = `${APP_STATE.instructorProfile.nombres} ${APP_STATE.instructorProfile.apellidos}`;
    }

    // 4. Fetch Calificaciones
    const calData = await supabaseRestFetch('calificaciones', 'select=*');
    if (Array.isArray(calData) && calData.length > 0) {
      const realCalifs = {};
      calData.forEach(cr => {
        const doc = String(cr.aprendiz_documento || '').trim();
        if (!doc) return;
        const rapCode = cr.rap_codigo ? (cr.rap_codigo.startsWith('RAP') ? cr.rap_codigo.replace('-', '') : cr.rap_codigo) : 'RAP1';
        const key = `${doc}_${rapCode}`;
        let estado = 'en_blanco';
        if (cr.calificacion === 'A' || cr.calificacion === 'aprobado') estado = 'aprobado';
        else if (cr.calificacion === 'NA' || cr.calificacion === 'no_aprobado') estado = 'no_aprobado';
        
        realCalifs[key] = {
          estado: estado,
          feedback: cr.observacion || '',
          planRecuperacion: cr.plan_actividad || ''
        };
      });
      APP_STATE.calificaciones = realCalifs;
    }

    // 5. Fetch Competencias & RAPs
    const compData = await supabaseRestFetch('competencias', 'select=*');
    const rapData = await supabaseRestFetch('resultados_aprendizaje', 'select=*');
    if (Array.isArray(compData) && compData.length > 0) {
      APP_STATE.competencias = compData.map(c => {
        const compRaps = (Array.isArray(rapData) ? rapData : [])
          .filter(r => r.competencia_id === c.id || r.competencia_codigo === c.codigo)
          .map(r => ({
            id: r.codigo_rap ? r.codigo_rap.replace('-', '') : (r.id || 'RAP1'),
            codigo: r.codigo_rap || 'RAP-01',
            descripcion: r.nombre_rap || r.descripcion || c.nombre
          }));

        return {
          id: c.id,
          codigo: c.codigo,
          nombre: c.nombre,
          horas: Number(c.horas) || 160,
          estado: c.estado || 'Activo',
          resultados: compRaps.length > 0 ? compRaps : (c.resultados || [
            { id: 'RAP1', codigo: 'RAP-01', descripcion: c.nombre }
          ])
        };
      });
    }

    // 6. Fetch Llamados de atención
    const llamData = await supabaseRestFetch('llamados_atencion', 'select=*');
    if (Array.isArray(llamData) && llamData.length > 0) {
      APP_STATE.llamados = llamData.map(l => ({
        id: String(l.id || l.numero_acta),
        numeroActa: l.numero_acta || `ACTA-${new Date().getFullYear()}-001`,
        aprendizDocumento: l.aprendiz_documento,
        aprendizNombre: l.aprendiz_nombre,
        tipo: l.tipo || 'inasistencia',
        fecha: l.fecha || l.fecha_emision || '',
        motivo: l.motivo || l.causa_detectada || '',
        compromiso: l.compromiso || '',
        estado: l.estado || 'pendiente'
      }));
    }

    saveToLocalStorage();
    renderAllViews();
    console.log('✅ Base de datos Supabase sincronizada con éxito en la vista.');
  } catch (err) {
    console.error('Error al sincronizar con Supabase:', err);
  }
}

async function syncDataToSupabase() {
  if (!supabaseClient) {
    alert('Cliente Supabase no disponible en este entorno.');
    return;
  }

  const alertBox = document.getElementById('supabase-sync-alert');
  if (alertBox) {
    alertBox.classList.remove('hidden');
    alertBox.textContent = 'Enviando información a Supabase (PostgreSQL)...';
  }

  try {
    const currentFicha = getCurrentFicha();

    // 1. Upsert Fichas
    if (APP_STATE.fichas.length > 0) {
      const fichasPayload = APP_STATE.fichas.map(f => ({
        codigo: f.codigo,
        programa: f.programa,
        jornada: f.jornada,
        ambiente: f.ambiente
      }));
      await supabaseClient.from('fichas').upsert(fichasPayload, { onConflict: 'codigo' });
    }

    // 2. Upsert Aprendices
    if (APP_STATE.aprendices.length > 0) {
      const learnersPayload = APP_STATE.aprendices.map(a => ({
        documento: a.documento,
        nombres: a.nombres,
        apellidos: a.apellidos || '',
        email: a.correo,
        usuario: a.documento,
        password: a.password || a.documento,
        estado_matricula: a.estado || 'En Formación',
        foto: a.foto || null,
        ficha_codigo: currentFicha.codigo
      }));

      await supabaseClient.from('aprendices').upsert(learnersPayload, { onConflict: 'documento' });
    }

    // 3. Upsert Competencias
    if (APP_STATE.competencias.length > 0) {
      const compPayload = APP_STATE.competencias.map(c => ({
        codigo: c.codigo,
        nombre: c.nombre,
        horas: c.horas || 160,
        resultados: c.resultados || []
      }));
      await supabaseClient.from('competencias').upsert(compPayload, { onConflict: 'codigo' });
    }

    // 4. Upsert Instructor
    await supabaseClient.from('instructores').upsert({
      documento: APP_STATE.instructorProfile.documento,
      nombres: APP_STATE.instructorProfile.nombres,
      apellidos: APP_STATE.instructorProfile.apellidos,
      email: APP_STATE.instructorProfile.email,
      cargo: APP_STATE.instructorProfile.cargo,
      centro_formacion: APP_STATE.instructorProfile.centroFormacion,
      foto: APP_STATE.instructorProfile.foto || null,
      firma_digital: APP_STATE.instructorProfile.firmaDigital
    }, { onConflict: 'documento' });

    if (alertBox) {
      alertBox.textContent = `¡Sincronización exitosa! ${APP_STATE.aprendices.length} aprendices, ${APP_STATE.fichas.length} fichas y ${APP_STATE.competencias.length} competencias guardadas en Supabase.`;
    }
    alert(`¡Sincronización exitosa con Supabase! ${APP_STATE.aprendices.length} aprendices, ${APP_STATE.fichas.length} fichas y competencias actualizadas.`);
  } catch (err) {
    if (alertBox) alertBox.textContent = `Aviso: ${err.message}`;
    alert(`Aviso de Supabase: ${err.message}`);
  }
}

async function syncDataFromSupabase() {
  await fetchRealDataFromSupabase();
  alert('¡Datos actualizados desde la base de datos Supabase!');
}

// Upload direct file to Supabase Storage Bucket 'perfiles'
async function uploadToSupabaseStorage(file, folder = 'general') {
  if (!supabaseClient) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ success: true, url: reader.result, isLocal: true });
      reader.readAsDataURL(file);
    });
  }

  try {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { data, error } = await supabaseClient.storage
      .from('perfiles')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
      console.warn('Supabase storage fallback a base64:', error.message);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ success: true, url: reader.result, isLocal: true });
        reader.readAsDataURL(file);
      });
    }

    const { data: urlData } = supabaseClient.storage.from('perfiles').getPublicUrl(data.path);
    return { success: true, url: urlData.publicUrl, isLocal: false };
  } catch (err) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ success: true, url: reader.result, isLocal: true });
      reader.readAsDataURL(file);
    });
  }
}

// =========================================================================
// 2. LOCAL STATE PERSISTENCE
// =========================================================================
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('academix_html_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      APP_STATE.fichas = (parsed.fichas && parsed.fichas.length) ? parsed.fichas : APP_STATE.fichas;
      APP_STATE.currentFichaCodigo = parsed.currentFichaCodigo || APP_STATE.currentFichaCodigo;
      APP_STATE.aprendices = Array.isArray(parsed.aprendices) ? parsed.aprendices : [];
      APP_STATE.competencias = (parsed.competencias && parsed.competencias.length) ? parsed.competencias : SEED_COMPETENCIAS;
      APP_STATE.activities = (parsed.activities && parsed.activities.length) ? parsed.activities : DEFAULT_ACTIVITIES;
      APP_STATE.asistencias = (parsed.asistencias && typeof parsed.asistencias === 'object') ? parsed.asistencias : {};
      APP_STATE.calificaciones = (parsed.calificaciones && typeof parsed.calificaciones === 'object') ? parsed.calificaciones : {};
      APP_STATE.llamados = Array.isArray(parsed.llamados) ? parsed.llamados : [];
      APP_STATE.instructorProfile = parsed.instructorProfile || APP_STATE.instructorProfile;
      APP_STATE.currentUserRole = parsed.currentUserRole || 'instructor';
      APP_STATE.currentUserDoc = parsed.currentUserDoc || '8787499';
    }
  } catch (e) {
    console.warn('Error loading localStorage:', e);
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('academix_html_state', JSON.stringify({
      fichas: APP_STATE.fichas,
      currentFichaCodigo: APP_STATE.currentFichaCodigo,
      aprendices: APP_STATE.aprendices,
      competencias: APP_STATE.competencias,
      activities: APP_STATE.activities,
      asistencias: APP_STATE.asistencias,
      calificaciones: APP_STATE.calificaciones,
      llamados: APP_STATE.llamados,
      instructorProfile: APP_STATE.instructorProfile,
      currentUserRole: APP_STATE.currentUserRole,
      currentUserDoc: APP_STATE.currentUserDoc
    }));
  } catch (e) {
    console.warn('Error saving localStorage:', e);
  }
}

// =========================================================================
// 3. LOGIN & AUTHENTICATION CONTROLLER
// =========================================================================
let currentSelectedLoginRole = 'instructor';

function selectLoginRole(role) {
  currentSelectedLoginRole = role;
  document.querySelectorAll('.login-role-tab').forEach(b => {
    b.classList.remove('bg-white', 'text-blue-900', 'shadow-sm');
    b.classList.add('text-slate-600');
  });

  const tab = document.getElementById(`tab-role-${role}`);
  if (tab) {
    tab.classList.add('bg-white', 'text-blue-900', 'shadow-sm');
    tab.classList.remove('text-slate-600');
  }

  const desc = document.getElementById('login-role-description');
  const userInp = document.getElementById('input-login-user');
  const passInp = document.getElementById('input-login-pass');
  const labelUser = document.getElementById('login-label-user');

  if (role === 'instructor') {
    desc.innerHTML = '<i data-lucide="lock" class="w-4 h-4 text-[#002B7F] shrink-0 mt-0.5"></i><span>Acceso para instructores con gestión de fichas, asistencia, notas y actas.</span>';
    labelUser.textContent = 'Usuario o Cédula del Instructor';
    userInp.value = '8787499';
    passInp.value = 'zamarovi';
    userInp.placeholder = '8787499 o instructor';
  } else if (role === 'aprendiz') {
    desc.innerHTML = '<i data-lucide="badge" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i><span>Portal del aprendiz para consulta de notas, asistencias y foto de perfil.</span>';
    labelUser.textContent = 'Documento de Identidad del Aprendiz';
    userInp.value = APP_STATE.aprendices[0] ? APP_STATE.aprendices[0].documento : '1001234567';
    passInp.value = userInp.value;
    userInp.placeholder = 'Ej. 1001234567';
  } else if (role === 'admin') {
    desc.innerHTML = '<i data-lucide="shield-check" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i><span>Acceso de administración general de sedes y fichas académicas.</span>';
    labelUser.textContent = 'Usuario Administrador';
    userInp.value = 'Zarro';
    passInp.value = 'zamarovi78*';
    userInp.placeholder = 'Zarro';
  }

  if (window.lucide) window.lucide.createIcons();
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const user = document.getElementById('input-login-user').value.trim();
  const pass = document.getElementById('input-login-pass').value.trim();
  const errBox = document.getElementById('login-error-alert');
  const errText = document.getElementById('login-error-text');

  errBox.classList.add('hidden');

  // 1. Admin Login
  if (currentSelectedLoginRole === 'admin' || user.toLowerCase() === 'zarro') {
    if (pass === 'zamarovi78*') {
      executeLoginSuccess('admin', 'Administrador General (Zarro)', 'admin');
      return;
    } else {
      showLoginError('Contraseña incorrecta para el Administrador.');
      return;
    }
  }

  // 2. Instructor Login
  if (currentSelectedLoginRole === 'instructor' || user === '8787499' || user.toLowerCase() === 'instructor') {
    if (pass === 'zamarovi' || user === '8787499' || pass.length > 0) {
      const nombre = `${APP_STATE.instructorProfile.nombres} ${APP_STATE.instructorProfile.apellidos}`;
      executeLoginSuccess('instructor', nombre, '8787499');
      return;
    } else {
      showLoginError('Contraseña incorrecta para el Instructor (Usuario: 8787499).');
      return;
    }
  }

  // 3. Aprendiz Login
  if (currentSelectedLoginRole === 'aprendiz') {
    const learner = APP_STATE.aprendices.find(a => a.documento === user || a.usuario === user);
    if (learner) {
      executeLoginSuccess('aprendiz', `${learner.nombres} ${learner.apellidos}`, learner.documento);
      navigateToView('vista-aprendiz');
      return;
    } else {
      executeLoginSuccess('aprendiz', `Aprendiz ${user}`, user);
      navigateToView('vista-aprendiz');
      return;
    }
  }

  showLoginError('Credenciales no reconocidas en el sistema.');
}

function showLoginError(msg) {
  const errBox = document.getElementById('login-error-alert');
  const errText = document.getElementById('login-error-text');
  errText.textContent = msg;
  errBox.classList.remove('hidden');
}

function executeLoginSuccess(role, nombre, doc) {
  APP_STATE.isLoggedIn = true;
  APP_STATE.currentUserRole = role;
  APP_STATE.currentUserNombre = nombre;
  APP_STATE.currentUserDoc = doc;

  localStorage.setItem('academix_logged_in', 'true');
  saveToLocalStorage();

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');

  renderAllViews();
  if (role === 'aprendiz') {
    navigateToView('vista-aprendiz');
  } else {
    navigateToView('panel');
  }
}

function handleLogout() {
  APP_STATE.isLoggedIn = false;
  localStorage.removeItem('academix_logged_in');
  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  selectLoginRole('instructor');
}

function togglePasswordVisibility(inputId) {
  const el = document.getElementById(inputId);
  if (el) {
    el.type = el.type === 'password' ? 'text' : 'password';
  }
}

// =========================================================================
// 4. NAVIGATION & VIEW CONTROLLER
// =========================================================================
let currentActiveView = 'panel';

function navigateToView(viewId) {
  currentActiveView = viewId;

  // Hide all view sections
  document.querySelectorAll('.view-panel').forEach(v => v.classList.add('hidden'));

  // Show target
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.remove('hidden');

  // Update sidebar active buttons
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    const navId = btn.getAttribute('data-nav-id');
    const icon = btn.querySelector('i');
    if (navId === viewId) {
      btn.className = 'sidebar-nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left cursor-pointer bg-[#002B7F] text-white font-semibold shadow-xs';
      if (icon) icon.className = 'w-4 h-4 text-white';
    } else {
      btn.className = 'sidebar-nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium';
      if (icon) icon.className = 'w-4 h-4 text-slate-400';
    }
  });

  // Toggle "Volver al panel" button
  const backBtn = document.getElementById('btn-back-to-panel');
  if (backBtn) {
    if (viewId === 'panel') backBtn.classList.add('hidden');
    else backBtn.classList.remove('hidden');
  }

  // Refresh target view data
  if (viewId === 'cargar') renderCargarInfo();
  if (viewId === 'asistencia') renderAttendanceTable();
  if (viewId === 'calificaciones') renderCalificacionesTable();
  if (viewId === 'consulta-asistencia') renderConsultaAsistenciaTable();
  if (viewId === 'consulta-notas') renderConsultaNotasTable();
  if (viewId === 'llamados') renderLlamadosCards();
  if (viewId === 'vista-aprendiz') renderLearnerPortal();

  if (window.lucide) window.lucide.createIcons();
}

function getCurrentFicha() {
  return APP_STATE.fichas.find(f => String(f.codigo).trim() === String(APP_STATE.currentFichaCodigo).trim()) || APP_STATE.fichas[0];
}

function getAprendicesForFicha(fichaCodigo) {
  const current = getCurrentFicha();
  const targetCodigo = String(fichaCodigo || (current ? current.codigo : APP_STATE.currentFichaCodigo) || '').trim();
  if (!targetCodigo) return [];

  const targetFichaObj = APP_STATE.fichas.find(f => String(f.codigo).trim() === targetCodigo);
  const targetFichaId = targetFichaObj ? String(targetFichaObj.id || '').trim() : null;

  return (APP_STATE.aprendices || []).filter(a => {
    const aFicha = String(a.fichaCodigo || a.ficha_codigo || '').trim();
    if (aFicha && aFicha === targetCodigo) return true;
    if (targetFichaId && a.ficha_id && String(a.ficha_id).trim() === targetFichaId) return true;
    return false;
  });
}

function getCompetenciasForFicha(fichaCodigo) {
  const current = getCurrentFicha();
  const targetCodigo = String(fichaCodigo || (current ? current.codigo : APP_STATE.currentFichaCodigo) || '').trim();
  const filtered = (APP_STATE.competencias || []).filter(c => {
    const cFicha = String(c.fichaCodigo || c.ficha_codigo || '').trim();
    return !cFicha || cFicha === targetCodigo;
  });
  return filtered.length > 0 ? filtered : APP_STATE.competencias;
}

function toggleFichaDropdown() {
  const d = document.getElementById('dropdown-fichas-menu');
  if (d) d.classList.toggle('hidden');
}

function toggleNotificationDropdown() {
  const d = document.getElementById('dropdown-notif-menu');
  if (d) d.classList.toggle('hidden');
}

function toggleUserDropdown() {
  const d = document.getElementById('dropdown-user-menu');
  if (d) d.classList.toggle('hidden');
}

function selectFicha(codigo) {
  APP_STATE.currentFichaCodigo = String(codigo).trim();
  saveToLocalStorage();
  const menu = document.getElementById('dropdown-fichas-menu');
  if (menu) menu.classList.add('hidden');
  renderAllViews();
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('hidden');
    m.classList.remove('flex');
  }
}

// =========================================================================
// 5. CARGAR INFORMACION: 3 SUB-TABS (FICHAS, COMPETENCIAS & APRENDICES)
// =========================================================================
let currentCargarSubTab = 3;

function setCargarTab(tabNum) {
  currentCargarSubTab = tabNum;

  for (let i = 1; i <= 3; i++) {
    const btn = document.getElementById(`tab-cargar-btn-${i}`);
    const content = document.getElementById(`cargar-subtab-${i}`);
    if (i === tabNum) {
      if (btn) {
        btn.className = 'cargar-tab-btn flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer bg-[#002B7F] text-white shadow-xs';
      }
      if (content) content.classList.remove('hidden');
    } else {
      if (btn) {
        btn.className = 'cargar-tab-btn flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer text-slate-600 hover:bg-slate-50';
      }
      if (content) content.classList.add('hidden');
    }
  }

  renderCargarInfo();
  if (window.lucide) window.lucide.createIcons();
}

// 5.1 CREAR Y GESTIONAR FICHAS
async function handleCreateFicha(event) {
  event.preventDefault();
  const codigo = document.getElementById('form-ficha-codigo').value.trim();
  const programa = document.getElementById('form-ficha-programa').value.trim();
  const jornada = document.getElementById('form-ficha-jornada').value;
  const ambiente = document.getElementById('form-ficha-ambiente').value.trim();

  if (!codigo || !programa) {
    alert('Por favor ingrese el código y el programa de la ficha.');
    return;
  }

  const existingIdx = APP_STATE.fichas.findIndex(f => f.codigo === codigo);
  const newFicha = {
    codigo: codigo,
    programa: programa,
    jornada: jornada,
    ambiente: ambiente || 'Ambiente de Formación',
    instructorLider: APP_STATE.currentUserNombre,
    centroFormacion: APP_STATE.instructorProfile.centroFormacion,
    regional: 'Regional Antioquia'
  };

  if (existingIdx !== -1) {
    APP_STATE.fichas[existingIdx] = newFicha;
  } else {
    APP_STATE.fichas.unshift(newFicha);
  }

  APP_STATE.currentFichaCodigo = codigo;
  saveToLocalStorage();
  renderAllViews();

  document.getElementById('form-ficha-codigo').value = '';
  document.getElementById('form-ficha-programa').value = '';

  if (supabaseClient) {
    await supabaseClient.from('fichas').upsert({
      codigo: newFicha.codigo,
      programa: newFicha.programa,
      jornada: newFicha.jornada,
      ambiente: newFicha.ambiente
    }, { onConflict: 'codigo' });
  }

  alert(`¡Ficha ${codigo} creada y activada exitosamente!`);
}

function deleteFicha(codigo) {
  if (APP_STATE.fichas.length <= 1) {
    alert('Debe existir al menos una ficha en el sistema.');
    return;
  }
  if (!confirm(`¿Está seguro de eliminar la ficha ${codigo}?`)) return;

  APP_STATE.fichas = APP_STATE.fichas.filter(f => f.codigo !== codigo);
  if (APP_STATE.currentFichaCodigo === codigo) {
    APP_STATE.currentFichaCodigo = APP_STATE.fichas[0].codigo;
  }
  saveToLocalStorage();
  renderAllViews();

  if (supabaseClient) {
    supabaseClient.from('fichas').delete().eq('codigo', codigo);
  }
}

// 5.2 CREAR Y ASIGNAR COMPETENCIAS & RAPs
async function handleCreateCompetencia(event) {
  event.preventDefault();
  const codigo = document.getElementById('form-comp-codigo').value.trim();
  const nombre = document.getElementById('form-comp-nombre').value.trim();
  const rapCodigo = document.getElementById('form-comp-rap-codigo').value.trim() || 'RAP-01';
  const horas = Number(document.getElementById('form-comp-horas').value) || 160;
  const rapDesc = document.getElementById('form-comp-rap-desc').value.trim();

  if (!codigo || !nombre || !rapDesc) {
    alert('Por favor complete el código, denominación y descripción del RAP.');
    return;
  }

  const existingIdx = APP_STATE.competencias.findIndex(c => c.codigo === codigo);
  const rapObj = {
    id: `RAP_${Date.now()}`,
    codigo: rapCodigo,
    descripcion: rapDesc
  };

  if (existingIdx !== -1) {
    if (!APP_STATE.competencias[existingIdx].resultados) {
      APP_STATE.competencias[existingIdx].resultados = [];
    }
    APP_STATE.competencias[existingIdx].resultados.push(rapObj);
  } else {
    const newComp = {
      codigo: codigo,
      nombre: nombre,
      horas: horas,
      estado: 'Activo',
      resultados: [rapObj]
    };
    APP_STATE.competencias.unshift(newComp);
  }

  saveToLocalStorage();
  renderAllViews();

  document.getElementById('form-comp-codigo').value = '';
  document.getElementById('form-comp-nombre').value = '';
  document.getElementById('form-comp-rap-desc').value = '';

  if (supabaseClient) {
    await supabaseClient.from('competencias').upsert({
      codigo: codigo,
      nombre: nombre,
      horas: horas,
      resultados: existingIdx !== -1 ? APP_STATE.competencias[existingIdx].resultados : [rapObj]
    }, { onConflict: 'codigo' });
  }

  alert(`¡Competencia ${codigo} y ${rapCodigo} vinculados exitosamente!`);
}

function deleteCompetencia(codigo) {
  if (!confirm(`¿Está seguro de eliminar la competencia ${codigo} y sus RAPs asociados?`)) return;
  APP_STATE.competencias = APP_STATE.competencias.filter(c => c.codigo !== codigo);
  saveToLocalStorage();
  renderAllViews();

  if (supabaseClient) {
    supabaseClient.from('competencias').delete().eq('codigo', codigo);
  }
}

// 5.3 AGREGAR APRENDIZ INDIVIDUAL
async function handleCreateIndividualLearner(event) {
  event.preventDefault();
  const currentFicha = getCurrentFicha();
  const tipoDoc = document.getElementById('form-indiv-tipodoc').value;
  const doc = document.getElementById('form-indiv-doc').value.trim();
  const nombres = document.getElementById('form-indiv-nombres').value.trim();
  const apellidos = document.getElementById('form-indiv-apellidos').value.trim();
  const email = document.getElementById('form-indiv-email').value.trim();

  if (!doc || !nombres || !email) {
    alert('Por favor complete todos los campos obligatorios.');
    return;
  }

  const existingIdx = APP_STATE.aprendices.findIndex(a => a.documento === doc);
  const learnerObj = {
    id: `ap_${Date.now()}`,
    fichaCodigo: currentFicha.codigo,
    tipoDoc: tipoDoc,
    documento: doc,
    nombres: nombres,
    apellidos: apellidos,
    correo: email,
    usuario: doc,
    password: doc,
    estado: 'En Formación',
    foto: '',
    rachaAsistencia: 100,
    fallasConsecutivas: 0
  };

  if (existingIdx !== -1) {
    APP_STATE.aprendices[existingIdx] = learnerObj;
  } else {
    APP_STATE.aprendices.push(learnerObj);
  }

  saveToLocalStorage();
  renderAllViews();

  document.getElementById('form-indiv-doc').value = '';
  document.getElementById('form-indiv-nombres').value = '';
  document.getElementById('form-indiv-apellidos').value = '';
  document.getElementById('form-indiv-email').value = '';

  if (supabaseClient) {
    await supabaseClient.from('aprendices').upsert({
      documento: doc,
      nombres: nombres,
      apellidos: apellidos,
      email: email,
      usuario: doc,
      password: doc,
      estado_matricula: 'En Formación',
      ficha_codigo: currentFicha.codigo
    }, { onConflict: 'documento' });
  }

  alert(`¡Aprendiz ${nombres} ${apellidos} registrado exitosamente en la Ficha ${currentFicha.codigo}!`);
}

function deleteLearner(documento) {
  if (!confirm(`¿Está seguro de eliminar al aprendiz con documento ${documento}?`)) return;
  APP_STATE.aprendices = APP_STATE.aprendices.filter(a => a.documento !== documento);
  saveToLocalStorage();
  renderAllViews();

  if (supabaseClient) {
    supabaseClient.from('aprendices').delete().eq('documento', documento);
  }
}

function updateLearnerEstado(documento, nuevoEstado) {
  const learner = APP_STATE.aprendices.find(a => a.documento === documento);
  if (learner) {
    learner.estado = nuevoEstado;
    saveToLocalStorage();
    renderCargarInfo();

    if (supabaseClient) {
      supabaseClient.from('aprendices').update({ estado_matricula: nuevoEstado }).eq('documento', documento);
    }
  }
}

function filterLearnersTable(query) {
  const q = query.toLowerCase().trim();
  const rows = document.querySelectorAll('#tbody-cargar-aprendices tr');
  rows.forEach(r => {
    const text = r.innerText.toLowerCase();
    if (text.includes(q)) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
}

// =========================================================================
// 6. RENDERING LOGIC FOR ALL VIEWS
// =========================================================================
function renderAllViews() {
  renderTopNavigation();
  renderSidebar();
  renderPanelGeneral();
  renderCargarInfo();
  renderAttendanceTable();
  renderCalificacionesTable();
  renderConsultaAsistenciaTable();
  renderConsultaNotasTable();
  renderLlamadosCards();
  renderLearnerPortal();

  if (window.lucide) window.lucide.createIcons();
}

function renderTopNavigation() {
  const ficha = getCurrentFicha();
  
  const navFicha = document.getElementById('nav-active-ficha-label');
  if (navFicha) {
    navFicha.textContent = `${ficha.codigo} • ${ficha.jornada.includes('Tarde') ? 'ADSO Tarde' : (ficha.jornada.includes('Mañana') ? 'ADSO Mañana' : 'ADSO')}`;
  }

  const listFichas = document.getElementById('list-dropdown-fichas');
  if (listFichas) {
    listFichas.innerHTML = APP_STATE.fichas.map(f => `
      <button onclick="selectFicha('${f.codigo}')" class="w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition ${f.codigo === ficha.codigo ? 'bg-blue-50 text-[#002B7F] font-bold' : 'hover:bg-slate-50 text-slate-700'}">
        <span>${f.codigo} • ${f.jornada}</span>
        ${f.codigo === ficha.codigo ? '<i data-lucide="check" class="w-4 h-4 text-[#002B7F]"></i>' : ''}
      </button>
    `).join('');
  }

  // Synchronize any in-view ficha selector elements
  ['select-asistencia-ficha', 'select-calificaciones-ficha', 'select-consulta-asistencia-ficha', 'select-consulta-notas-ficha'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) {
      sel.innerHTML = APP_STATE.fichas.map(f => `
        <option value="${f.codigo}" ${f.codigo === ficha.codigo ? 'selected' : ''}>${f.codigo} • ${f.programa.substring(0, 32)} (${f.jornada.split(' ')[0]})</option>
      `).join('');
      sel.value = ficha.codigo;
    }
  });

  document.getElementById('nav-user-name').textContent = `${APP_STATE.instructorProfile.nombres} ${APP_STATE.instructorProfile.apellidos}`;
  document.getElementById('menu-user-fullname').textContent = `${APP_STATE.instructorProfile.nombres} ${APP_STATE.instructorProfile.apellidos}`;
  document.getElementById('menu-user-email').textContent = APP_STATE.instructorProfile.email;

  const avatar = document.getElementById('nav-user-avatar');
  if (avatar) {
    if (APP_STATE.instructorProfile.foto) {
      avatar.innerHTML = `<img src="${APP_STATE.instructorProfile.foto}" class="w-full h-full object-cover">`;
    } else {
      avatar.innerHTML = `<i data-lucide="user" class="w-4 h-4"></i>`;
    }
  }
}

function renderSidebar() {
  document.getElementById('sidebar-metric-total-llamados').textContent = String(APP_STATE.llamados.length).padStart(2, '0');
  document.getElementById('sidebar-metric-inasistencias').textContent = String(APP_STATE.llamados.filter(l => l.tipo === 'inasistencia').length).padStart(2, '0');
  document.getElementById('sidebar-metric-academicos').textContent = String(APP_STATE.llamados.filter(l => l.tipo === 'academico').length).padStart(2, '0');
  document.getElementById('sidebar-badge-llamados').textContent = APP_STATE.llamados.length;
  document.getElementById('sidebar-footer-name').textContent = `${APP_STATE.instructorProfile.nombres} ${APP_STATE.instructorProfile.apellidos}`;

  const footAvatar = document.getElementById('sidebar-footer-avatar');
  if (footAvatar && APP_STATE.instructorProfile.foto) {
    footAvatar.innerHTML = `<img src="${APP_STATE.instructorProfile.foto}" class="w-full h-full object-cover">`;
  }
}

function renderPanelGeneral() {
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  const fichaCompetencias = getCompetenciasForFicha(ficha.codigo);
  
  document.getElementById('panel-ficha-badge').textContent = `${ficha.codigo} • ${ficha.programa || 'ADSO'}`;
  document.getElementById('panel-aprendices-count').textContent = fichaAprendices.length;
  
  document.getElementById('panel-banner-codigo').textContent = `Ficha ${ficha.codigo}`;
  document.getElementById('panel-banner-jornada').textContent = ficha.jornada;
  document.getElementById('panel-banner-programa').textContent = ficha.programa;
  document.getElementById('panel-banner-centro').textContent = ficha.centroFormacion;
  document.getElementById('panel-banner-ambiente').textContent = ficha.ambiente;
  document.getElementById('panel-banner-instructor').textContent = `${APP_STATE.instructorProfile.nombres} ${APP_STATE.instructorProfile.apellidos}`;

  document.getElementById('stat-total-aprendices').textContent = fichaAprendices.length;
  document.getElementById('stat-total-competencias').textContent = fichaCompetencias.length;
  document.getElementById('stat-total-llamados').textContent = APP_STATE.llamados.length;

  const compGrid = document.getElementById('panel-competencias-grid');
  if (compGrid) {
    compGrid.innerHTML = fichaCompetencias.map(c => `
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
            ${c.codigo}
          </span>
          <span class="text-xs font-semibold text-slate-500">${c.horas || 160} Horas</span>
        </div>
        <h4 class="font-bold text-slate-900 text-xs leading-snug">${c.nombre}</h4>
        <div class="space-y-1 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
          ${(c.resultados || []).map(r => `
            <div class="flex items-start gap-1.5">
              <span class="font-bold text-blue-700 shrink-0">• [${r.codigo}]:</span>
              <span>${r.descripcion}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
}

function renderCargarInfo() {
  const currentFicha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(currentFicha.codigo);
  const fichaCompetencias = getCompetenciasForFicha(currentFicha.codigo);

  // 1. Render Fichas Cards (Sub-tab 1)
  const badgeFichas = document.getElementById('badge-total-fichas');
  if (badgeFichas) badgeFichas.textContent = `${APP_STATE.fichas.length} Fichas`;

  const listFichasCards = document.getElementById('list-fichas-cards');
  if (listFichasCards) {
    listFichasCards.innerHTML = APP_STATE.fichas.map(f => {
      const isActive = f.codigo === currentFicha.codigo;
      const count = getAprendicesForFicha(f.codigo).length;
      return `
        <div class="p-4 rounded-xl border transition ${isActive ? 'bg-blue-50/70 border-blue-300 ring-2 ring-[#002B7F]/20' : 'bg-slate-50 border-slate-200'} flex items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-xs ${isActive ? 'bg-[#002B7F] text-white' : 'bg-slate-200 text-slate-800'} px-2.5 py-0.5 rounded">
                ${f.codigo}
              </span>
              <span class="font-bold text-slate-900 text-sm">${f.programa}</span>
              ${isActive ? '<span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">Activa</span>' : ''}
            </div>
            <div class="text-xs text-slate-600 flex flex-wrap gap-x-4">
              <span><strong>Jornada:</strong> ${f.jornada}</span>
              <span><strong>Ambiente:</strong> ${f.ambiente}</span>
              <span><strong>Aprendices:</strong> <span class="font-bold text-[#002B7F]">${count}</span></span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            ${!isActive ? `
              <button onclick="selectFicha('${f.codigo}')" class="px-3 py-1.5 bg-[#002B7F] hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer">
                Gestionar
              </button>
            ` : ''}
            <button onclick="deleteFicha('${f.codigo}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="Eliminar Ficha">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Render Competencias Cards (Sub-tab 2)
  const badgeComp = document.getElementById('badge-total-competencias');
  if (badgeComp) badgeComp.textContent = `${fichaCompetencias.length} Competencias`;

  const listCompCards = document.getElementById('list-competencias-cards');
  if (listCompCards) {
    listCompCards.innerHTML = fichaCompetencias.map(c => `
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-xs bg-indigo-100 text-indigo-900 px-2.5 py-0.5 rounded">
              ${c.codigo}
            </span>
            <span class="font-bold text-slate-900 text-xs">${c.nombre}</span>
          </div>
          <button onclick="deleteCompetencia('${c.codigo}')" class="text-slate-400 hover:text-rose-600 p-1" title="Eliminar Competencia">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-1.5 pt-2 border-t border-slate-200">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Resultados de Aprendizaje (RAPs):</span>
          ${(c.resultados || []).map(r => `
            <div class="p-2 bg-white border border-slate-200 rounded-lg text-xs flex items-start gap-2">
              <span class="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] shrink-0">${r.codigo}</span>
              <span class="text-slate-700">${r.descripcion}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // 3. Render Aprendices Table (Sub-tab 3)
  const badgeCargar = document.getElementById('badge-cargar-count');
  if (badgeCargar) badgeCargar.textContent = `${fichaAprendices.length} Aprendices`;
  const tbody = document.getElementById('tbody-cargar-aprendices');
  if (!tbody) return;

  if (fichaAprendices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-slate-400 font-semibold">
          No hay aprendices registrados para la ficha <strong>${currentFicha.codigo}</strong>. Carga un archivo Excel o registra uno individualmente arriba.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = fichaAprendices.map((a, i) => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="p-3 font-mono font-bold text-slate-400">${i + 1}</td>
      <td class="p-3 font-mono font-bold text-slate-900">${a.documento}</td>
      <td class="p-3">
        <div class="font-bold text-slate-900">${a.nombres} ${a.apellidos}</div>
        <div class="text-[10px] text-slate-500 font-mono">Clave: ${a.password || a.documento}</div>
      </td>
      <td class="p-3 text-slate-600">${a.correo}</td>
      <td class="p-3">
        <select onchange="updateLearnerEstado('${a.documento}', this.value)" class="text-[10px] font-bold uppercase rounded-lg border border-slate-300 p-1 bg-white">
          <option value="En Formación" ${a.estado === 'En Formación' ? 'selected' : ''}>En Formación</option>
          <option value="Condicionado" ${a.estado === 'Condicionado' ? 'selected' : ''}>Condicionado</option>
          <option value="Cancelado" ${a.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
          <option value="Retiro Voluntario" ${a.estado === 'Retiro Voluntario' ? 'selected' : ''}>Retiro Voluntario</option>
        </select>
      </td>
      <td class="p-3 text-center">
        <button onclick="deleteLearner('${a.documento}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Eliminar Aprendiz">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// =========================================================================
// 7. VIEW 3: TOMA DE ASISTENCIA
// =========================================================================
function renderAttendanceTable() {
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);

  const dateInput = document.getElementById('input-asistencia-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  const curDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
  const dayRecord = APP_STATE.asistencias[curDate] || {};

  let countP = 0, countFI = 0, countFJ = 0, countR = 0, countE = 0;
  fichaAprendices.forEach(a => {
    const st = dayRecord[a.documento];
    if (st === 'presente') countP++;
    else if (st === 'injustificada') countFI++;
    else if (st === 'justificada') countFJ++;
    else if (st === 'retardo') countR++;
    else if (st === 'excusado') countE++;
  });

  const statsBadge = document.getElementById('asistencia-day-stats');
  if (statsBadge) {
    statsBadge.innerHTML = `
      <span class="text-emerald-700 font-bold">${countP} P</span> • 
      <span class="text-rose-700 font-bold">${countFI} FI</span> • 
      <span class="text-amber-700 font-bold">${countFJ} FJ</span> • 
      <span class="text-orange-700 font-bold">${countR} R</span> • 
      <span class="text-blue-700 font-bold">${countE} E</span>
    `;
  }

  const tbody = document.getElementById('tbody-asistencia-list');
  if (!tbody) return;

  if (fichaAprendices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-slate-400 font-semibold">
          No hay aprendices registrados en la Ficha <strong>${ficha.codigo}</strong>. Carga aprendices en el módulo "Cargar Información".
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = fichaAprendices.map((a, i) => {
    const estado = dayRecord[a.documento] || '';

    // Calculate historical unjustified absences for risk badge
    let fiCount = 0;
    Object.keys(APP_STATE.asistencias).forEach(d => {
      if (APP_STATE.asistencias[d] && APP_STATE.asistencias[d][a.documento] === 'injustificada') fiCount++;
    });

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 ${fiCount >= 3 ? 'bg-rose-50/40' : ''}">
        <td class="p-3 font-mono text-slate-400 font-bold">${i + 1}</td>
        <td class="p-3">
          <div class="font-bold text-slate-900">${a.nombres} ${a.apellidos}</div>
          <div class="text-[10px] text-slate-500 font-mono">${a.correo}</div>
        </td>
        <td class="p-3 font-mono font-bold text-slate-700">${a.documento}</td>
        <td class="p-3 text-center">
          <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 gap-1">
            <button onclick="setLearnerAttendance('${a.documento}', 'presente')" class="px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${estado === 'presente' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}" title="Presente">P</button>
            <button onclick="setLearnerAttendance('${a.documento}', 'injustificada')" class="px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${estado === 'injustificada' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}" title="Falta Injustificada">FI</button>
            <button onclick="setLearnerAttendance('${a.documento}', 'justificada')" class="px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${estado === 'justificada' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}" title="Falta Justificada">FJ</button>
            <button onclick="setLearnerAttendance('${a.documento}', 'retardo')" class="px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${estado === 'retardo' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}" title="Retardo">R</button>
            <button onclick="setLearnerAttendance('${a.documento}', 'excusado')" class="px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${estado === 'excusado' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}" title="Excusado">E</button>
          </div>
        </td>
        <td class="p-3">
          <input type="text" placeholder="Observación..." class="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none">
        </td>
        <td class="p-3 text-center">
          ${fiCount >= 3 ? `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
              <i data-lucide="alert-triangle" class="w-3 h-3"></i> ${fiCount} Faltas
            </span>
          ` : `
            <span class="text-slate-400 text-[11px]">Normal</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function setLearnerAttendance(doc, estado) {
  const curDate = document.getElementById('input-asistencia-date').value;
  if (!APP_STATE.asistencias[curDate]) APP_STATE.asistencias[curDate] = {};
  APP_STATE.asistencias[curDate][doc] = estado;
  saveToLocalStorage();
  renderAttendanceTable();
  if (window.lucide) window.lucide.createIcons();
}

function markAllAttendance(estado) {
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  const curDate = document.getElementById('input-asistencia-date').value;
  if (!APP_STATE.asistencias[curDate]) APP_STATE.asistencias[curDate] = {};
  fichaAprendices.forEach(a => {
    APP_STATE.asistencias[curDate][a.documento] = estado;
  });
  saveToLocalStorage();
  renderAttendanceTable();
  if (window.lucide) window.lucide.createIcons();
}

async function saveAttendanceRecord() {
  saveToLocalStorage();
  const curDate = document.getElementById('input-asistencia-date').value;
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  
  if (supabaseClient && APP_STATE.asistencias[curDate]) {
    try {
      const recordsToUpsert = fichaAprendices
        .filter(a => APP_STATE.asistencias[curDate][a.documento])
        .map(a => {
          let dbEstado = APP_STATE.asistencias[curDate][a.documento];
          if (dbEstado === 'injustificada') dbEstado = 'falta';
          else if (dbEstado === 'retardo') dbEstado = 'retraso';
          else if (dbEstado === 'justificada') dbEstado = 'excusa';
          
          return {
            aprendiz_documento: a.documento,
            ficha_codigo: ficha.codigo,
            fecha: curDate,
            estado: dbEstado
          };
        });

      if (recordsToUpsert.length > 0) {
        await supabaseClient.from('asistencias').upsert(recordsToUpsert, { onConflict: 'aprendiz_documento,fecha' });
      }
    } catch (e) {
      console.warn('Supabase attendance save notice:', e);
    }
  }

  alert('¡Asistencia registrada y guardada exitosamente en el sistema!');
}

// =========================================================================
// 8. VIEW 4: REGISTRO DE CALIFICACIONES (JUICIOS RAPs)
// =========================================================================
function renderCalificacionesTable() {
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  const fichaCompetencias = getCompetenciasForFicha(ficha.codigo);

  const selectRap = document.getElementById('select-calificaciones-rap');
  if (selectRap) {
    const raps = [];
    fichaCompetencias.forEach(c => {
      (c.resultados || []).forEach(r => raps.push({ id: r.id, label: `[${c.codigo}] ${r.codigo} - ${r.descripcion.substring(0, 60)}...` }));
    });
    const currentVal = selectRap.value;
    selectRap.innerHTML = raps.map(r => `<option value="${r.id}" ${r.id === currentVal ? 'selected' : ''}>${r.label}</option>`).join('');
    if (!raps.some(r => r.id === selectRap.value) && raps.length > 0) {
      selectRap.value = raps[0].id;
    }
  }

  const selectedRap = selectRap && selectRap.value ? selectRap.value : 'RAP1';
  const tbody = document.getElementById('tbody-calificaciones-list');
  if (!tbody) return;

  if (fichaAprendices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-8 text-center text-slate-400 font-semibold">
          No hay aprendices registrados en la Ficha <strong>${ficha.codigo}</strong>.
        </td>
      </tr>
    `;
    const summary = document.getElementById('calificaciones-summary-badge');
    if (summary) summary.innerHTML = `<span class="text-slate-500 font-bold">0 Aprendices</span>`;
    return;
  }

  let approvedCount = 0, noApprovedCount = 0, blankCount = 0;

  tbody.innerHTML = fichaAprendices.map((a, i) => {
    const key = `${a.documento}_${selectedRap}`;
    const cal = APP_STATE.calificaciones[key] || { estado: 'en_blanco', feedback: '', planRecuperacion: '' };
    
    if (cal.estado === 'aprobado') approvedCount++;
    else if (cal.estado === 'no_aprobado') noApprovedCount++;
    else blankCount++;

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-mono text-slate-400 font-bold">${i + 1}</td>
        <td class="p-3 font-bold text-slate-900">${a.nombres} ${a.apellidos}</td>
        <td class="p-3 font-mono text-slate-700">${a.documento}</td>
        <td class="p-3 text-center">
          <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 gap-1">
            <button onclick="setLearnerCalificacion('${a.documento}', '${selectedRap}', 'aprobado')" class="px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${cal.estado === 'aprobado' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}">Aprobado (A)</button>
            <button onclick="setLearnerCalificacion('${a.documento}', '${selectedRap}', 'no_aprobado')" class="px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${cal.estado === 'no_aprobado' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}">No Aprobado (NA)</button>
            <button onclick="setLearnerCalificacion('${a.documento}', '${selectedRap}', 'en_blanco')" class="px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${cal.estado === 'en_blanco' || !cal.estado ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-200'}">En Blanco (-)</button>
          </div>
        </td>
        <td class="p-3 space-y-1.5">
          <input type="text" value="${cal.feedback || ''}" onchange="setCalificacionFeedback('${a.documento}', '${selectedRap}', this.value)" placeholder="Retroalimentación técnica..." class="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none">
          ${cal.estado === 'no_aprobado' ? `
            <div class="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs">
              <span class="font-bold text-rose-800 shrink-0">Plan de Mejoramiento:</span>
              <input type="text" value="${cal.planRecuperacion || ''}" onchange="setCalificacionPlan('${a.documento}', '${selectedRap}', this.value)" placeholder="Actividad de nivelación..." class="w-full text-[11px] p-1 rounded border border-rose-300 bg-white">
            </div>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');

  const summary = document.getElementById('calificaciones-summary-badge');
  if (summary) {
    summary.innerHTML = `<span class="text-emerald-700 font-bold">${approvedCount} Aprobados</span> • <span class="text-rose-700 font-bold">${noApprovedCount} No Aprobados</span> • <span class="text-slate-600 font-bold">${blankCount} En Blanco</span>`;
  }
}

function setLearnerCalificacion(doc, rapId, estado) {
  const key = `${doc}_${rapId}`;
  if (!APP_STATE.calificaciones[key]) APP_STATE.calificaciones[key] = { estado: 'en_blanco', feedback: '', planRecuperacion: '' };
  APP_STATE.calificaciones[key].estado = estado;
  saveToLocalStorage();
  renderCalificacionesTable();
  if (window.lucide) window.lucide.createIcons();
}

function markAllCalificaciones(estado) {
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  const selectRap = document.getElementById('select-calificaciones-rap');
  const selectedRap = selectRap && selectRap.value ? selectRap.value : 'RAP1';

  fichaAprendices.forEach(a => {
    const key = `${a.documento}_${selectedRap}`;
    if (!APP_STATE.calificaciones[key]) APP_STATE.calificaciones[key] = { estado: 'en_blanco', feedback: '', planRecuperacion: '' };
    APP_STATE.calificaciones[key].estado = estado;
  });

  saveToLocalStorage();
  renderCalificacionesTable();
  if (window.lucide) window.lucide.createIcons();
}

function setCalificacionFeedback(doc, rapId, feedback) {
  const key = `${doc}_${rapId}`;
  if (!APP_STATE.calificaciones[key]) APP_STATE.calificaciones[key] = { estado: 'en_blanco', feedback: '', planRecuperacion: '' };
  APP_STATE.calificaciones[key].feedback = feedback;
  saveToLocalStorage();
}

function setCalificacionPlan(doc, rapId, plan) {
  const key = `${doc}_${rapId}`;
  if (!APP_STATE.calificaciones[key]) APP_STATE.calificaciones[key] = { estado: 'no_aprobado', feedback: '', planRecuperacion: '' };
  APP_STATE.calificaciones[key].planRecuperacion = plan;
  saveToLocalStorage();
}

async function saveCalificacionesRecord() {
  saveToLocalStorage();
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  const selectRap = document.getElementById('select-calificaciones-rap');
  const selectedRap = selectRap && selectRap.value ? selectRap.value : 'RAP1';

  if (supabaseClient) {
    try {
      const recordsToUpsert = [];
      fichaAprendices.forEach(a => {
        const key = `${a.documento}_${selectedRap}`;
        const cal = APP_STATE.calificaciones[key];
        if (cal && cal.estado && cal.estado !== 'en_blanco') {
          recordsToUpsert.push({
            aprendiz_documento: a.documento,
            rap_codigo: selectedRap,
            calificacion: cal.estado === 'aprobado' ? 'A' : 'NA',
            observacion: cal.feedback || '',
            plan_actividad: cal.planRecuperacion || ''
          });
        }
      });

      if (recordsToUpsert.length > 0) {
        await supabaseClient.from('calificaciones').upsert(recordsToUpsert, { onConflict: 'aprendiz_documento,rap_codigo' });
      }
    } catch (e) {
      console.warn('Supabase calificaciones save notice:', e);
    }
  }

  alert('¡Juicios evaluativos guardados correctamente!');
}

// =========================================================================
// 9. VIEW 5: CONSULTA DE ASISTENCIA (CRITICAL: ONLY DAYS WITH RECORDED DATA)
// =========================================================================
function setConsultaAsisPreset(type) {
  const desdeInput = document.getElementById('input-consulta-asis-desde');
  const hastaInput = document.getElementById('input-consulta-asis-hasta');

  if (type === 'todos') {
    if (desdeInput) desdeInput.value = '';
    if (hastaInput) hastaInput.value = '';
  } else {
    const today = new Date();
    const start = new Date();

    if (type === 'semana') start.setDate(today.getDate() - 6);
    else if (type === 'quincena') start.setDate(today.getDate() - 14);
    else if (type === 'mes') start.setDate(1);

    const fmt = (d) => d.toISOString().split('T')[0];
    if (desdeInput) desdeInput.value = fmt(start);
    if (hastaInput) hastaInput.value = fmt(today);
  }

  filterConsultaAsistenciaTable();
}

function filterConsultaAsistenciaTable() {
  renderConsultaAsistenciaTable();
}

function renderConsultaAsistenciaTable() {
  const table = document.getElementById('table-consulta-asistencia-matrix');
  if (!table) return;

  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);

  const searchQuery = (document.getElementById('input-search-consulta-asis') ? document.getElementById('input-search-consulta-asis').value : '').toLowerCase().trim();
  const filterState = document.getElementById('select-filter-consulta-asis') ? document.getElementById('select-filter-consulta-asis').value : 'todos';
  const desde = document.getElementById('input-consulta-asis-desde') ? document.getElementById('input-consulta-asis-desde').value : '';
  const hasta = document.getElementById('input-consulta-asis-hasta') ? document.getElementById('input-consulta-asis-hasta').value : '';

  // 1. CRITICAL REQUIREMENT: Extract exclusively the dates that have at least one valid attendance record for the active ficha!
  const allRecordedDates = Object.keys(APP_STATE.asistencias)
    .filter(d => {
      if (!d || !APP_STATE.asistencias[d]) return false;
      return fichaAprendices.some(a => APP_STATE.asistencias[d][a.documento] !== undefined && APP_STATE.asistencias[d][a.documento] !== null && APP_STATE.asistencias[d][a.documento] !== '');
    })
    .sort();

  // 2. Filter dates by optional range
  const filteredDates = allRecordedDates.filter(d => {
    if (desde && d < desde) return false;
    if (hasta && d > hasta) return false;
    return true;
  });

  // Metric: Total Days
  const totalDaysEl = document.getElementById('metric-consulta-total-dias');
  if (totalDaysEl) totalDaysEl.textContent = filteredDates.length;

  // Filter learners for current ficha
  let filteredLearners = fichaAprendices.filter(a => {
    if (searchQuery) {
      const matchName = `${a.nombres} ${a.apellidos}`.toLowerCase().includes(searchQuery);
      const matchDoc = a.documento.toLowerCase().includes(searchQuery);
      if (!matchName && !matchDoc) return false;
    }
    return true;
  });

  // Calculate stats & risk per learner
  let globalP = 0, globalTotalSlots = 0, atRiskCount = 0;

  const learnersWithStats = filteredLearners.map(a => {
    let p = 0, fi = 0, fj = 0, r = 0, e = 0;
    filteredDates.forEach(d => {
      const st = APP_STATE.asistencias[d] ? APP_STATE.asistencias[d][a.documento] : null;
      if (st === 'presente') p++;
      else if (st === 'injustificada') fi++;
      else if (st === 'justificada') fj++;
      else if (st === 'retardo') r++;
      else if (st === 'excusado') e++;
    });

    const totalDaysCount = filteredDates.length || 1;
    const percent = Math.round((p / totalDaysCount) * 100);
    if (fi >= 3) atRiskCount++;

    globalP += p;
    globalTotalSlots += filteredDates.length;

    return { ...a, p, fi, fj, r, e, percent, isAtRisk: fi >= 3 };
  });

  // Filter by state
  const finalLearners = learnersWithStats.filter(a => {
    if (filterState === 'con_faltas') return a.fi > 0;
    if (filterState === 'con_retrasos') return a.r > 0;
    if (filterState === 'en_riesgo') return a.isAtRisk;
    return true;
  });

  // Update header metric cards
  const avgPercentEl = document.getElementById('metric-consulta-promedio-asis');
  if (avgPercentEl) {
    const globalPercent = globalTotalSlots > 0 ? Math.round((globalP / globalTotalSlots) * 100) : 100;
    avgPercentEl.textContent = `${globalPercent}%`;
  }

  const riskEl = document.getElementById('metric-consulta-en-riesgo');
  if (riskEl) riskEl.textContent = atRiskCount;

  // Build Table HTML
  const thead = `
    <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
      <tr>
        <th class="p-3 sticky left-0 bg-slate-100 z-10">Aprendiz</th>
        <th class="p-3">Documento</th>
        ${filteredDates.map(d => {
          const parts = d.split('-');
          const shortDate = `${parts[2]}/${parts[1]}`;
          return `<th class="p-3 text-center min-w-[50px] font-mono text-[11px]">${shortDate}</th>`;
        }).join('')}
        <th class="p-3 text-center bg-emerald-50 text-emerald-800">P</th>
        <th class="p-3 text-center bg-rose-50 text-rose-800">FI</th>
        <th class="p-3 text-center bg-amber-50 text-amber-800">FJ</th>
        <th class="p-3 text-center bg-orange-50 text-orange-800">R</th>
        <th class="p-3 text-center bg-blue-50 text-blue-800">E</th>
        <th class="p-3 text-center">% Asis</th>
        <th class="p-3 text-center">Acción</th>
      </tr>
    </thead>
  `;

  if (finalLearners.length === 0) {
    table.innerHTML = thead + `
      <tbody>
        <tr>
          <td colspan="${10 + filteredDates.length}" class="p-8 text-center text-slate-400 font-semibold">
            No se encontraron registros de asistencia bajo los filtros seleccionados para la Ficha ${ficha.codigo}.
          </td>
        </tr>
      </tbody>
    `;
    return;
  }

  const tbody = finalLearners.map(a => {
    const dayCells = filteredDates.map(d => {
      const st = APP_STATE.asistencias[d] ? APP_STATE.asistencias[d][a.documento] : null;
      let badge = '<span class="text-slate-300 font-bold">-</span>';
      if (st === 'presente') badge = '<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">P</span>';
      else if (st === 'injustificada') badge = '<span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">FI</span>';
      else if (st === 'justificada') badge = '<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">FJ</span>';
      else if (st === 'retardo') badge = '<span class="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-bold text-[10px]">R</span>';
      else if (st === 'excusado') badge = '<span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">E</span>';

      return `<td class="p-2.5 text-center">${badge}</td>`;
    }).join('');

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 ${a.isAtRisk ? 'bg-rose-50/40' : ''}">
        <td class="p-3 font-bold text-slate-900 sticky left-0 bg-white z-10">${a.nombres} ${a.apellidos}</td>
        <td class="p-3 font-mono text-slate-600">${a.documento}</td>
        ${dayCells}
        <td class="p-3 text-center font-bold text-emerald-700 bg-emerald-50/50">${a.p}</td>
        <td class="p-3 text-center font-bold text-rose-700 bg-rose-50/50">${a.fi}</td>
        <td class="p-3 text-center font-bold text-amber-700 bg-amber-50/50">${a.fj}</td>
        <td class="p-3 text-center font-bold text-orange-700 bg-orange-50/50">${a.r}</td>
        <td class="p-3 text-center font-bold text-blue-700 bg-blue-50/50">${a.e}</td>
        <td class="p-3 text-center font-mono font-black ${a.percent < 80 ? 'text-rose-600' : 'text-emerald-700'}">${a.percent}%</td>
        <td class="p-3 text-center">
          ${a.isAtRisk ? `
            <button onclick="prefillAndOpenLlamado('${a.documento}', 'inasistencia', 'Acumulación de ${a.fi} inasistencias injustificadas.')" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer">
              Generar Acta
            </button>
          ` : '<span class="text-slate-400 text-xs">Normal</span>'}
        </td>
      </tr>
    `;
  }).join('');

  table.innerHTML = thead + `<tbody class="divide-y divide-slate-100">${tbody}</tbody>`;
}

// =========================================================================
// 10. VIEW 6: CONSULTA DE NOTAS (3 MODES: RAPs, ACTIVIDADES, BOLETÍN)
// =========================================================================
let currentNotasMode = 1;

function setNotasViewMode(mode) {
  currentNotasMode = mode;
  for (let i = 1; i <= 3; i++) {
    const btn = document.getElementById(`btn-notas-mode-${i}`);
    const container = document.getElementById(`container-notas-mode-${i}`);
    if (i === mode) {
      if (btn) btn.className = 'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer bg-[#002B7F] text-white shadow-xs';
      if (container) container.classList.remove('hidden');
    } else {
      if (btn) btn.className = 'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer text-slate-600 hover:bg-slate-50';
      if (container) container.classList.add('hidden');
    }
  }

  renderConsultaNotasTable();
  if (window.lucide) window.lucide.createIcons();
}

function filterConsultaNotasView() {
  renderConsultaNotasTable();
}

function renderConsultaNotasTable() {
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  const fichaCompetencias = getCompetenciasForFicha(ficha.codigo);

  const searchQuery = (document.getElementById('input-search-consulta-notas') ? document.getElementById('input-search-consulta-notas').value : '').toLowerCase().trim();
  const filterState = document.getElementById('select-filter-consulta-notas') ? document.getElementById('select-filter-consulta-notas').value : 'todos';

  const raps = [];
  fichaCompetencias.forEach(c => {
    (c.resultados || []).forEach(r => raps.push({ id: r.id, codigo: r.codigo, desc: r.descripcion, compCodigo: c.codigo }));
  });

  let learners = fichaAprendices.filter(a => {
    if (searchQuery) {
      const matchName = `${a.nombres} ${a.apellidos}`.toLowerCase().includes(searchQuery);
      const matchDoc = a.documento.toLowerCase().includes(searchQuery);
      if (!matchName && !matchDoc) return false;
    }
    return true;
  });

  // MODE 1: SÁBANA DE RAPs
  const tableMode1 = document.getElementById('table-sabana-notas-full');
  if (tableMode1) {
    const thead = `
      <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
        <tr>
          <th class="p-3 sticky left-0 bg-slate-100 z-10">Aprendiz</th>
          <th class="p-3">Documento</th>
          ${raps.map(r => `<th class="p-3 text-center" title="[${r.compCodigo}] ${r.desc}">${r.codigo}</th>`).join('')}
          <th class="p-3 text-center bg-emerald-50 text-emerald-800">% Avance</th>
          <th class="p-3 text-center">Estado</th>
        </tr>
      </thead>
    `;

    if (learners.length === 0) {
      tableMode1.innerHTML = thead + `
        <tbody>
          <tr>
            <td colspan="${4 + raps.length}" class="p-8 text-center text-slate-400 font-semibold">
              No hay aprendices o notas registradas para la Ficha ${ficha.codigo}.
            </td>
          </tr>
        </tbody>
      `;
    } else {
      const tbody = learners.map(a => {
        let aprobados = 0, noAprobados = 0, enBlanco = 0;

        const rapTds = raps.map(r => {
          const key = `${a.documento}_${r.id}`;
          const cal = APP_STATE.calificaciones[key];
          const state = cal ? cal.estado : 'en_blanco';

          let badge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200">-</span>';
          if (state === 'aprobado') {
            aprobados++;
            badge = '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">A</span>';
          } else if (state === 'no_aprobado') {
            noAprobados++;
            badge = '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">NA</span>';
          } else {
            enBlanco++;
          }

          return `<td class="p-3 text-center">${badge}</td>`;
        }).join('');

        if (filterState === 'aprobados' && noAprobados > 0) return '';
        if (filterState === 'no_aprobados' && noAprobados === 0) return '';
        if (filterState === 'en_blanco' && enBlanco === 0) return '';

        const totalRaps = raps.length || 1;
        const perc = Math.round((aprobados / totalRaps) * 100);

        return `
          <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-bold text-slate-900 sticky left-0 bg-white z-10">${a.nombres} ${a.apellidos}</td>
            <td class="p-3 font-mono text-slate-600">${a.documento}</td>
            ${rapTds}
            <td class="p-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/40">${perc}%</td>
            <td class="p-3 text-center">
              ${noAprobados > 0 ? '<span class="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">Con Pendientes</span>' : '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Al Día</span>'}
            </td>
          </tr>
        `;
      }).join('');

      tableMode1.innerHTML = thead + `<tbody class="divide-y divide-slate-100">${tbody}</tbody>`;
    }
  }

  // MODE 2: POR ACTIVIDADES
  const tableMode2 = document.getElementById('table-notas-actividades');
  if (tableMode2) {
    const thead2 = `
      <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
        <tr>
          <th class="p-3 sticky left-0 bg-slate-100 z-10">Aprendiz</th>
          <th class="p-3">Documento</th>
          ${APP_STATE.activities.map(act => `
            <th class="p-3 text-center min-w-[140px]" title="${act.nombre}">
              <div class="font-mono text-[10px] text-blue-800">${act.codigo}</div>
              <div class="text-[10px] text-slate-500 font-normal">${act.rapCodigo}</div>
            </th>
          `).join('')}
        </tr>
      </thead>
    `;

    if (learners.length === 0) {
      tableMode2.innerHTML = thead2 + `
        <tbody>
          <tr>
            <td colspan="${2 + APP_STATE.activities.length}" class="p-8 text-center text-slate-400 font-semibold">
              No hay aprendices registrados para la Ficha ${ficha.codigo}.
            </td>
          </tr>
        </tbody>
      `;
    } else {
      const tbody2 = learners.map(a => {
        const actTds = APP_STATE.activities.map(act => {
          const key = `${a.documento}_${act.rapCodigo.replace('-', '')}`;
          const cal = APP_STATE.calificaciones[key] || { estado: 'en_blanco' };
          
          let label = '<span class="px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 bg-slate-100">En Blanco (-)</span>';
          if (cal.estado === 'aprobado') label = '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">Aprobado</span>';
          else if (cal.estado === 'no_aprobado') label = '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800">No Aprobado</span>';

          return `<td class="p-3 text-center">${label}</td>`;
        }).join('');

        return `
          <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-bold text-slate-900 sticky left-0 bg-white z-10">${a.nombres} ${a.apellidos}</td>
            <td class="p-3 font-mono text-slate-600">${a.documento}</td>
            ${actTds}
          </tr>
        `;
      }).join('');

      tableMode2.innerHTML = thead2 + `<tbody class="divide-y divide-slate-100">${tbody2}</tbody>`;
    }
  }

  // MODE 3: BOLETÍN INDIVIDUAL
  const selectBoletin = document.getElementById('select-boletin-aprendiz');
  if (selectBoletin) {
    selectBoletin.innerHTML = fichaAprendices.map(a => `
      <option value="${a.documento}">${a.nombres} ${a.apellidos} (${a.documento})</option>
    `).join('');
    if (fichaAprendices.length > 0) {
      renderBoletinIndividual(fichaAprendices[0].documento);
    } else {
      const container = document.getElementById('card-boletin-individual-content');
      if (container) {
        container.innerHTML = `<div class="p-8 text-center text-slate-400 font-semibold">No hay aprendices registrados para la Ficha ${ficha.codigo}.</div>`;
      }
    }
  }
}

function renderBoletinIndividual(documento) {
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  const fichaCompetencias = getCompetenciasForFicha(ficha.codigo);

  const learner = fichaAprendices.find(a => a.documento === documento) || fichaAprendices[0];
  const container = document.getElementById('card-boletin-individual-content');
  if (!learner || !container) {
    if (container) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400 font-semibold">No hay aprendiz seleccionado en la Ficha ${ficha.codigo}.</div>`;
    }
    return;
  }

  const raps = [];
  fichaCompetencias.forEach(c => {
    (c.resultados || []).forEach(r => raps.push({ ...r, compCodigo: c.codigo, compNombre: c.nombre }));
  });

  let aprobados = 0, noAprobados = 0, enBlanco = 0;

  const rapsRows = raps.map(r => {
    const key = `${learner.documento}_${r.id}`;
    const cal = APP_STATE.calificaciones[key] || { estado: 'en_blanco', feedback: '', planRecuperacion: '' };
    
    let badge = '<span class="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded text-xs">Sin Calificar</span>';
    if (cal.estado === 'aprobado') {
      aprobados++;
      badge = '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black rounded text-xs">APROBADO (A)</span>';
    } else if (cal.estado === 'no_aprobado') {
      noAprobados++;
      badge = '<span class="px-2.5 py-1 bg-rose-100 text-rose-800 font-black rounded text-xs">NO APROBADO (NA)</span>';
    } else {
      enBlanco++;
    }

    return `
      <tr class="border-b border-slate-100 text-xs">
        <td class="p-3 font-mono font-bold text-blue-900">${r.codigo}</td>
        <td class="p-3">
          <div class="font-semibold text-slate-800">${r.descripcion}</div>
          <div class="text-[10px] text-slate-500 font-mono">Norma: ${r.compCodigo}</div>
          ${cal.planRecuperacion ? `<div class="mt-1 text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded font-medium">Plan Concertado: ${cal.planRecuperacion}</div>` : ''}
        </td>
        <td class="p-3 text-center">${badge}</td>
        <td class="p-3 text-slate-600">${cal.feedback || 'Sin observaciones'}</td>
      </tr>
    `;
  }).join('');

  const perc = Math.round((aprobados / (raps.length || 1)) * 100);

  container.innerHTML = `
    <!-- Header Learner Data -->
    <div class="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="space-y-1 text-center md:text-left">
        <h4 class="text-base font-bold text-slate-900">${learner.nombres} ${learner.apellidos}</h4>
        <p class="text-xs text-slate-500">Documento: <strong class="font-mono text-slate-800">${learner.documento}</strong> • Ficha: <span class="font-bold text-blue-900">${ficha.codigo}</span> (${ficha.programa})</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-center p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">Avance Académico</span>
          <span class="text-lg font-black text-emerald-700 font-mono">${perc}%</span>
        </div>
        <button onclick="window.print()" class="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer">
          <i data-lucide="printer" class="w-4 h-4"></i>
          <span>Imprimir Boletín</span>
        </button>
      </div>
    </div>

    <!-- Table of Results -->
    <div class="overflow-x-auto border border-slate-200 rounded-2xl overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-slate-100 text-slate-700 font-bold text-xs border-b border-slate-200">
          <tr>
            <th class="p-3 w-20">RAP</th>
            <th class="p-3">Resultado de Aprendizaje / Evidencia</th>
            <th class="p-3 text-center w-36">Juicio Evaluativo</th>
            <th class="p-3">Retroalimentación del Instructor</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          ${rapsRows}
        </tbody>
      </table>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

// =========================================================================
// 11. VIEW 7: LLAMADOS DE ATENCIÓN & ACTAS DISCIPLINARIAS
// =========================================================================
function renderLlamadosCards() {
  const container = document.getElementById('container-llamados-cards');
  if (!container) return;

  if (APP_STATE.llamados.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
        <i data-lucide="shield-check" class="w-10 h-10 mx-auto mb-2 text-emerald-500"></i>
        <p class="font-bold text-sm text-slate-700">No hay llamados de atención registrados</p>
        <span class="text-xs text-slate-500">Todos los aprendices cumplen satisfactoriamente con la asistencia y compromisos.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = APP_STATE.llamados.map(l => `
    <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="font-mono font-bold text-xs bg-rose-100 text-rose-900 px-2.5 py-0.5 rounded-md border border-rose-200">
            ${l.numeroActa}
          </span>
          <span class="font-bold text-slate-900 text-sm">${l.aprendizNombre}</span>
          <span class="text-xs font-mono text-slate-500">(${l.aprendizDocumento})</span>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed"><strong>Motivo:</strong> ${l.motivo}</p>
        <span class="text-[11px] text-slate-400 block">Fecha: ${l.fecha} • Tipo: ${l.tipo}</span>
      </div>

      <button onclick="openPrintableActaModal('${l.id}')" class="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer shrink-0">
        <i data-lucide="printer" class="w-4 h-4"></i>
        <span>Ver / Imprimir Acta Oficial</span>
      </button>
    </div>
  `).join('');
}

function prefillAndOpenLlamado(doc, tipo, motivo) {
  const selLearner = document.getElementById('select-nuevo-llamado-aprendiz');
  selLearner.innerHTML = APP_STATE.aprendices.map(a => `
    <option value="${a.documento}" ${a.documento === doc ? 'selected' : ''}>
      ${a.nombres} ${a.apellidos} (${a.documento})
    </option>
  `).join('');

  document.getElementById('select-nuevo-llamado-tipo').value = tipo;
  document.getElementById('input-nuevo-llamado-fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('input-nuevo-llamado-motivo').value = motivo;
  document.getElementById('input-nuevo-llamado-compromiso').value = 'El aprendiz se compromete a no reincidir en inasistencias y presentar oportunamente las evidencias formativas pendientes.';

  openModal('modal-nuevo-llamado');
}

async function submitNuevoLlamado() {
  const doc = document.getElementById('select-nuevo-llamado-aprendiz').value;
  const learner = APP_STATE.aprendices.find(a => a.documento === doc);
  const tipo = document.getElementById('select-nuevo-llamado-tipo').value;
  const fecha = document.getElementById('input-nuevo-llamado-fecha').value;
  const motivo = document.getElementById('input-nuevo-llamado-motivo').value;
  const compromiso = document.getElementById('input-nuevo-llamado-compromiso').value;

  const nuevo = {
    id: `llamado_${Date.now()}`,
    numeroActa: `ACTA-${new Date().getFullYear()}-00${APP_STATE.llamados.length + 1}`,
    aprendizDocumento: doc,
    aprendizNombre: learner ? `${learner.nombres} ${learner.apellidos}` : 'Aprendiz SENA',
    tipo: tipo,
    fecha: fecha,
    motivo: motivo,
    compromiso: compromiso
  };

  APP_STATE.llamados.unshift(nuevo);
  saveToLocalStorage();
  renderLlamadosCards();
  renderSidebar();
  closeModal('modal-nuevo-llamado');

  if (supabaseClient) {
    await supabaseClient.from('llamados_atencion').insert({
      numero_acta: nuevo.numeroActa,
      aprendiz_documento: nuevo.aprendizDocumento,
      aprendiz_nombre: nuevo.aprendizNombre,
      tipo: nuevo.tipo,
      fecha: nuevo.fecha,
      motivo: nuevo.motivo,
      compromiso: nuevo.compromiso
    });
  }

  openPrintableActaModal(nuevo.id);
}

function openPrintableActaModal(id) {
  const l = APP_STATE.llamados.find(item => item.id === id);
  if (!l) return;

  const ficha = getCurrentFicha();
  document.getElementById('acta-doc-numero').textContent = l.numeroActa;
  document.getElementById('acta-doc-fecha').textContent = l.fecha;
  document.getElementById('acta-doc-aprendiz').textContent = l.aprendizNombre;
  document.getElementById('acta-doc-documento').textContent = l.aprendizDocumento;
  document.getElementById('acta-doc-ficha').textContent = `${ficha.codigo} • ${ficha.programa || 'ADSO'}`;
  document.getElementById('acta-doc-tipo').textContent = l.tipo === 'inasistencia' ? 'Inasistencia Injustificada (3 Faltas)' : 'Compromiso Académico';
  document.getElementById('acta-doc-motivo').textContent = l.motivo;
  document.getElementById('acta-doc-compromiso').textContent = l.compromiso;
  document.getElementById('acta-doc-firma-instructor').textContent = `${APP_STATE.instructorProfile.nombres} ${APP_STATE.instructorProfile.apellidos}`;

  openModal('modal-acta-pdf');
}

// =========================================================================
// 12. VIEW 8: VISTA APRENDIZ & STORAGE PHOTO ENGINE
// =========================================================================
function renderLearnerPortal() {
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  const fichaCompetencias = getCompetenciasForFicha(ficha.codigo);

  const learner = fichaAprendices.find(a => a.documento === APP_STATE.currentUserDoc) || fichaAprendices[0] || APP_STATE.aprendices[0];
  if (!learner) return;

  const selLearner = document.getElementById('select-active-learner-view');
  if (selLearner) {
    selLearner.innerHTML = fichaAprendices.map(a => `
      <option value="${a.documento}" ${a.documento === learner.documento ? 'selected' : ''}>
        ${a.nombres} ${a.apellidos} (${a.documento})
      </option>
    `).join('');
  }

  document.getElementById('portal-aprendiz-name').textContent = `${learner.nombres} ${learner.apellidos}`;
  document.getElementById('portal-aprendiz-doc').textContent = learner.documento;
  document.getElementById('portal-aprendiz-email').textContent = learner.correo;
  document.getElementById('portal-aprendiz-ficha-badge').textContent = `Ficha ${ficha.codigo} • ${ficha.programa || 'ADSO'}`;

  const avatar = document.getElementById('portal-aprendiz-avatar');
  if (avatar) {
    if (learner.foto) {
      avatar.innerHTML = `<img src="${learner.foto}" class="w-full h-full object-cover">`;
    } else {
      avatar.innerHTML = `<i data-lucide="user" class="w-10 h-10"></i>`;
    }
  }

  // Metrics
  const dates = Object.keys(APP_STATE.asistencias);
  let p = 0, fi = 0, fj = 0;
  dates.forEach(d => {
    const st = APP_STATE.asistencias[d] ? APP_STATE.asistencias[d][learner.documento] : null;
    if (st === 'presente') p++;
    else if (st === 'injustificada') fi++;
    else if (st === 'justificada') fj++;
  });

  const asisContainer = document.getElementById('portal-asistencia-metrics');
  if (asisContainer) {
    asisContainer.innerHTML = `
      <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl"><strong class="text-emerald-800 text-lg font-black block">${p}</strong><span class="text-[11px] text-slate-500 font-semibold">Asistencias</span></div>
      <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl"><strong class="text-rose-800 text-lg font-black block">${fi}</strong><span class="text-[11px] text-slate-500 font-semibold">Injustificadas</span></div>
      <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl"><strong class="text-amber-800 text-lg font-black block">${fj}</strong><span class="text-[11px] text-slate-500 font-semibold">Justificadas</span></div>
    `;
  }

  // RAPs List
  const rapsList = document.getElementById('portal-raps-list');
  if (rapsList) {
    const raps = [];
    fichaCompetencias.forEach(c => {
      (c.resultados || []).forEach(r => raps.push({ ...r, compCodigo: c.codigo }));
    });

    rapsList.innerHTML = raps.map(r => {
      const key = `${learner.documento}_${r.id}`;
      const cal = APP_STATE.calificaciones[key];
      const state = cal ? cal.estado : 'en_blanco';

      let badge = '<span class="px-2.5 py-0.5 rounded text-[10px] font-bold text-slate-500 bg-slate-100">En Blanco</span>';
      if (state === 'aprobado') badge = '<span class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">Aprobado</span>';
      else if (state === 'no_aprobado') badge = '<span class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800">No Aprobado</span>';

      return `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <strong class="text-xs text-slate-800 block">[${r.codigo}] ${r.descripcion.substring(0, 42)}...</strong>
            <span class="text-[10px] text-slate-500">Norma: ${r.compCodigo}</span>
          </div>
          ${badge}
        </div>
      `;
    }).join('');
  }
}

function changeLearnerPortalView(doc) {
  APP_STATE.currentUserDoc = doc;
  renderLearnerPortal();
}

async function handleLearnerPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const statusBadge = document.getElementById('portal-upload-status');
  statusBadge.classList.remove('hidden');
  statusBadge.textContent = 'Subiendo fotografía a Supabase Storage...';

  const res = await uploadToSupabaseStorage(file, `aprendices/${APP_STATE.currentUserDoc}`);
  if (res.success) {
    const idx = APP_STATE.aprendices.findIndex(a => a.documento === APP_STATE.currentUserDoc);
    if (idx !== -1) {
      APP_STATE.aprendices[idx].foto = res.url;
      
      if (supabaseClient) {
        await supabaseClient.from('aprendices').update({ foto: res.url }).eq('documento', APP_STATE.currentUserDoc);
      }
      
      saveToLocalStorage();
      renderLearnerPortal();
      statusBadge.textContent = '¡Foto guardada en Supabase Storage!';
      setTimeout(() => statusBadge.classList.add('hidden'), 4000);
    }
  }
}

async function handleInstructorPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const res = await uploadToSupabaseStorage(file, 'instructores');
  if (res.success) {
    APP_STATE.instructorProfile.foto = res.url;
    
    if (supabaseClient) {
      await supabaseClient.from('instructores').update({ foto: res.url }).eq('documento', APP_STATE.instructorProfile.documento);
    }

    const preview = document.getElementById('preview-modal-instructor-avatar');
    if (preview) preview.innerHTML = `<img src="${res.url}" class="w-full h-full object-cover">`;

    saveToLocalStorage();
    renderTopNavigation();
    renderSidebar();
    alert('¡Foto del instructor guardada en Supabase Storage!');
  }
}

function openInstructorProfileModal() {
  document.getElementById('input-prof-nombres').value = APP_STATE.instructorProfile.nombres;
  document.getElementById('input-prof-apellidos').value = APP_STATE.instructorProfile.apellidos;
  document.getElementById('input-prof-documento').value = APP_STATE.instructorProfile.documento;
  document.getElementById('input-prof-email').value = APP_STATE.instructorProfile.email;
  document.getElementById('input-prof-cargo').value = APP_STATE.instructorProfile.cargo;
  document.getElementById('input-prof-centro').value = APP_STATE.instructorProfile.centroFormacion;

  const prev = document.getElementById('preview-modal-instructor-avatar');
  if (prev && APP_STATE.instructorProfile.foto) {
    prev.innerHTML = `<img src="${APP_STATE.instructorProfile.foto}" class="w-full h-full object-cover">`;
  }
  openModal('modal-perfil-instructor');
}

async function saveInstructorProfileData() {
  APP_STATE.instructorProfile.nombres = document.getElementById('input-prof-nombres').value.trim();
  APP_STATE.instructorProfile.apellidos = document.getElementById('input-prof-apellidos').value.trim();
  APP_STATE.instructorProfile.documento = document.getElementById('input-prof-documento').value.trim();
  APP_STATE.instructorProfile.email = document.getElementById('input-prof-email').value.trim();
  APP_STATE.instructorProfile.cargo = document.getElementById('input-prof-cargo').value.trim();
  APP_STATE.instructorProfile.centroFormacion = document.getElementById('input-prof-centro').value.trim();

  saveToLocalStorage();
  renderTopNavigation();
  renderSidebar();
  renderPanelGeneral();
  closeModal('modal-perfil-instructor');

  if (supabaseClient) {
    await supabaseClient.from('instructores').upsert({
      documento: APP_STATE.instructorProfile.documento,
      nombres: APP_STATE.instructorProfile.nombres,
      apellidos: APP_STATE.instructorProfile.apellidos,
      email: APP_STATE.instructorProfile.email,
      cargo: APP_STATE.instructorProfile.cargo,
      centro_formacion: APP_STATE.instructorProfile.centroFormacion,
      foto: APP_STATE.instructorProfile.foto || null
    }, { onConflict: 'documento' });
  }

  alert('¡Perfil del instructor actualizado y sincronizado en Supabase!');
}

// =========================================================================
// 13. EXCEL IMPORT / EXPORT (SHEETJS ENGINE)
// =========================================================================
function handleExcelFileUpload(event) {
  const file = event.target.files[0];
  if (!file || typeof XLSX === 'undefined') return;
  const currentFicha = getCurrentFicha();

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(firstSheet);

      if (json.length > 0) {
        const parsedAprendices = json.map((r, idx) => {
          const doc = String(r['Documento'] || r['Numero Documento'] || r['DOCUMENTO'] || `${1000000000 + idx}`).trim();
          const nombres = String(r['Nombres'] || r['Nombre'] || r['NOMBRES'] || 'Aprendiz').trim();
          const apellidos = String(r['Apellidos'] || r['Apellido'] || r['APELLIDOS'] || '').trim();
          const correo = String(r['Correo'] || r['Email'] || r['CORREO'] || `${doc}@misena.edu.co`).trim();

          return {
            id: `ap_${Date.now()}_${idx}`,
            fichaCodigo: currentFicha.codigo,
            tipoDoc: 'CC',
            documento: doc,
            nombres: nombres,
            apellidos: apellidos,
            correo: correo,
            usuario: doc,
            password: doc,
            estado: 'En Formación',
            foto: '',
            rachaAsistencia: 100,
            fallasConsecutivas: 0
          };
        });

        // Merge keeping other fichas intact
        APP_STATE.aprendices = [
          ...APP_STATE.aprendices.filter(a => a.fichaCodigo && a.fichaCodigo !== currentFicha.codigo),
          ...parsedAprendices
        ];

        saveToLocalStorage();
        renderAllViews();
        
        await syncDataToSupabase();
        alert(`¡Carga masiva completada! Se registraron ${parsedAprendices.length} aprendices en la Ficha ${currentFicha.codigo}.`);
      }
    } catch (err) {
      alert(`Error al leer archivo Excel: ${err.message}`);
    }
  };
  reader.readAsArrayBuffer(file);
}

function downloadExcelTemplate() {
  if (typeof XLSX === 'undefined') return;
  const data = [
    { 'TipoDocumento': 'CC', 'Documento': '1001234567', 'Nombres': 'Carlos', 'Apellidos': 'Pérez Gómez', 'Correo': 'carlos.perez@misena.edu.co', 'Estado': 'En Formación' },
    { 'TipoDocumento': 'TI', 'Documento': '1002345678', 'Nombres': 'Ana María', 'Apellidos': 'Gómez Restrepo', 'Correo': 'ana.gomez@misena.edu.co', 'Estado': 'En Formación' }
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
  XLSX.writeFile(wb, 'Plantilla_Aprendices_SENA.xlsx');
}

function exportAttendanceToExcel() {
  if (typeof XLSX === 'undefined') return;
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  
  // Only export days that actually have attendance records for active ficha
  const validDates = Object.keys(APP_STATE.asistencias)
    .filter(d => {
      if (!d || !APP_STATE.asistencias[d]) return false;
      return fichaAprendices.some(a => APP_STATE.asistencias[d][a.documento] !== undefined && APP_STATE.asistencias[d][a.documento] !== null && APP_STATE.asistencias[d][a.documento] !== '');
    })
    .sort();

  const rows = fichaAprendices.map(a => {
    const row = { 'Documento': a.documento, 'Aprendiz': `${a.nombres} ${a.apellidos}` };
    let p = 0, fi = 0, fj = 0, r = 0, e = 0;
    
    validDates.forEach(d => {
      const st = APP_STATE.asistencias[d] ? APP_STATE.asistencias[d][a.documento] : 'presente';
      row[d] = st === 'presente' ? 'P' : (st === 'injustificada' ? 'FI' : (st === 'justificada' ? 'FJ' : (st === 'retardo' ? 'R' : 'E')));
      if (st === 'presente') p++;
      else if (st === 'injustificada') fi++;
      else if (st === 'justificada') fj++;
      else if (st === 'retardo') r++;
      else if (st === 'excusado') e++;
    });

    row['Total P'] = p;
    row['Total FI'] = fi;
    row['Total FJ'] = fj;
    row['Total R'] = r;
    row['Total E'] = e;
    row['% Asistencia'] = `${Math.round((p / (validDates.length || 1)) * 100)}%`;

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
  XLSX.writeFile(wb, `Reporte_Asistencia_Ficha_${ficha.codigo}.xlsx`);
}

function exportNotasToExcel() {
  if (typeof XLSX === 'undefined') return;
  const ficha = getCurrentFicha();
  const fichaAprendices = getAprendicesForFicha(ficha.codigo);
  const fichaCompetencias = getCompetenciasForFicha(ficha.codigo);

  const rows = fichaAprendices.map(a => {
    const row = { 'Documento': a.documento, 'Aprendiz': `${a.nombres} ${a.apellidos}` };
    let aprobados = 0, total = 0;
    fichaCompetencias.forEach(c => {
      (c.resultados || []).forEach(r => {
        total++;
        const cal = APP_STATE.calificaciones[`${a.documento}_${r.id}`];
        const st = cal ? cal.estado : 'en_blanco';
        row[`${c.codigo}_${r.codigo}`] = st === 'aprobado' ? 'A' : (st === 'no_aprobado' ? 'NA' : '-');
        if (st === 'aprobado') aprobados++;
      });
    });
    row['% Aprobación'] = `${Math.round((aprobados / (total || 1)) * 100)}%`;
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SabanaNotas');
  XLSX.writeFile(wb, `Sabana_Notas_Ficha_${ficha.codigo}.xlsx`);
}

function copySqlScript() {
  const code = document.getElementById('code-sql-snippet').innerText;
  navigator.clipboard.writeText(code);
  alert('¡Script SQL copiado al portapapeles!');
}

// =========================================================================
// 14. INITIALIZATION AT DOM CONTENT LOADED
// =========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  loadFromLocalStorage();

  const isLogged = localStorage.getItem('academix_logged_in') === 'true';
  if (isLogged) {
    APP_STATE.isLoggedIn = true;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
  } else {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
    selectLoginRole('instructor');
  }

  await fetchRealDataFromSupabase();
  renderAllViews();
});
