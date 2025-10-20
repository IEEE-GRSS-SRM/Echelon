// Profile Setup Modern Script
const SUPABASE_URL = 'https://asccuwumidjqcwdcmsrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzY2N1d3VtaWRqcWN3ZGNtc3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjk1OTQsImV4cCI6MjA2Njg0NTU5NH0.eqmYPNdSoIjvAxKFlR4c-xQzW4FomEWSEe7nv-X4mFU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements
const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');
const userPicEl = document.getElementById('user-picture');
const adminSelect = document.getElementById('admin-select');
const adminSearch = document.getElementById('admin-search');
const continueBtn = document.getElementById('continue-btn');
const continueSpinner = document.getElementById('continue-spinner');
const continueText = document.getElementById('continue-text');
const logoutBtn = document.getElementById('logout-btn');
const adminSkeleton = document.getElementById('admin-skeleton');
const searchWrapper = document.getElementById('search-wrapper');
const selectWrapper = document.getElementById('select-wrapper');
const adminEmpty = document.getElementById('admin-empty');
const tipBox = document.getElementById('tip-box');
const profileStatus = document.getElementById('profile-status');
const adminStatus = document.getElementById('admin-status');
const uploadsStatus = document.getElementById('uploads-status');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// User data from login
const userName = localStorage.getItem('userName');
const userEmail = localStorage.getItem('userEmail');
const userPicture = localStorage.getItem('userPicture');
const userId = localStorage.getItem('userId');

function notify(msg,type='info') {
  const popup = document.getElementById('pop-up');
  popup.classList.remove('bg-indigo-600','bg-green-600','bg-red-600','bg-yellow-500');
  popup.classList.add(type==='error'?'bg-red-600':type==='success'?'bg-green-600':type==='warn'?'bg-yellow-500':'bg-indigo-600');
  popup.querySelector('h2').textContent = msg;
  popup.setAttribute('data-position','down');
  popup.style.opacity='1';
  setTimeout(()=>{popup.setAttribute('data-position','up'); popup.style.opacity='0';},2800);
}

function ensureAuth(){ if(!userId){ window.location.href='../html/login_page.html'; }}

function populateUserCard(){
  userNameEl.textContent = userName || 'User';
  userEmailEl.textContent = userEmail || '';
  // Add titles for accessibility and to expose full values on long truncation
  userNameEl.title = userName || 'User';
  userEmailEl.title = userEmail || '';
  if (userPicture) userPicEl.src = userPicture; else userPicEl.src = 'https://placehold.co/128x128?text=User';
}

let adminsCache = [];
async function loadAdmins(){
  adminSelect.addEventListener('change',()=>{ continueBtn.disabled = (!adminSelect.value); updateProgress(); });

  adminSkeleton.classList.remove('hidden');
  searchWrapper.classList.add('hidden');
  selectWrapper.classList.add('hidden');
  tipBox.classList.add('hidden');
  adminEmpty.classList.add('hidden');
  let attempt = 0; let lastError = null;
  while (attempt < 2) {
    const { data, error } = await supabaseClient.from('Admins').select('id,email');
    if (!error) {
      adminsCache = data || [];
      break;
    }
    lastError = error; attempt++;
  }
  adminSkeleton.classList.add('hidden');
  if (lastError && adminsCache.length === 0) {
    adminEmpty.textContent = 'Unable to fetch admins right now.';
    selectWrapper.classList.remove('hidden');
    adminEmpty.classList.remove('hidden');
    notify('Admin list failed to load','error');
    return;
  }
  if (adminsCache.length === 0) {
    selectWrapper.classList.remove('hidden');
    adminEmpty.textContent = 'No admins available yet.';
    adminEmpty.classList.remove('hidden');
    return;
  }
  renderAdminOptions(adminsCache);
  searchWrapper.classList.remove('hidden');
  selectWrapper.classList.remove('hidden');
  tipBox.classList.remove('hidden');
  // focus search for accessibility
  setTimeout(()=>adminSearch.focus(), 50);
}

async function renderAdminOptions(list){
  // we reach here if the profile is not an admin
  // so we find the chosen admin of the student profile
  const { data: adminIdData, error: adminIdError } = await supabaseClient
    .from('Users')
    .select('admin')
    .eq('id', userId)

  // now use the adminId to fetch the admin email
  if (adminIdError) {
    notify('Failed to load profile','error');
    return;
  }

  adminId = adminIdData[0].admin;

  // loop through the list and see if any element has id equal to adminId
  const chosenAdmin = list.find(a => a.id === adminId);

  if (chosenAdmin) {
    adminSelect.innerHTML = '<option value="' + chosenAdmin.email + '" selected title="' + chosenAdmin.email + '">' + chosenAdmin.email + '</option>';
  } else {
    adminSelect.innerHTML = '<option value="" disabled selected>Select an admin</option>';
  }
  
  list.forEach(a=>{
    const opt=document.createElement('option');
    if (chosenAdmin && a.id === adminId) return; // skip already selected
  opt.value=a.email; opt.textContent=a.email; opt.title=a.email; adminSelect.appendChild(opt);
  });
}

adminSearch.addEventListener('input',()=>{
  const q = adminSearch.value.toLowerCase().trim();
  if(!q){ renderAdminOptions(adminsCache); return; }
  const filtered = adminsCache.filter(a=>a.email.toLowerCase().includes(q));
  renderAdminOptions(filtered);
});

async function handleContinue(){
  const selectedEmail = adminSelect.value;
  if(!selectedEmail && !(continueBtn.textContent==='Go to Dashboard')){ notify('Choose an admin','warn'); return; }
  continueBtn.disabled = true; continueSpinner.classList.remove('hidden'); continueText.textContent='Saving';
  try {
    const { data: adminRow, error: adminError } = await supabaseClient
      .from('Admins')
      .select('id')
      .eq('email', selectedEmail)
      .maybeSingle();
    if (adminError || !adminRow){ notify('Admin not found','error'); return; }
    const { error: updateError } = await supabaseClient
      .from('Users')
      .update({ admin: adminRow.id })
      .eq('id', userId);
    if (updateError){ notify('Failed to assign admin','error'); return; }
    notify('Admin assigned','success');
    adminStatus.textContent = 'Assigned';
    adminStatus.className='font-medium text-green-600';
    updateProgress();
    setTimeout(()=>{ window.location.href='../html/student-dashboard.html'; },600);
  } finally {
    continueSpinner.classList.add('hidden');
    continueText.textContent='Continue';
    if (adminStatus.textContent !== 'Assigned') continueBtn.disabled = false;
  }
}

continueBtn.addEventListener('click', handleContinue);
logoutBtn.addEventListener('click', ()=>{ localStorage.clear(); window.location.href='../html/login_page.html'; });

async function checkExisting(){
  const { data, error } = await supabaseClient
    .from('Users')
    .select('admin')
    .eq('id', userId)
    .maybeSingle();
  if (error) return;
  if (data?.admin){
    adminStatus.textContent='Assigned';
    adminStatus.className='font-medium text-green-600';
    continueBtn.textContent='Continue';
    continueBtn.disabled=false;
  }
}

async function detectUploadsStarted(){
  const { data, error } = await supabaseClient
    .from('Uploads')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return;
  if (data){
    const values = Object.values(data).filter(v=>Array.isArray(v) && v.length>0);
    if (values.length>0){
      uploadsStatus.textContent='Started';
      uploadsStatus.className='font-medium text-indigo-600';
    } else {
      uploadsStatus.textContent='Not yet';
      uploadsStatus.className='font-medium text-gray-500';
    }
  }
}

function updateProgress(){
  // 3 checkpoints: profile (always), admin selection, uploads started
  let score = 0;
  profileStatus.textContent='Loaded'; profileStatus.className='font-medium text-indigo-600'; score += 1;
  if (!continueBtn.disabled){ score += 1; }
  if (uploadsStatus.textContent.toLowerCase().includes('started')) score += 1;
  const pct = Math.round((score/3)*100);
  progressBar.style.width = pct + '%';
  progressText.textContent = pct + '% Complete';
}

function updateInfoCard(isAdmin) {
  const infoCard = document.querySelector('.bg-gradient-to-br.from-indigo-600.to-indigo-500');
  if (!infoCard) return;
  
  if (isAdmin) {
    // Admin content
    infoCard.innerHTML = `
      <h2 class="text-sm font-semibold uppercase tracking-wide mb-3 sm:mb-4">Admin Responsibilities</h2>
      <p class="text-sm sm:text-base leading-relaxed opacity-90">Review student submissions, provide constructive feedback, track evaluation progress, and ensure quality standards are maintained throughout the placement process.</p>
      <div class="mt-4 sm:mt-6 flex items-center gap-2 text-indigo-200">
        <svg class="size-5 opacity-80" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span class="text-xs sm:text-sm font-medium opacity-90">Quality Assurance & Evaluation</span>
      </div>
    `;
  } else {
    // Student content
    infoCard.innerHTML = `
      <h2 class="text-sm font-semibold uppercase tracking-wide mb-3 sm:mb-4">Placement Journey</h2>
      <p class="text-sm sm:text-base leading-relaxed opacity-90">Build your portfolio with evidence uploads, get feedback from your assigned admin, and track your progress toward placement readiness.</p>
      <div class="mt-4 sm:mt-6 flex items-center gap-2 text-indigo-200">
        <svg class="size-5 opacity-80" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
        <span class="text-xs sm:text-sm font-medium opacity-90">Portfolio Development</span>
      </div>
    `;
  }
}

async function init(){
  ensureAuth();
  populateUserCard();
  // Detect if current user is an Admin; if so, show view-only profile section
  const { data: adminSelf } = await supabaseClient
    .from('Admins')
    .select('email')
    .eq('email', userEmail)
    .maybeSingle();
  if (adminSelf){
    // Show admin-specific information and quick stats
    document.getElementById('admin-interaction-area').innerHTML = `
      <div class="space-y-4">
        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <svg class="size-5 text-indigo-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <h3 class="text-sm font-semibold text-indigo-900">Administrator Access</h3>
          </div>
          <p class="text-sm text-indigo-700">You have admin privileges to review student submissions, provide feedback, and manage evaluations.</p>
        </div>
        
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div class="flex items-center gap-2 mb-1">
            <svg class="size-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span class="text-xs font-medium text-amber-800">Quick Access</span>
          </div>
          <p class="text-xs text-amber-700">Access your admin dashboard to review submissions, manage students, and track evaluation progress.</p>
        </div>
      </div>
    `;
    
    // Update the bottom information card for admins
    updateInfoCard(true);
    
    profileStatus.textContent='Active'; profileStatus.className='font-medium text-green-600';
    adminStatus.textContent='Administrator'; adminStatus.className='font-medium text-indigo-600';
    uploadsStatus.textContent='Dashboard Ready'; uploadsStatus.className='font-medium text-green-600';
    progressBar.style.width='100%'; progressText.textContent='Admin Profile Ready';
    continueBtn.disabled=false;
    continueBtn.textContent='Go to Dashboard';
    continueBtn.addEventListener('click', ()=>{ window.location.href='../html/admin-dashboard.html'; });
    
    return;
  }

  // Update the bottom information card for students
  updateInfoCard(false);

  await loadAdmins();
  await checkExisting();
  await detectUploadsStarted();
  updateProgress();
}

init();
