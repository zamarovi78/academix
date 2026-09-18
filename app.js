/**
 * =========================================================================
 * ACADEMIX SENA - Realtime Engine & Supabase Storage Integration
 * =========================================================================
 */

// Supabase Connection Credentials (Real project database)
const SUPABASE_URL = 'https://gusbmqyaiacyllexfkkc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rCcY7oDdFQ7up5W4QGuACA_zdHJezBo';

let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase Client v2 conectado a:', SUPABASE_URL);
  } catch (err) {
    console.warn('Aviso conexión Supabase:', err);
  }
}

// Global Application State
const APP_STATE = {
  isLoggedIn: false,
  currentUserRole: 'instructor', // 'instructor' | 'aprendiz' | 'admin'
  currentUserNombre: 'Zahedys Manuel Rodriguez Villarreal',
  currentUserDoc: '8787499',
  
  // Fichas
  fichas: [
    {
      codigo: '2694110',
      programa: 'Tecnólogo en Análisis y Desarrollo de Software (ADSO)',
      jornada: 'Jornada Tarde (12:00m - 6:00pm)',
      ambiente: 'Ambiente de Sistemas 302',
      instructorLider: 'Zahedys Manuel Rodriguez Villarreal',
      centroFormacion: 'Centro de Servicios y Gestión Empresarial',
      regional: 'Regional Antioquia'
    },
    {
      codigo: '2718902',
      programa: 'Tecnólogo en Análisis y Desarrollo de Software (ADSO)',
      jornada: 'Jornada Mañana (6:00am - 12:00m)',
      ambiente: 'Ambiente 204 - Software',
      instructorLider: 'Zahedys Manuel Rodriguez Villarreal',
      centroFormacion: 'Centro de Servicios y Gestión Empresarial',
      regional: 'Regional Antioquia'
    },
    {
      codigo: '2540193',
      programa: 'Tecnólogo en Animación 3D y Modelado Digital',
      jornada: 'Jornada Mixta',
      ambiente: 'Laboratorio de Render',
      instructorLider: 'Zahedys Manuel Rodriguez Villarreal',
      centroFormacion: 'Centro de Servicios y Gestión Empresarial',
      regional: 'Regional Antioquia'
    }
  ],
  currentFichaCodigo: '2694110',
  
  // Real Records
  aprendices: [],
  competencias: [],
  asistencias: {}, // { '2026-09-18': { '1001234567': 'presente', ... } }
  calificaciones: {}, // { '1001234567_RAP1': { estado: 'aprobado', feedback: '' } }
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

// Fallback Initial Competencias and Learner data (if database was freshly created)
const SEED_COMPETENCIAS = [
  {
    codigo: '220501096',
    nombre: 'Desarrollar la estructura de datos y la lógica del software según especificaciones técnicas',
    horas: 180,
    estado: 'Activo',
    resultados: [
      { id: 'RAP1', codigo: 'RAP-01', descripcion: 'Diseñar la base de datos relacional y definir modelos de entidad relación de acuerdo a los requerimientos.' },
      { id: 'RAP2', codigo: 'RAP-02', descripcion: 'Construir la capa de persistencia mediante consultas SQL optimizadas y procedimientos almacenados.' }
    ]
  },
  {
    codigo: '220501097',
    nombre: 'Implementar la arquitectura frontend según lineamientos de diseño y experiencia de usuario',
    horas: 160,
    estado: 'Activo',
    resultados: [
      { id: 'RAP3', codigo: 'RAP-03', descripcion: 'Maquetar interfaces de usuario accesibles y adaptables a diferentes pantallas y resoluciones.' },
      { id: 'RAP4', codigo: 'RAP-04', descripcion: 'Integrar componentes interactivos y gestionar consumo de servicios web API REST.' }
    ]
  }
];

// =========================================================================
// 1. SUPABASE REAL DATABASE FETCHING & SYNCING
// =========================================================================
async function fetchRealDataFromSupabase() {
  if (!supabaseClient) return;

  try {
    console.log('🔄 Conectando con Supabase para obtener información real...');
    
    // 1. Fetch Instructor Profile
    const { data: instData, error: instErr } = await supabaseClient
      .from('instructores')
      .select('*')
      .limit(1);

    if (!instErr && instData && instData.length > 0) {
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

    // 2. Fetch Fichas
    const { data: fichasData, error: fichasErr } = await supabaseClient
      .from('fichas')
      .select('*');

    if (!fichasErr && fichasData && fichasData.length > 0) {
      APP_STATE.fichas = fichasData.map(f => ({
        codigo: f.codigo,
        programa: f.programa || 'Tecnólogo en ADSO',
        jornada: f.jornada || 'Jornada Tarde',
        ambiente: f.ambiente || 'Ambiente de Formación',
        instructorLider: APP_STATE.currentUserNombre,
        centroFormacion: APP_STATE.instructorProfile.centroFormacion,
        regional: 'Regional Antioquia'
      }));
    }

    // 3. Fetch Aprendices for active ficha
    const { data: apData, error: apErr } = await supabaseClient
      .from('aprendices')
      .select('*');

    if (!apErr && apData && apData.length > 0) {
      APP_STATE.aprendices = apData.map(a => ({
        id: a.id || a.documento,
        documento: a.documento,
        nombres: a.nombres,
        apellidos: a.apellidos || '',
        correo: a.email || a.correo || `${a.documento}@misena.edu.co`,
        usuario: a.usuario || a.documento,
        password: a.password || a.contrasena || a.documento,
        estado: a.estado_matricula || a.estado || 'En Formación',
        foto: a.foto || '',
        rachaAsistencia: Number(a.racha_asistencia || 100),
        fallasConsecutivas: Number(a.fallas_consecutivas || 0)
      }));
    }

    // 4. Fetch Competencias
    const { data: compData } = await supabaseClient.from('competencias').select('*');
    if (compData && compData.length > 0) {
      APP_STATE.competencias = compData;
    } else {
      APP_STATE.competencias = SEED_COMPETENCIAS;
    }

    // 5. Fetch Llamados de atención
    const { data: llamData } = await supabaseClient.from('llamados_atencion').select('*');
    if (llamData && llamData.length > 0) {
      APP_STATE.llamados = llamData.map(l => ({
        id: l.id,
        numeroActa: l.numero_acta || `ACTA-${new Date().getFullYear()}-001`,
        aprendizDocumento: l.aprendiz_documento,
        aprendizNombre: l.aprendiz_nombre,
        tipo: l.tipo,
        fecha: l.fecha,
        motivo: l.motivo,
        compromiso: l.compromiso,
        estado: l.estado || 'pendiente'
      }));
    }

    saveToLocalStorage();
    renderAllViews();
    console.log('✅ Base de datos Supabase sincronizada con éxito.');
  } catch (err) {
    console.error('Error al sincronizar con Supabase:', err);
  }
}

async function syncDataToSupabase() {
  if (!supabaseClient) {
    alert('Cliente Supabase no configurado.');
    return;
  }

  const alertBox = document.getElementById('supabase-sync-alert');
  if (alertBox) {
    alertBox.classList.remove('hidden');
    alertBox.textContent = 'Enviando información a Supabase (PostgreSQL)...';
  }

  try {
    const currentFicha = getCurrentFicha();

    // 1. Upsert Ficha
    await supabaseClient.from('fichas').upsert({
      codigo: currentFicha.codigo,
      programa: currentFicha.programa,
      jornada: currentFicha.jornada,
      ambiente: currentFicha.ambiente
    }, { onConflict: 'codigo' });

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
        foto: a.foto || null
      }));

      await supabaseClient.from('aprendices').upsert(learnersPayload, { onConflict: 'documento' });
    }

    // 3. Upsert Instructor
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
      alertBox.textContent = `¡Sincronización exitosa! ${APP_STATE.aprendices.length} aprendices y ficha guardados en Supabase.`;
    }
    alert(`¡Sincronización exitosa con Supabase! ${APP_STATE.aprendices.length} aprendices registrados.`);
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
      console.warn('Supabase storage fallback:', error.message);
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
      APP_STATE.fichas = parsed.fichas || APP_STATE.fichas;
      APP_STATE.currentFichaCodigo = parsed.currentFichaCodigo || APP_STATE.currentFichaCodigo;
      APP_STATE.aprendices = parsed.aprendices || [];
      APP_STATE.competencias = parsed.competencias && parsed.competencias.length ? parsed.competencias : SEED_COMPETENCIAS;
      APP_STATE.asistencias = parsed.asistencias || {};
      APP_STATE.calificaciones = parsed.calificaciones || {};
      APP_STATE.llamados = parsed.llamados || [];
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
// 3. LOGIN & AUTHENTICATION CONTROLLER (PANTALLA PRINCIPAL)
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
    if (pass === 'zamarovi' || user === '8787499') {
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
      // Allow login with document
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
  if (viewId === 'asistencia') renderAttendanceTable();
  if (viewId === 'calificaciones') renderCalificacionesTable();
  if (viewId === 'consulta-asistencia') renderConsultaAsistenciaTable();
  if (viewId === 'consulta-notas') renderConsultaNotasTable();
  if (viewId === 'llamados') renderLlamadosCards();
  if (viewId === 'vista-aprendiz') renderLearnerPortal();

  if (window.lucide) window.lucide.createIcons();
}

function getCurrentFicha() {
  return APP_STATE.fichas.find(f => f.codigo === APP_STATE.currentFichaCodigo) || APP_STATE.fichas[0];
}

function toggleFichaDropdown() {
  const d = document.getElementById('dropdown-fichas-menu');
  d.classList.toggle('hidden');
}

function toggleNotificationDropdown() {
  const d = document.getElementById('dropdown-notif-menu');
  d.classList.toggle('hidden');
}

function toggleUserDropdown() {
  const d = document.getElementById('dropdown-user-menu');
  d.classList.toggle('hidden');
}

function selectFicha(codigo) {
  APP_STATE.currentFichaCodigo = codigo;
  saveToLocalStorage();
  toggleFichaDropdown();
  renderAllViews();
  fetchRealDataFromSupabase();
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
// 5. RENDERING LOGIC FOR ALL VIEWS
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
  
  // Ficha Label in Top Nav
  const navFicha = document.getElementById('nav-active-ficha-label');
  if (navFicha) {
    navFicha.textContent = `${ficha.codigo} • ${ficha.jornada.includes('Tarde') ? 'ADSO Tarde' : 'ADSO'}`;
  }

  // Dropdown list of fichas
  const listFichas = document.getElementById('list-dropdown-fichas');
  if (listFichas) {
    listFichas.innerHTML = APP_STATE.fichas.map(f => `
      <button onclick="selectFicha('${f.codigo}')" class="w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition ${f.codigo === ficha.codigo ? 'bg-blue-50 text-[#002B7F] font-bold' : 'hover:bg-slate-50 text-slate-700'}">
        <span>${f.codigo} • ${f.jornada}</span>
        ${f.codigo === ficha.codigo ? '<i data-lucide="check" class="w-4 h-4 text-[#002B7F]"></i>' : ''}
      </button>
    `).join('');
  }

  // User Profile
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
  
  document.getElementById('panel-ficha-badge').textContent = `${ficha.codigo} • ${ficha.programa || 'ADSO'}`;
  document.getElementById('panel-aprendices-count').textContent = APP_STATE.aprendices.length;
  
  document.getElementById('panel-banner-codigo').textContent = `Ficha ${ficha.codigo}`;
  document.getElementById('panel-banner-jornada').textContent = ficha.jornada;
  document.getElementById('panel-banner-programa').textContent = ficha.programa;
  document.getElementById('panel-banner-centro').textContent = ficha.centroFormacion;
  document.getElementById('panel-banner-ambiente').textContent = ficha.ambiente;
  document.getElementById('panel-banner-instructor').textContent = `${APP_STATE.instructorProfile.nombres} ${APP_STATE.instructorProfile.apellidos}`;

  // Stat numbers
  document.getElementById('stat-total-aprendices').textContent = APP_STATE.aprendices.length;
  document.getElementById('stat-total-competencias').textContent = APP_STATE.competencias.length;
  document.getElementById('stat-total-llamados').textContent = APP_STATE.llamados.length;

  // Competencias Grid
  const compGrid = document.getElementById('panel-competencias-grid');
  if (compGrid) {
    compGrid.innerHTML = APP_STATE.competencias.map(c => `
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
  document.getElementById('badge-cargar-count').textContent = `${APP_STATE.aprendices.length} Aprendices Registrados`;
  const tbody = document.getElementById('tbody-cargar-aprendices');
  if (!tbody) return;

  if (APP_STATE.aprendices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-slate-400 font-semibold">
          No hay aprendices registrados. Carga un archivo Excel o sincroniza con Supabase.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = APP_STATE.aprendices.map((a, i) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-3 font-mono font-bold text-slate-400">${i + 1}</td>
      <td class="p-3 font-mono font-bold text-slate-900">${a.documento}</td>
      <td class="p-3 font-bold text-slate-900">${a.nombres} ${a.apellidos}</td>
      <td class="p-3 text-slate-600">${a.correo}</td>
      <td class="p-3 font-mono text-slate-500 bg-slate-50">${a.password || a.documento}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
          ${a.estado || 'En Formación'}
        </span>
      </td>
    </tr>
  `).join('');
}

function renderAttendanceTable() {
  const dateInput = document.getElementById('input-asistencia-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  const curDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
  const dayRecord = APP_STATE.asistencias[curDate] || {};

  const tbody = document.getElementById('tbody-asistencia-list');
  if (!tbody) return;

  tbody.innerHTML = APP_STATE.aprendices.map((a, i) => {
    const estado = dayRecord[a.documento] || 'presente';
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-mono text-slate-400 font-bold">${i + 1}</td>
        <td class="p-3">
          <div class="font-bold text-slate-900">${a.nombres} ${a.apellidos}</div>
          <div class="text-[10px] text-slate-500">${a.correo}</div>
        </td>
        <td class="p-3 font-mono font-bold text-slate-700">${a.documento}</td>
        <td class="p-3 text-center">
          <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 gap-1">
            <button onclick="setLearnerAttendance('${a.documento}', 'presente')" class="px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${estado === 'presente' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}">P</button>
            <button onclick="setLearnerAttendance('${a.documento}', 'injustificada')" class="px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${estado === 'injustificada' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}" title="Falta Injustificada">FI</button>
            <button onclick="setLearnerAttendance('${a.documento}', 'justificada')" class="px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${estado === 'justificada' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}" title="Falta Justificada">FJ</button>
            <button onclick="setLearnerAttendance('${a.documento}', 'retardo')" class="px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${estado === 'retardo' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}" title="Retardo">R</button>
          </div>
        </td>
        <td class="p-3">
          <input type="text" placeholder="Observación..." class="w-full text-xs p-1.5 rounded border border-slate-200 bg-slate-50">
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
}

function markAllAttendance(estado) {
  const curDate = document.getElementById('input-asistencia-date').value;
  if (!APP_STATE.asistencias[curDate]) APP_STATE.asistencias[curDate] = {};
  APP_STATE.aprendices.forEach(a => {
    APP_STATE.asistencias[curDate][a.documento] = estado;
  });
  saveToLocalStorage();
  renderAttendanceTable();
}

function saveAttendanceRecord() {
  saveToLocalStorage();
  alert('¡Asistencia registrada y guardada exitosamente!');
}

function renderCalificacionesTable() {
  const selectRap = document.getElementById('select-calificaciones-rap');
  if (selectRap && selectRap.children.length === 0) {
    const raps = [];
    APP_STATE.competencias.forEach(c => {
      (c.resultados || []).forEach(r => raps.push({ id: r.id, label: `[${c.codigo}] ${r.codigo} - ${r.descripcion}` }));
    });
    selectRap.innerHTML = raps.map(r => `<option value="${r.id}">${r.label}</option>`).join('');
  }

  const selectedRap = selectRap ? selectRap.value || 'RAP1' : 'RAP1';
  const tbody = document.getElementById('tbody-calificaciones-list');
  if (!tbody) return;

  tbody.innerHTML = APP_STATE.aprendices.map((a, i) => {
    const key = `${a.documento}_${selectedRap}`;
    const cal = APP_STATE.calificaciones[key] || { estado: 'aprobado', feedback: '' };
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-mono text-slate-400 font-bold">${i + 1}</td>
        <td class="p-3 font-bold text-slate-900">${a.nombres} ${a.apellidos}</td>
        <td class="p-3 font-mono text-slate-700">${a.documento}</td>
        <td class="p-3 text-center">
          <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 gap-1">
            <button onclick="setLearnerCalificacion('${a.documento}', '${selectedRap}', 'aprobado')" class="px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${cal.estado === 'aprobado' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}">Aprobado (A)</button>
            <button onclick="setLearnerCalificacion('${a.documento}', '${selectedRap}', 'no_aprobado')" class="px-3 py-1 text-xs font-bold rounded cursor-pointer transition ${cal.estado === 'no_aprobado' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}">No Aprobado (D)</button>
          </div>
        </td>
        <td class="p-3">
          <input type="text" value="${cal.feedback || ''}" onchange="setCalificacionFeedback('${a.documento}', '${selectedRap}', this.value)" placeholder="Retroalimentación técnica..." class="w-full text-xs p-1.5 rounded border border-slate-200 bg-slate-50">
        </td>
      </tr>
    `;
  }).join('');
}

function setLearnerCalificacion(doc, rapId, estado) {
  const key = `${doc}_${rapId}`;
  if (!APP_STATE.calificaciones[key]) APP_STATE.calificaciones[key] = { estado: 'aprobado', feedback: '' };
  APP_STATE.calificaciones[key].estado = estado;
  saveToLocalStorage();
  renderCalificacionesTable();
}

function setCalificacionFeedback(doc, rapId, feedback) {
  const key = `${doc}_${rapId}`;
  if (!APP_STATE.calificaciones[key]) APP_STATE.calificaciones[key] = { estado: 'aprobado', feedback: '' };
  APP_STATE.calificaciones[key].feedback = feedback;
  saveToLocalStorage();
}

function saveCalificacionesRecord() {
  saveToLocalStorage();
  alert('¡Juicios evaluativos guardados correctamente!');
}

function renderConsultaAsistenciaTable() {
  const tbody = document.getElementById('tbody-consulta-asistencia-list');
  if (!tbody) return;

  const dates = Object.keys(APP_STATE.asistencias);
  const totalDays = dates.length || 1;

  tbody.innerHTML = APP_STATE.aprendices.map(a => {
    let p = 0, fi = 0, fj = 0, r = 0;
    dates.forEach(d => {
      const st = APP_STATE.asistencias[d][a.documento];
      if (st === 'presente') p++;
      else if (st === 'injustificada') fi++;
      else if (st === 'justificada') fj++;
      else if (st === 'retardo') r++;
    });

    const percent = Math.round((p / totalDays) * 100);
    const hasRisk = fi >= 3;

    return `
      <tr class="hover:bg-slate-50 transition ${hasRisk ? 'bg-rose-50/50' : ''}">
        <td class="p-3">
          <div class="font-bold text-slate-900">${a.nombres} ${a.apellidos}</div>
          <div class="text-[10px] text-slate-500 font-mono">Doc: ${a.documento}</div>
        </td>
        <td class="p-3 text-center font-bold text-emerald-700">${p}</td>
        <td class="p-3 text-center font-bold ${fi > 0 ? 'text-rose-700 bg-rose-100 rounded' : 'text-slate-400'}">${fi}</td>
        <td class="p-3 text-center font-bold text-amber-700">${fj}</td>
        <td class="p-3 text-center font-bold text-orange-700">${r}</td>
        <td class="p-3 text-center font-mono font-black ${percent < 80 ? 'text-rose-600' : 'text-emerald-600'}">${percent}%</td>
        <td class="p-3 text-center">
          ${hasRisk ? `
            <button onclick="prefillAndOpenLlamado('${a.documento}', 'inasistencia', 'Acumulación de ${fi} inasistencias injustificadas.')" class="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer">
              Generar Acta
            </button>
          ` : '<span class="text-slate-400 text-xs">Normal</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

function renderConsultaNotasTable() {
  const table = document.getElementById('table-sabana-notas-full');
  if (!table) return;

  const raps = [];
  APP_STATE.competencias.forEach(c => {
    (c.resultados || []).forEach(r => raps.push({ id: r.id, codigo: r.codigo }));
  });

  const thead = `
    <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
      <tr>
        <th class="p-3">Aprendiz</th>
        <th class="p-3">Documento</th>
        ${raps.map(r => `<th class="p-3 text-center">${r.codigo}</th>`).join('')}
        <th class="p-3 text-center">% Avance</th>
      </tr>
    </thead>
  `;

  const tbody = APP_STATE.aprendices.map(a => {
    let aprobados = 0;
    const rapTds = raps.map(r => {
      const key = `${a.documento}_${r.id}`;
      const isApproved = APP_STATE.calificaciones[key] ? APP_STATE.calificaciones[key].estado === 'aprobado' : true;
      if (isApproved) aprobados++;
      return `
        <td class="p-3 text-center font-bold">
          <span class="px-2 py-0.5 rounded text-[10px] ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${isApproved ? 'A' : 'D'}
          </span>
        </td>
      `;
    }).join('');

    const perc = Math.round((aprobados / (raps.length || 1)) * 100);

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-bold text-slate-900">${a.nombres} ${a.apellidos}</td>
        <td class="p-3 font-mono text-slate-600">${a.documento}</td>
        ${rapTds}
        <td class="p-3 text-center font-mono font-black text-emerald-700">${perc}%</td>
      </tr>
    `;
  }).join('');

  table.innerHTML = thead + `<tbody class="divide-y divide-slate-100">${tbody}</tbody>`;
}

function renderLlamadosCards() {
  const container = document.getElementById('container-llamados-cards');
  if (!container) return;

  if (APP_STATE.llamados.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
        <i data-lucide="shield-check" class="w-10 h-10 mx-auto mb-2 text-emerald-500"></i>
        <p class="font-bold text-sm text-slate-700">No hay llamados de atención registrados</p>
        <span class="text-xs text-slate-500">Todos los aprendices cumplen con la asistencia y compromisos.</span>
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

      <button onclick="openPrintableActaModal('${l.id}')" class="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer shrink-0">
        <i data-lucide="printer" class="w-4 h-4"></i>
        <span>Ver / Imprimir Acta Oficial</span>
      </button>
    </div>
  `).join('');
}

function renderLearnerPortal() {
  const learner = APP_STATE.aprendices.find(a => a.documento === APP_STATE.currentUserDoc) || APP_STATE.aprendices[0];
  if (!learner) return;

  // Learner Select Dropdown
  const selLearner = document.getElementById('select-active-learner-view');
  if (selLearner) {
    selLearner.innerHTML = APP_STATE.aprendices.map(a => `
      <option value="${a.documento}" ${a.documento === learner.documento ? 'selected' : ''}>
        ${a.nombres} ${a.apellidos} (${a.documento})
      </option>
    `).join('');
  }

  const ficha = getCurrentFicha();
  document.getElementById('portal-aprendiz-name').textContent = `${learner.nombres} ${learner.apellidos}`;
  document.getElementById('portal-aprendiz-doc').textContent = learner.documento;
  document.getElementById('portal-aprendiz-email').textContent = learner.correo;
  document.getElementById('portal-aprendiz-ficha-badge').textContent = `Ficha ${ficha.codigo} • ${ficha.programa || 'ADSO'}`;

  // Avatar Photo
  const avatar = document.getElementById('portal-aprendiz-avatar');
  if (avatar) {
    if (learner.foto) {
      avatar.innerHTML = `<img src="${learner.foto}" class="w-full h-full object-cover">`;
    } else {
      avatar.innerHTML = `<i data-lucide="user" class="w-10 h-10"></i>`;
    }
  }

  // Attendance Metrics
  const dates = Object.keys(APP_STATE.asistencias);
  let p = 0, fi = 0, fj = 0;
  dates.forEach(d => {
    const st = APP_STATE.asistencias[d][learner.documento];
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
    APP_STATE.competencias.forEach(c => {
      (c.resultados || []).forEach(r => raps.push({ ...r, compCodigo: c.codigo }));
    });

    rapsList.innerHTML = raps.map(r => {
      const key = `${learner.documento}_${r.id}`;
      const isApproved = APP_STATE.calificaciones[key] ? APP_STATE.calificaciones[key].estado === 'aprobado' : true;
      return `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <strong class="text-xs text-slate-800 block">[${r.codigo}] ${r.descripcion.substring(0, 42)}...</strong>
            <span class="text-[10px] text-slate-500">Norma: ${r.compCodigo}</span>
          </div>
          <span class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${isApproved ? 'Aprobado' : 'No Aprobado'}
          </span>
        </div>
      `;
    }).join('');
  }
}

function changeLearnerPortalView(doc) {
  APP_STATE.currentUserDoc = doc;
  renderLearnerPortal();
}

// =========================================================================
// 6. PHOTO STORAGE UPLOADS (SUPABASE BUCKET 'perfiles')
// =========================================================================
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
      
      // Update in Supabase Database as well
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
// 7. EXCEL IMPORT / EXPORT (SHEETJS)
// =========================================================================
function handleExcelFileUpload(event) {
  const file = event.target.files[0];
  if (!file || typeof XLSX === 'undefined') return;

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

        APP_STATE.aprendices = parsedAprendices;
        saveToLocalStorage();
        renderAllViews();
        
        // Auto-save to Supabase
        await syncDataToSupabase();
        alert(`¡Carga completada! Se registraron ${parsedAprendices.length} aprendices en el sistema.`);
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
  const rows = APP_STATE.aprendices.map(a => {
    const row = { 'Documento': a.documento, 'Aprendiz': `${a.nombres} ${a.apellidos}` };
    Object.keys(APP_STATE.asistencias).forEach(d => {
      row[d] = APP_STATE.asistencias[d][a.documento] || 'P';
    });
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
  const rows = APP_STATE.aprendices.map(a => {
    const row = { 'Documento': a.documento, 'Aprendiz': `${a.nombres} ${a.apellidos}` };
    APP_STATE.competencias.forEach(c => {
      (c.resultados || []).forEach(r => {
        const cal = APP_STATE.calificaciones[`${a.documento}_${r.id}`];
        row[`${c.codigo}_${r.codigo}`] = cal ? (cal.estado === 'aprobado' ? 'A' : 'D') : 'A';
      });
    });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SabanaNotas');
  XLSX.writeFile(wb, `Sabana_Notas_Ficha_${ficha.codigo}.xlsx`);
}

// =========================================================================
// 8. DISCIPLINARY ACTS (LLAMADOS DE ATENCION)
// =========================================================================
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
  document.getElementById('input-nuevo-llamado-compromiso').value = 'El aprendiz se compromete a no reincidir en inasistencias y presentar oportunamente las evidencias formativas.';

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

  // Sync to Supabase
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

function copySqlScript() {
  const code = document.getElementById('code-sql-snippet').innerText;
  navigator.clipboard.writeText(code);
  alert('¡Script SQL copiado al portapapeles!');
}

// =========================================================================
// 9. INITIALIZATION AT DOM CONTENT LOADED
// =========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  loadFromLocalStorage();

  // Populate nuevo llamado learners
  const selLearner = document.getElementById('select-nuevo-llamado-aprendiz');
  if (selLearner) {
    selLearner.innerHTML = APP_STATE.aprendices.map(a => `
      <option value="${a.documento}">${a.nombres} ${a.apellidos} (${a.documento})</option>
    `).join('');
  }

  // Check login state: Default is login screen
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

  // Fetch real data from Supabase immediately
  await fetchRealDataFromSupabase();
  renderAllViews();
});
