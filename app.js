/**
 * ACADEMIX SENA - Standalone HTML5/JS Application Engine
 * Gestión de Fichas, Asistencia, Juicios RAPs, Llamados de Atención y Storage de Fotos
 */

// ================= SUPABASE CLIENT CONFIGURATION =================
const SUPABASE_URL = 'https://gusbmqyaiacyllexfkkc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rCcY7oDdFQ7up5W4QGuACA_zdHJezBo';

let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase JS Client initialized successfully.');
  } catch (err) {
    console.warn('Supabase initialization fallback:', err);
  }
}

// ================= APPLICATION STATE =================
const STATE = {
  currentRole: 'instructor', // 'instructor' | 'aprendiz'
  currentLearnerDoc: '1001234567',
  fichas: [
    {
      codigo: '2670142',
      programa: 'Tecnólogo en Análisis y Desarrollo de Software (ADSO)',
      jornada: 'Diurna',
      ambiente: 'Ambiente de Sistemas 204',
      instructorLider: 'Ing. Carlos Rodríguez',
      centroFormacion: 'Centro de Servicios y Gestión Empresarial',
      regional: 'Antioquia'
    },
    {
      codigo: '2560311',
      programa: 'Tecnólogo en Animación 3D y Modelado Digital',
      jornada: 'Mixta',
      ambiente: 'Laboratorio de Render 102',
      instructorLider: 'Ing. Carlos Rodríguez',
      centroFormacion: 'Centro de Servicios y Gestión Empresarial',
      regional: 'Antioquia'
    }
  ],
  currentFichaCode: '2670142',
  aprendices: [],
  competencias: [],
  asistencias: {}, // { "2026-09-18": { "1001234567": "presente", ... } }
  calificaciones: {}, // { "1001234567_RAP1": { estado: "aprobado", feedback: "..." } }
  llamados: [],
  instructorProfile: {
    nombres: 'Carlos',
    apellidos: 'Rodríguez',
    documento: '71234567',
    email: 'carlos.rodriguez@sena.edu.co',
    cargo: 'Instructor Técnico Líder ADSO',
    centroFormacion: 'Centro de Servicios y Gestión Empresarial',
    foto: '',
    firmaDigital: 'Ing. Carlos Rodríguez'
  }
};

// Default Sample Learners (Used if database is empty initially)
const DEFAULT_APRENDICES = [
  { id: '1', documento: '1001234567', nombres: 'Juan David', apellidos: 'Pérez Gómez', correo: 'juan.perez@misena.edu.co', password: '1001234567', estado: 'activo', foto: '' },
  { id: '2', documento: '1002345678', nombres: 'María Camila', apellidos: 'González Restrepo', correo: 'maria.gonzalez@misena.edu.co', password: '1002345678', estado: 'activo', foto: '' },
  { id: '3', documento: '1003456789', nombres: 'Andrés Felipe', apellidos: 'Martínez López', correo: 'andres.martinez@misena.edu.co', password: '1003456789', estado: 'activo', foto: '' },
  { id: '4', documento: '1004567890', nombres: 'Laura Sofía', apellidos: 'Rodríguez Castro', correo: 'laura.rodriguez@misena.edu.co', password: '1004567890', estado: 'activo', foto: '' },
  { id: '5', documento: '1005678901', nombres: 'Mateo', apellidos: 'Ospina Ramírez', correo: 'mateo.ospina@misena.edu.co', password: '1005678901', estado: 'activo', foto: '' }
];

const DEFAULT_COMPETENCIAS = [
  {
    codigo: '220501096',
    nombre: 'Desarrollar la estructura de datos y lógica del software',
    horas: 180,
    resultados: [
      { id: 'RAP1', codigo: 'RAP-01', descripcion: 'Diseñar la base de datos relacional de acuerdo con los requerimientos del sistema.' },
      { id: 'RAP2', codigo: 'RAP-02', descripcion: 'Construir la capa de persistencia y consultas SQL optimizadas.' }
    ]
  },
  {
    codigo: '220501097',
    nombre: 'Implementar la arquitectura frontend según lineamientos de diseño',
    horas: 160,
    resultados: [
      { id: 'RAP3', codigo: 'RAP-03', descripcion: 'Maquetar interfaces de usuario accesibles y adaptables a dispositivos móviles.' },
      { id: 'RAP4', codigo: 'RAP-04', descripcion: 'Integrar componentes interactivos y consumo de servicios web API REST.' }
    ]
  }
];

// ================= STORAGE PERSISTENCE (LOCAL + SUPABASE) =================
function loadLocalState() {
  try {
    const saved = localStorage.getItem('academix_sena_html_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      STATE.fichas = parsed.fichas || STATE.fichas;
      STATE.currentFichaCode = parsed.currentFichaCode || STATE.currentFichaCode;
      STATE.aprendices = parsed.aprendices && parsed.aprendices.length ? parsed.aprendices : DEFAULT_APRENDICES;
      STATE.competencias = parsed.competencias && parsed.competencias.length ? parsed.competencias : DEFAULT_COMPETENCIAS;
      STATE.asistencias = parsed.asistencias || {};
      STATE.calificaciones = parsed.calificaciones || {};
      STATE.llamados = parsed.llamados || [];
      STATE.instructorProfile = parsed.instructorProfile || STATE.instructorProfile;
      STATE.currentRole = parsed.currentRole || 'instructor';
      STATE.currentLearnerDoc = parsed.currentLearnerDoc || '1001234567';
    } else {
      STATE.aprendices = DEFAULT_APRENDICES;
      STATE.competencias = DEFAULT_COMPETENCIAS;
    }
  } catch (e) {
    console.error('Error loading local state:', e);
    STATE.aprendices = DEFAULT_APRENDICES;
    STATE.competencias = DEFAULT_COMPETENCIAS;
  }
}

function saveLocalState() {
  try {
    localStorage.setItem('academix_sena_html_state', JSON.stringify({
      fichas: STATE.fichas,
      currentFichaCode: STATE.currentFichaCode,
      aprendices: STATE.aprendices,
      competencias: STATE.competencias,
      asistencias: STATE.asistencias,
      calificaciones: STATE.calificaciones,
      llamados: STATE.llamados,
      instructorProfile: STATE.instructorProfile,
      currentRole: STATE.currentRole,
      currentLearnerDoc: STATE.currentLearnerDoc
    }));
  } catch (e) {
    console.error('Error saving local state:', e);
  }
}

// ================= SUPABASE CLOUD OPERATIONS =================
async function syncDataWithSupabase() {
  if (!supabaseClient) return { success: false, message: 'Cliente Supabase no disponible.' };

  try {
    // 1. Fetch current ficha aprendices
    const { data: aprendicesDb, error: apErr } = await supabaseClient
      .from('aprendices')
      .select('*')
      .eq('ficha_codigo', STATE.currentFichaCode);

    if (!apErr && aprendicesDb && aprendicesDb.length > 0) {
      STATE.aprendices = aprendicesDb.map(a => ({
        id: a.id || a.documento,
        documento: a.documento,
        nombres: a.nombres,
        apellidos: a.apellidos || '',
        correo: a.correo || a.email || '',
        password: a.password || a.documento,
        estado: a.estado || 'activo',
        foto: a.foto || ''
      }));
    }

    // 2. Fetch instructor profile
    const { data: instData } = await supabaseClient
      .from('instructores')
      .select('*')
      .limit(1);

    if (instData && instData.length > 0) {
      const i = instData[0];
      STATE.instructorProfile = {
        nombres: i.nombres || STATE.instructorProfile.nombres,
        apellidos: i.apellidos || STATE.instructorProfile.apellidos,
        documento: i.documento || STATE.instructorProfile.documento,
        email: i.email || STATE.instructorProfile.email,
        cargo: i.cargo || STATE.instructorProfile.cargo,
        centroFormacion: i.centro_formacion || STATE.instructorProfile.centroFormacion,
        foto: i.foto || STATE.instructorProfile.foto,
        firmaDigital: i.firma_digital || STATE.instructorProfile.firmaDigital
      };
    }

    saveLocalState();
    renderAllViews();
    return { success: true, message: `Sincronizados ${STATE.aprendices.length} aprendices desde Supabase.` };
  } catch (err) {
    console.warn('Supabase fetch notice:', err);
    return { success: false, message: err.message };
  }
}

async function pushDataToSupabase() {
  if (!supabaseClient) return { success: false, message: 'Cliente Supabase no configurado.' };

  try {
    // 1. Upsert Ficha
    const currentFicha = getCurrentFicha();
    await supabaseClient.from('fichas').upsert({
      codigo: currentFicha.codigo,
      programa: currentFicha.programa,
      jornada: currentFicha.jornada,
      ambiente: currentFicha.ambiente,
      instructor_lider: currentFicha.instructorLider
    }, { onConflict: 'codigo' });

    // 2. Upsert Aprendices with passwords
    const records = STATE.aprendices.map(a => ({
      documento: a.documento,
      nombres: a.nombres,
      apellidos: a.apellidos || '',
      correo: a.correo || '',
      password: a.password || a.documento,
      estado: a.estado || 'activo',
      ficha_codigo: currentFicha.codigo,
      foto: a.foto || null
    }));

    const { error: apErr } = await supabaseClient.from('aprendices').upsert(records, { onConflict: 'documento' });
    if (apErr) throw apErr;

    // 3. Upsert Instructor Profile
    await supabaseClient.from('instructores').upsert({
      documento: STATE.instructorProfile.documento,
      nombres: STATE.instructorProfile.nombres,
      apellidos: STATE.instructorProfile.apellidos,
      email: STATE.instructorProfile.email,
      cargo: STATE.instructorProfile.cargo,
      centro_formacion: STATE.instructorProfile.centroFormacion,
      foto: STATE.instructorProfile.foto || null,
      firma_digital: STATE.instructorProfile.firmaDigital
    }, { onConflict: 'documento' });

    return { success: true, message: `¡${STATE.aprendices.length} aprendices y ficha sincronizados en Supabase!` };
  } catch (err) {
    return { success: false, message: `Aviso al enviar: ${err.message}` };
  }
}

// Upload file directly to Supabase Storage Bucket 'perfiles'
async function uploadPhotoToSupabaseStorage(file, folderPrefix = 'general') {
  if (!supabaseClient) {
    // Fallback to local Base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ success: true, url: reader.result, isLocal: true });
      reader.readAsDataURL(file);
    });
  }

  try {
    const ext = file.name.split('.').pop();
    const fileName = `${folderPrefix}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { data, error } = await supabaseClient.storage
      .from('perfiles')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
      console.warn('Supabase storage fallback to dataUrl:', error.message);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ success: true, url: reader.result, isLocal: true, warning: error.message });
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabaseClient.storage.from('perfiles').getPublicUrl(data.path);
    return { success: true, url: publicUrlData.publicUrl, isLocal: false };
  } catch (err) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ success: true, url: reader.result, isLocal: true, warning: err.message });
      reader.readAsDataURL(file);
    });
  }
}

// ================= DOM HELPERS & NAVIGATION =================
function getCurrentFicha() {
  return STATE.fichas.find(f => f.codigo === STATE.currentFichaCode) || STATE.fichas[0];
}

function switchView(viewName) {
  document.querySelectorAll('.view-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active', 'bg-slate-100', 'text-emerald-700'));

  const targetView = document.getElementById(`view-${viewName}`);
  const targetTab = document.querySelector(`.nav-tab[data-view="${viewName}"]`);

  if (targetView) targetView.classList.remove('hidden');
  if (targetTab) targetTab.classList.add('active', 'bg-slate-100', 'text-emerald-700');

  // Trigger Lucide icons reload
  if (window.lucide) window.lucide.createIcons();
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('hidden');
    m.classList.remove('flex');
  }
}

// ================= RENDER FUNCTIONS =================
function renderAllViews() {
  renderHeader();
  renderPanelGeneral();
  renderCargarInfo();
  renderTomaAsistencia();
  renderCalificaciones();
  renderConsultaAsistencia();
  renderConsultaNotas();
  renderLlamados();
  renderVistaAprendiz();
  if (window.lucide) window.lucide.createIcons();
}

function renderHeader() {
  const ficha = getCurrentFicha();
  
  // Ficha Selector
  const selectFicha = document.getElementById('select-ficha');
  if (selectFicha) {
    selectFicha.innerHTML = STATE.fichas.map(f => `
      <option value="${f.codigo}" ${f.codigo === STATE.currentFichaCode ? 'selected' : ''}>
        Ficha ${f.codigo} - ${f.jornada}
      </option>
    `).join('');
  }

  // Instructor Info in Header
  const nameEl = document.getElementById('header-instructor-name');
  if (nameEl) nameEl.textContent = `${STATE.instructorProfile.nombres} ${STATE.instructorProfile.apellidos}`;

  const avatarEl = document.getElementById('header-avatar');
  if (avatarEl) {
    if (STATE.instructorProfile.foto) {
      avatarEl.innerHTML = `<img src="${STATE.instructorProfile.foto}" class="w-full h-full object-cover" alt="Instructor">`;
    } else {
      avatarEl.innerHTML = `<i data-lucide="user" class="w-4 h-4"></i>`;
    }
  }

  // Role Button Label
  const roleLabel = document.getElementById('btn-role-label');
  if (roleLabel) {
    roleLabel.textContent = STATE.currentRole === 'instructor' ? 'Modo Instructor' : 'Modo Aprendiz';
  }
}

function renderPanelGeneral() {
  const ficha = getCurrentFicha();
  
  document.getElementById('banner-ficha-code').textContent = ficha.codigo;
  document.getElementById('banner-ficha-programa').textContent = ficha.programa;
  document.getElementById('banner-ficha-jornada').textContent = `Jornada ${ficha.jornada}`;
  document.getElementById('banner-ficha-centro').textContent = ficha.centroFormacion;
  document.getElementById('banner-ficha-ambiente').textContent = ficha.ambiente;
  document.getElementById('banner-ficha-instructor').textContent = ficha.instructorLider;

  // Metrics
  document.getElementById('metric-total-aprendices').textContent = STATE.aprendices.length;
  document.getElementById('metric-total-competencias').textContent = STATE.competencias.length;
  
  const totalRaps = STATE.competencias.reduce((acc, c) => acc + (c.resultados ? c.resultados.length : 0), 0);
  document.getElementById('metric-total-raps').textContent = totalRaps;
  document.getElementById('metric-total-llamados').textContent = STATE.llamados.length;

  // Competencias List
  const compContainer = document.getElementById('dashboard-competencias-list');
  if (compContainer) {
    compContainer.innerHTML = STATE.competencias.map(c => `
      <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
            ${c.codigo}
          </span>
          <span class="text-[11px] font-semibold text-slate-500">${c.horas} Horas</span>
        </div>
        <h3 class="font-bold text-slate-900 text-xs">${c.nombre}</h3>
        <div class="space-y-1 pt-1 border-t border-slate-200">
          ${(c.resultados || []).map(r => `
            <div class="text-[11px] text-slate-600 flex items-start gap-1.5">
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
  document.getElementById('count-preview-aprendices').textContent = STATE.aprendices.length;
  const tbody = document.getElementById('tbody-cargar-aprendices');
  if (!tbody) return;

  tbody.innerHTML = STATE.aprendices.map((a, i) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-3 font-mono text-slate-400 font-bold">${i + 1}</td>
      <td class="p-3 font-mono font-bold text-slate-800">${a.documento}</td>
      <td class="p-3 font-semibold text-slate-900">${a.nombres} ${a.apellidos}</td>
      <td class="p-3 text-slate-600">${a.correo}</td>
      <td class="p-3 font-mono text-slate-500 bg-slate-50">${a.password || a.documento}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
          ${a.estado}
        </span>
      </td>
    </tr>
  `).join('');
}

function renderTomaAsistencia() {
  const fechaInput = document.getElementById('input-asistencia-fecha');
  if (fechaInput && !fechaInput.value) {
    fechaInput.value = new Date().toISOString().split('T')[0];
  }

  const currentDate = fechaInput ? fechaInput.value : new Date().toISOString().split('T')[0];
  const dayAttendance = STATE.asistencias[currentDate] || {};

  const tbody = document.getElementById('tbody-toma-asistencia');
  if (!tbody) return;

  tbody.innerHTML = STATE.aprendices.map((a, i) => {
    const estado = dayAttendance[a.documento] || 'presente';
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-mono text-slate-400 font-bold">${i + 1}</td>
        <td class="p-3">
          <div class="font-bold text-slate-900">${a.nombres} ${a.apellidos}</div>
          <div class="text-[10px] text-slate-500">${a.correo}</div>
        </td>
        <td class="p-3 font-mono font-bold text-slate-700">${a.documento}</td>
        <td class="p-3">
          <div class="flex items-center justify-center gap-1.5 flex-wrap">
            <button onclick="setAsistenciaStatus('${a.documento}', 'presente')" class="px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${estado === 'presente' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">P</button>
            <button onclick="setAsistenciaStatus('${a.documento}', 'injustificada')" class="px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${estado === 'injustificada' ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" title="Falta Injustificada">FI</button>
            <button onclick="setAsistenciaStatus('${a.documento}', 'justificada')" class="px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${estado === 'justificada' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" title="Falta Justificada">FJ</button>
            <button onclick="setAsistenciaStatus('${a.documento}', 'retardo')" class="px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${estado === 'retardo' ? 'bg-orange-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" title="Retardo">R</button>
          </div>
        </td>
        <td class="p-3">
          <input type="text" placeholder="Observación..." class="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-slate-50">
        </td>
      </tr>
    `;
  }).join('');
}

function setAsistenciaStatus(documento, status) {
  const currentDate = document.getElementById('input-asistencia-fecha').value;
  if (!STATE.asistencias[currentDate]) STATE.asistencias[currentDate] = {};
  STATE.asistencias[currentDate][documento] = status;
  saveLocalState();
  renderTomaAsistencia();
}

function renderCalificaciones() {
  const selectComp = document.getElementById('select-calificar-competencia');
  if (selectComp && selectComp.children.length === 0) {
    const allRaps = [];
    STATE.competencias.forEach(c => {
      (c.resultados || []).forEach(r => {
        allRaps.push({ rapId: r.id, label: `[${c.codigo}] ${r.codigo} - ${r.descripcion.substring(0, 45)}...` });
      });
    });
    selectComp.innerHTML = allRaps.map(r => `<option value="${r.rapId}">${r.label}</option>`).join('');
  }

  const selectedRap = selectComp ? selectComp.value || 'RAP1' : 'RAP1';
  const tbody = document.getElementById('tbody-calificaciones');
  if (!tbody) return;

  tbody.innerHTML = STATE.aprendices.map((a, i) => {
    const key = `${a.documento}_${selectedRap}`;
    const item = STATE.calificaciones[key] || { estado: 'aprobado', feedback: '' };
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-mono text-slate-400 font-bold">${i + 1}</td>
        <td class="p-3 font-bold text-slate-900">${a.nombres} ${a.apellidos}</td>
        <td class="p-3 font-mono text-slate-700">${a.documento}</td>
        <td class="p-3 text-center">
          <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 gap-1">
            <button onclick="setJuicioEvaluativo('${a.documento}', '${selectedRap}', 'aprobado')" class="px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition ${item.estado === 'aprobado' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}">Aprobado (A)</button>
            <button onclick="setJuicioEvaluativo('${a.documento}', '${selectedRap}', 'no_aprobado')" class="px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition ${item.estado === 'no_aprobado' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}">No Aprobado (D)</button>
          </div>
        </td>
        <td class="p-3">
          <input type="text" value="${item.feedback || ''}" onchange="setJuicioFeedback('${a.documento}', '${selectedRap}', this.value)" placeholder="Observaciones de evidencia..." class="w-full text-xs p-1.5 rounded border border-slate-200 bg-slate-50">
        </td>
      </tr>
    `;
  }).join('');
}

function setJuicioEvaluativo(documento, rapId, estado) {
  const key = `${documento}_${rapId}`;
  if (!STATE.calificaciones[key]) STATE.calificaciones[key] = { estado: 'aprobado', feedback: '' };
  STATE.calificaciones[key].estado = estado;
  saveLocalState();
  renderCalificaciones();
}

function setJuicioFeedback(documento, rapId, feedback) {
  const key = `${documento}_${rapId}`;
  if (!STATE.calificaciones[key]) STATE.calificaciones[key] = { estado: 'aprobado', feedback: '' };
  STATE.calificaciones[key].feedback = feedback;
  saveLocalState();
}

function renderConsultaAsistencia() {
  const tbody = document.getElementById('tbody-consulta-asistencia');
  if (!tbody) return;

  const dates = Object.keys(STATE.asistencias);
  const totalDays = dates.length || 1;

  tbody.innerHTML = STATE.aprendices.map(a => {
    let p = 0, fi = 0, fj = 0, r = 0;
    dates.forEach(d => {
      const st = STATE.asistencias[d][a.documento];
      if (st === 'presente') p++;
      else if (st === 'injustificada') fi++;
      else if (st === 'justificada') fj++;
      else if (st === 'retardo') r++;
    });

    const percent = Math.round((p / totalDays) * 100);
    const hasRisk = fi >= 3;

    return `
      <tr class="hover:bg-slate-50 transition ${hasRisk ? 'bg-red-50/50' : ''}">
        <td class="p-3">
          <div class="font-bold text-slate-900">${a.nombres} ${a.apellidos}</div>
          <div class="text-[10px] text-slate-500">Doc: ${a.documento}</div>
        </td>
        <td class="p-3 text-center font-bold text-emerald-700">${p}</td>
        <td class="p-3 text-center font-bold ${fi > 0 ? 'text-red-700 bg-red-100 rounded' : 'text-slate-400'}">${fi}</td>
        <td class="p-3 text-center font-bold text-amber-700">${fj}</td>
        <td class="p-3 text-center font-bold text-orange-700">${r}</td>
        <td class="p-3 text-center font-mono font-black ${percent < 80 ? 'text-red-600' : 'text-emerald-600'}">${percent}%</td>
        <td class="p-3 text-center">
          ${hasRisk ? `
            <button onclick="prefillLlamado('${a.documento}', 'inasistencia', 'Acumulación de ${fi} faltas injustificadas a formación.')" class="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer">
              Generar Acta
            </button>
          ` : '<span class="text-slate-400 text-[11px]">Normal</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

function renderConsultaNotas() {
  const table = document.getElementById('table-sabana-notas');
  if (!table) return;

  const allRaps = [];
  STATE.competencias.forEach(c => {
    (c.resultados || []).forEach(r => allRaps.push({ id: r.id, codigo: r.codigo }));
  });

  let headerHtml = `
    <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
      <tr>
        <th class="p-3">Aprendiz</th>
        <th class="p-3">Documento</th>
        ${allRaps.map(r => `<th class="p-3 text-center">${r.codigo}</th>`).join('')}
        <th class="p-3 text-center">% Avance</th>
      </tr>
    </thead>
  `;

  let rowsHtml = STATE.aprendices.map(a => {
    let aprobados = 0;
    const rapCols = allRaps.map(r => {
      const key = `${a.documento}_${r.id}`;
      const cal = STATE.calificaciones[key];
      const isApproved = cal ? cal.estado === 'aprobado' : true; // default approved in mock
      if (isApproved) aprobados++;
      return `
        <td class="p-3 text-center font-bold">
          <span class="px-2 py-0.5 rounded text-[10px] ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
            ${isApproved ? 'A' : 'D'}
          </span>
        </td>
      `;
    }).join('');

    const percent = Math.round((aprobados / (allRaps.length || 1)) * 100);

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 bg-white">
        <td class="p-3 font-bold text-slate-900">${a.nombres} ${a.apellidos}</td>
        <td class="p-3 font-mono text-slate-600">${a.documento}</td>
        ${rapCols}
        <td class="p-3 text-center font-mono font-black text-emerald-700">${percent}%</td>
      </tr>
    `;
  }).join('');

  table.innerHTML = headerHtml + `<tbody>${rowsHtml}</tbody>`;
}

function renderLlamados() {
  const container = document.getElementById('container-llamados-list');
  if (!container) return;

  if (STATE.llamados.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
        <i data-lucide="shield-check" class="w-8 h-8 mx-auto mb-2 text-emerald-500"></i>
        <p class="font-bold text-xs">No hay llamados de atención ni actas disciplinarias registradas.</p>
        <span class="text-[11px]">Todos los aprendices cumplen con la asistencia y compromisos.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = STATE.llamados.map(l => `
    <div class="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="font-mono font-bold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">${l.numeroActa}</span>
          <span class="text-xs font-bold text-slate-900">${l.aprendizNombre}</span>
          <span class="text-[11px] text-slate-500 font-mono">(${l.aprendizDocumento})</span>
        </div>
        <p class="text-xs text-slate-600 mt-1"><strong>Motivo:</strong> ${l.motivo}</p>
        <span class="text-[10px] text-slate-400 mt-0.5 block">Fecha: ${l.fecha} • Tipo: ${l.tipo}</span>
      </div>
      <button onclick="openActaPdf('${l.id}')" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0">
        <i data-lucide="printer" class="w-3.5 h-3.5"></i>
        <span>Ver / Imprimir Acta</span>
      </button>
    </div>
  `).join('');
}

function renderVistaAprendiz() {
  const learner = STATE.aprendices.find(a => a.documento === STATE.currentLearnerDoc) || STATE.aprendices[0];
  if (!learner) return;

  const ficha = getCurrentFicha();

  document.getElementById('card-aprendiz-nombre').textContent = `${learner.nombres} ${learner.apellidos}`;
  document.getElementById('card-aprendiz-doc').textContent = learner.documento;
  document.getElementById('card-aprendiz-email').textContent = learner.correo;
  document.getElementById('card-aprendiz-programa').textContent = ficha.programa;
  document.getElementById('card-aprendiz-ficha').textContent = ficha.codigo;

  const avatarContainer = document.getElementById('aprendiz-avatar-img');
  if (avatarContainer) {
    if (learner.foto) {
      avatarContainer.innerHTML = `<img src="${learner.foto}" class="w-full h-full object-cover" alt="${learner.nombres}">`;
    } else {
      avatarContainer.innerHTML = `<i data-lucide="user" class="w-10 h-10 text-slate-400"></i>`;
    }
  }

  // Learner attendance history summary
  const dates = Object.keys(STATE.asistencias);
  let p = 0, fi = 0, fj = 0, r = 0;
  dates.forEach(d => {
    const st = STATE.asistencias[d][learner.documento];
    if (st === 'presente') p++;
    else if (st === 'injustificada') fi++;
    else if (st === 'justificada') fj++;
    else if (st === 'retardo') r++;
  });

  const asisSummary = document.getElementById('aprendiz-asistencia-summary');
  if (asisSummary) {
    asisSummary.innerHTML = `
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg"><strong class="text-emerald-800 text-base block font-black">${p}</strong><span class="text-[10px] text-slate-500">Asistencias</span></div>
        <div class="p-2.5 bg-red-50 border border-red-200 rounded-lg"><strong class="text-red-800 text-base block font-black">${fi}</strong><span class="text-[10px] text-slate-500">Injustificadas</span></div>
        <div class="p-2.5 bg-amber-50 border border-amber-200 rounded-lg"><strong class="text-amber-800 text-base block font-black">${fj}</strong><span class="text-[10px] text-slate-500">Justificadas</span></div>
      </div>
    `;
  }

  // Learner RAPs summary
  const rapsSummary = document.getElementById('aprendiz-calificaciones-summary');
  if (rapsSummary) {
    const allRaps = [];
    STATE.competencias.forEach(c => {
      (c.resultados || []).forEach(r => allRaps.push({ ...r, compCodigo: c.codigo }));
    });

    rapsSummary.innerHTML = allRaps.map(r => {
      const key = `${learner.documento}_${r.id}`;
      const isApproved = STATE.calificaciones[key] ? STATE.calificaciones[key].estado === 'aprobado' : true;
      return `
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <span class="font-bold text-slate-800 block">[${r.codigo}] ${r.descripcion.substring(0, 38)}...</span>
            <span class="text-[10px] text-slate-500">Norma: ${r.compCodigo}</span>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
            ${isApproved ? 'Aprobado' : 'No Aprobado'}
          </span>
        </div>
      `;
    }).join('');
  }
}

// ================= EVENT LISTENERS & SETUP =================
document.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  renderAllViews();
  syncDataWithSupabase();

  // Navigation tab clicks
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view');
      switchView(view);
    });
  });

  // Ficha change dropdown
  const selectFicha = document.getElementById('select-ficha');
  if (selectFicha) {
    selectFicha.addEventListener('change', (e) => {
      STATE.currentFichaCode = e.target.value;
      saveLocalState();
      renderAllViews();
      syncDataWithSupabase();
    });
  }

  // Header Modal Buttons
  document.getElementById('btn-open-supabase').addEventListener('click', () => openModal('modal-supabase'));
  document.getElementById('btn-open-perfil').addEventListener('click', () => {
    document.getElementById('prof-nombres').value = STATE.instructorProfile.nombres;
    document.getElementById('prof-apellidos').value = STATE.instructorProfile.apellidos;
    document.getElementById('prof-documento').value = STATE.instructorProfile.documento;
    document.getElementById('prof-email').value = STATE.instructorProfile.email;
    document.getElementById('prof-cargo').value = STATE.instructorProfile.cargo;
    document.getElementById('prof-centro').value = STATE.instructorProfile.centroFormacion;
    openModal('modal-perfil-instructor');
  });
  document.getElementById('btn-open-login').addEventListener('click', () => openModal('modal-login'));

  // Supabase Modal Tabs
  document.querySelectorAll('.supabase-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.supabase-tab-btn').forEach(b => b.classList.remove('active', 'bg-emerald-600', 'text-white'));
      document.querySelectorAll('.supabase-subtab').forEach(t => t.classList.add('hidden'));

      btn.classList.add('active', 'bg-emerald-600', 'text-white');
      const target = document.getElementById(`supabase-tab-${btn.getAttribute('data-subtab')}`);
      if (target) target.classList.remove('hidden');
    });
  });

  // Supabase Sync Buttons
  document.getElementById('btn-sync-supabase-push').addEventListener('click', async () => {
    const msgEl = document.getElementById('supabase-sync-status-msg');
    msgEl.classList.remove('hidden');
    msgEl.textContent = 'Enviando ficha y aprendices a Supabase...';
    const res = await pushDataToSupabase();
    msgEl.textContent = res.message;
  });

  document.getElementById('btn-sync-supabase-pull').addEventListener('click', async () => {
    const msgEl = document.getElementById('supabase-sync-status-msg');
    msgEl.classList.remove('hidden');
    msgEl.textContent = 'Descargando registros desde Supabase...';
    const res = await syncDataWithSupabase();
    msgEl.textContent = res.message;
  });

  document.getElementById('btn-sync-to-supabase-direct').addEventListener('click', async () => {
    alert('Sincronizando con base de datos Supabase...');
    const res = await pushDataToSupabase();
    alert(res.message);
  });

  // Copy SQL Script Button
  document.getElementById('btn-copy-sql').addEventListener('click', () => {
    const text = document.getElementById('sql-script-content').innerText;
    navigator.clipboard.writeText(text);
    alert('¡Script SQL copiado al portapapeles!');
  });

  // Attendance Controls
  document.getElementById('btn-marcar-todos-presentes').addEventListener('click', () => {
    const curDate = document.getElementById('input-asistencia-fecha').value;
    if (!STATE.asistencias[curDate]) STATE.asistencias[curDate] = {};
    STATE.aprendices.forEach(a => {
      STATE.asistencias[curDate][a.documento] = 'presente';
    });
    saveLocalState();
    renderTomaAsistencia();
  });

  document.getElementById('btn-guardar-asistencia').addEventListener('click', () => {
    saveLocalState();
    alert('¡Asistencia guardada correctamente en el sistema!');
  });

  document.getElementById('input-asistencia-fecha').addEventListener('change', () => {
    renderTomaAsistencia();
  });

  // Qualifications Save
  document.getElementById('btn-guardar-calificaciones').addEventListener('click', () => {
    saveLocalState();
    alert('¡Juicios evaluativos guardados correctamente!');
  });

  document.getElementById('select-calificar-competencia').addEventListener('change', () => {
    renderCalificaciones();
  });

  // Photo Upload for Apprentice to Supabase Storage
  document.getElementById('input-foto-aprendiz').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('aprendiz-photo-status');
    statusEl.classList.remove('hidden');
    statusEl.textContent = 'Subiendo fotografía a Supabase Storage...';

    const res = await uploadPhotoToSupabaseStorage(file, `aprendices/${STATE.currentLearnerDoc}`);
    if (res.success) {
      const idx = STATE.aprendices.findIndex(a => a.documento === STATE.currentLearnerDoc);
      if (idx !== -1) {
        STATE.aprendices[idx].foto = res.url;
        saveLocalState();
        renderVistaAprendiz();
        statusEl.textContent = '¡Foto de perfil actualizada en Supabase Storage!';
        setTimeout(() => statusEl.classList.add('hidden'), 4000);
      }
    }
  });

  // Photo Upload for Instructor to Supabase Storage
  document.getElementById('input-foto-instructor').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const res = await uploadPhotoToSupabaseStorage(file, 'instructores');
    if (res.success) {
      STATE.instructorProfile.foto = res.url;
      const preview = document.getElementById('instructor-profile-preview');
      if (preview) preview.innerHTML = `<img src="${res.url}" class="w-full h-full object-cover">`;
      saveLocalState();
      renderHeader();
      alert('¡Foto de instructor cargada en Supabase Storage!');
    }
  });

  // Instructor Profile Save
  document.getElementById('btn-guardar-perfil-instructor').addEventListener('click', async () => {
    STATE.instructorProfile.nombres = document.getElementById('prof-nombres').value;
    STATE.instructorProfile.apellidos = document.getElementById('prof-apellidos').value;
    STATE.instructorProfile.documento = document.getElementById('prof-documento').value;
    STATE.instructorProfile.email = document.getElementById('prof-email').value;
    STATE.instructorProfile.cargo = document.getElementById('prof-cargo').value;
    STATE.instructorProfile.centroFormacion = document.getElementById('prof-centro').value;

    saveLocalState();
    renderHeader();
    closeModal('modal-perfil-instructor');
    alert('¡Perfil del instructor guardado y sincronizado!');
  });

  // Disciplinary Acts / Llamados
  document.getElementById('btn-abrir-nuevo-llamado').addEventListener('click', () => {
    const selectLearner = document.getElementById('nuevo-llamado-aprendiz');
    selectLearner.innerHTML = STATE.aprendices.map(a => `<option value="${a.documento}">${a.nombres} ${a.apellidos} (${a.documento})</option>`).join('');
    document.getElementById('nuevo-llamado-fecha').value = new Date().toISOString().split('T')[0];
    openModal('modal-nuevo-llamado');
  });

  document.getElementById('btn-guardar-nuevo-llamado').addEventListener('click', () => {
    const doc = document.getElementById('nuevo-llamado-aprendiz').value;
    const learner = STATE.aprendices.find(a => a.documento === doc);
    const tipo = document.getElementById('nuevo-llamado-tipo').value;
    const fecha = document.getElementById('nuevo-llamado-fecha').value;
    const motivo = document.getElementById('nuevo-llamado-motivo').value || 'Inasistencia no justificada a sesiones formativas';
    const compromiso = document.getElementById('nuevo-llamado-compromiso').value || 'El aprendiz se compromete a presentar las evidencias pendientes y regularizar su asistencia.';

    const nuevo = {
      id: `llamado_${Date.now()}`,
      numeroActa: `ACTA-${new Date().getFullYear()}-00${STATE.llamados.length + 1}`,
      aprendizDocumento: doc,
      aprendizNombre: learner ? `${learner.nombres} ${learner.apellidos}` : 'Aprendiz SENA',
      tipo,
      fecha,
      motivo,
      compromiso
    };

    STATE.llamados.unshift(nuevo);
    saveLocalState();
    renderLlamados();
    closeModal('modal-nuevo-llamado');
    openActaPdf(nuevo.id);
  });

  // Login Form Submission
  document.getElementById('btn-submit-login').addEventListener('click', () => {
    const role = document.getElementById('login-role').value;
    const doc = document.getElementById('login-documento').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    const errEl = document.getElementById('login-error-msg');

    if (role === 'instructor') {
      STATE.currentRole = 'instructor';
      saveLocalState();
      closeModal('modal-login');
      renderHeader();
      switchView('panel-general');
    } else {
      const learner = STATE.aprendices.find(a => a.documento === doc);
      if (learner) {
        STATE.currentRole = 'aprendiz';
        STATE.currentLearnerDoc = learner.documento;
        saveLocalState();
        closeModal('modal-login');
        renderHeader();
        switchView('aprendiz');
      } else {
        errEl.textContent = 'Documento no encontrado en la nómina de la ficha.';
        errEl.classList.remove('hidden');
      }
    }
  });

  // Export Asistencia to Excel (SheetJS)
  document.getElementById('btn-export-asistencia-excel').addEventListener('click', () => {
    if (typeof XLSX === 'undefined') {
      alert('Librería XLSX no cargada.');
      return;
    }

    const data = STATE.aprendices.map(a => {
      const row = { 'Documento': a.documento, 'Aprendiz': `${a.nombres} ${a.apellidos}` };
      Object.keys(STATE.asistencias).forEach(d => {
        row[d] = STATE.asistencias[d][a.documento] || 'P';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
    XLSX.writeFile(wb, `Asistencia_Ficha_${STATE.currentFichaCode}.xlsx`);
  });

  // Export Notas to Excel (SheetJS)
  document.getElementById('btn-export-notas-excel').addEventListener('click', () => {
    if (typeof XLSX === 'undefined') return;

    const data = STATE.aprendices.map(a => {
      const row = { 'Documento': a.documento, 'Aprendiz': `${a.nombres} ${a.apellidos}` };
      STATE.competencias.forEach(c => {
        (c.resultados || []).forEach(r => {
          const cal = STATE.calificaciones[`${a.documento}_${r.id}`];
          row[`${c.codigo}_${r.codigo}`] = cal ? (cal.estado === 'aprobado' ? 'A' : 'D') : 'A';
        });
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones');
    XLSX.writeFile(wb, `Notas_Ficha_${STATE.currentFichaCode}.xlsx`);
  });

  // Download Excel Template
  document.getElementById('btn-download-template').addEventListener('click', () => {
    if (typeof XLSX === 'undefined') return;
    const template = [
      { 'TipoDocumento': 'CC', 'Documento': '1001234567', 'Nombres': 'Carlos', 'Apellidos': 'Pérez', 'Correo': 'carlos.perez@misena.edu.co', 'Estado': 'En Formación' },
      { 'TipoDocumento': 'TI', 'Documento': '1002345678', 'Nombres': 'Ana', 'Apellidos': 'Gómez', 'Correo': 'ana.gomez@misena.edu.co', 'Estado': 'En Formación' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Aprendices');
    XLSX.writeFile(wb, 'Plantilla_Aprendices_SENA.xlsx');
  });

  // Excel File Upload Parser
  const excelInput = document.getElementById('input-excel-file');
  if (excelInput) {
    excelInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file || typeof XLSX === 'undefined') return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet);

          if (json.length > 0) {
            const parsedAprendices = json.map((r, idx) => {
              const doc = r['Documento'] || r['Numero Documento'] || r['DOCUMENTO'] || `${1000000000 + idx}`;
              const nombres = r['Nombres'] || r['Nombre'] || r['NOMBRES'] || 'Aprendiz';
              const apellidos = r['Apellidos'] || r['Apellido'] || r['APELLIDOS'] || '';
              const correo = r['Correo'] || r['Email'] || r['CORREO'] || `${doc}@misena.edu.co`;

              return {
                id: `ap_${Date.now()}_${idx}`,
                documento: String(doc).trim(),
                nombres: String(nombres).trim(),
                apellidos: String(apellidos).trim(),
                correo: String(correo).trim(),
                password: String(doc).trim(),
                estado: 'activo',
                foto: ''
              };
            });

            STATE.aprendices = parsedAprendices;
            saveLocalState();
            renderAllViews();
            alert(`¡Se cargaron exitosamente ${parsedAprendices.length} aprendices desde el archivo Excel!`);
          }
        } catch (err) {
          alert(`Error al procesar el archivo Excel: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
});

// Helper for opening Printable Acta
function openActaPdf(llamadoId) {
  const l = STATE.llamados.find(item => item.id === llamadoId);
  if (!l) return;

  const ficha = getCurrentFicha();

  document.getElementById('acta-pdf-numero').textContent = l.numeroActa;
  document.getElementById('acta-pdf-fecha').textContent = l.fecha;
  document.getElementById('acta-pdf-tipo').textContent = l.tipo;
  document.getElementById('acta-pdf-ficha').textContent = `${ficha.codigo} - ${ficha.programa}`;
  document.getElementById('acta-pdf-aprendiz').textContent = `${l.aprendizNombre} (${l.aprendizDocumento})`;
  document.getElementById('acta-pdf-motivo').textContent = l.motivo;
  document.getElementById('acta-pdf-compromiso').textContent = l.compromiso;
  document.getElementById('acta-pdf-firma-instructor').textContent = STATE.instructorProfile.nombres + ' ' + STATE.instructorProfile.apellidos;

  openModal('modal-acta-pdf');
}

function prefillLlamado(documento, tipo, motivo) {
  const learner = STATE.aprendices.find(a => a.documento === documento);
  const selectLearner = document.getElementById('nuevo-llamado-aprendiz');
  selectLearner.innerHTML = STATE.aprendices.map(a => `
    <option value="${a.documento}" ${a.documento === documento ? 'selected' : ''}>
      ${a.nombres} ${a.apellidos} (${a.documento})
    </option>
  `).join('');

  document.getElementById('nuevo-llamado-tipo').value = tipo;
  document.getElementById('nuevo-llamado-fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('nuevo-llamado-motivo').value = motivo;
  document.getElementById('nuevo-llamado-compromiso').value = 'El aprendiz se compromete a no reincidir en inasistencias injustificadas y ponerse al día en las actividades formativas.';

  openModal('modal-nuevo-llamado');
}
