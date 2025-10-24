// Profile Setup Modern Script

// supabase client initialization
const SUPABASE_URL = 'https://asccuwumidjqcwdcmsrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzY2N1d3VtaWRqcWN3ZGNtc3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjk1OTQsImV4cCI6MjA2Njg0NTU5NH0.eqmYPNdSoIjvAxKFlR4c-xQzW4FomEWSEe7nv-X4mFU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements - all the UI components we'll be interacting with
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

// User data from localStorage (populated during login)
const userName = localStorage.getItem('userName');
const userEmail = localStorage.getItem('userEmail');
const userPicture = localStorage.getItem('userPicture');
const userId = localStorage.getItem('userId');

// notification utility - displays a popup message at the top of the screen
function notify(msg,type='info') {
  const popup = document.getElementById('pop-up');
  
  // remove all color classes first
  popup.classList.remove('bg-indigo-600','bg-green-600','bg-red-600','bg-yellow-500');
  
  // add the appropriate color based on the notification type
  popup.classList.add(type==='error'?'bg-red-600':type==='success'?'bg-green-600':type==='warn'?'bg-yellow-500':'bg-indigo-600');
  
  // set the message text
  popup.querySelector('h2').textContent = msg;
  
  // animate the popup down (show it)
  popup.setAttribute('data-position','down');
  popup.style.opacity='1';
  
  // after 2.8 seconds, animate it back up (hide it)
  setTimeout(()=>{popup.setAttribute('data-position','up'); popup.style.opacity='0';},2800);
}

// checks if the user is logged in, redirects to login page if not
function ensureAuth(){ if(!userId){ window.location.href='../html/login_page.html'; }}

// populates the user card with name, email, and profile picture
function populateUserCard(){
  userNameEl.textContent = userName || 'User';
  userEmailEl.textContent = userEmail || '';
  
  // Add titles for accessibility and to expose full values on long truncation
  userNameEl.title = userName || 'User';
  userEmailEl.title = userEmail || '';
  
  // set profile picture or use placeholder
  if (userPicture) userPicEl.src = userPicture; else userPicEl.src = 'https://placehold.co/128x128?text=User';
}

// cache to store the list of admins so we don't have to fetch them multiple times
let adminsCache = [];

// loads all available admins from the database and populates the dropdown
async function loadAdmins(){
  // enable/disable continue button based on whether an admin is selected
  adminSelect.addEventListener('change',()=>{ continueBtn.disabled = (!adminSelect.value); updateProgress(); });

  // show skeleton loader while fetching
  adminSkeleton.classList.remove('hidden');
  searchWrapper.classList.add('hidden');
  selectWrapper.classList.add('hidden');
  tipBox.classList.add('hidden');
  adminEmpty.classList.add('hidden');
  
  // retry logic: try up to 2 times to fetch admins in case of network issues
  let attempt = 0; let lastError = null;
  while (attempt < 2) {
    const { data, error } = await supabaseClient.from('Admins').select('id,email');
    if (!error) {
      adminsCache = data || [];
      break;
    }
    lastError = error; attempt++;
  }
  
  // hide skeleton loader
  adminSkeleton.classList.add('hidden');
  
  // if fetch failed after retries and we have no cached data, show error
  if (lastError && adminsCache.length === 0) {
    adminEmpty.textContent = 'Unable to fetch admins right now.';
    selectWrapper.classList.remove('hidden');
    adminEmpty.classList.remove('hidden');
    notify('Admin list failed to load','error');
    return;
  }
  
  // if no admins exist in the database, show a message
  if (adminsCache.length === 0) {
    selectWrapper.classList.remove('hidden');
    adminEmpty.textContent = 'No admins available yet.';
    adminEmpty.classList.remove('hidden');
    return;
  }
  
  // populate the dropdown with admin options
  renderAdminOptions(adminsCache);
  
  // show the search and select UI elements
  searchWrapper.classList.remove('hidden');
  selectWrapper.classList.remove('hidden');
  tipBox.classList.remove('hidden');
  
  // focus on search input for better UX
  setTimeout(()=>adminSearch.focus(), 50);
}

// renders the admin options in the dropdown, pre-selecting if student already has an admin assigned
async function renderAdminOptions(list){
  // we reach here if the profile is not an admin
  // so we find the chosen admin of the student profile
  const { data: adminIdData, error: adminIdError } = await supabaseClient
    .from('Users')
    .select('admin')
    .eq('id', userId)

  // if there's an error fetching the student's admin, show notification and bail out
  if (adminIdError) {
    notify('Failed to load profile','error');
    return;
  }

  // get the admin ID that's currently assigned to this student
  adminId = adminIdData[0].admin;

  // find the admin object in our list that matches this ID
  const chosenAdmin = list.find(a => a.id === adminId);

  // if the student already has an admin assigned, pre-select them in the dropdown
  if (chosenAdmin) {
    adminSelect.innerHTML = '<option value="' + chosenAdmin.email + '" selected title="' + chosenAdmin.email + '">' + chosenAdmin.email + '</option>';
  } else {
    // otherwise, show a placeholder option
    adminSelect.innerHTML = '<option value="" disabled selected>Select an admin</option>';
  }
  
  // add all other admins to the dropdown (skip the already-selected one to avoid duplicates)
  list.forEach(a=>{
    const opt=document.createElement('option');
    if (chosenAdmin && a.id === adminId) return; // skip already selected
    opt.value=a.email; opt.textContent=a.email; opt.title=a.email; adminSelect.appendChild(opt);
  });
}

// search functionality - filters admin list as user types in the search box
adminSearch.addEventListener('input',()=>{
  const q = adminSearch.value.toLowerCase().trim();
  
  // if search is empty, show all admins
  if(!q){ renderAdminOptions(adminsCache); return; }
  
  // filter admins whose email contains the search query
  const filtered = adminsCache.filter(a=>a.email.toLowerCase().includes(q));
  
  // re-render the dropdown with filtered results
  renderAdminOptions(filtered);
});

// handles the continue button click - assigns the selected admin to the student
async function handleContinue(){
  const selectedEmail = adminSelect.value;
  
  // validate that an admin is selected (unless user is already an admin going to dashboard)
  if(!selectedEmail && !(continueBtn.textContent==='Go to Dashboard')){ notify('Choose an admin','warn'); return; }
  
  // disable button and show loading spinner
  continueBtn.disabled = true; continueSpinner.classList.remove('hidden'); continueText.textContent='Saving';
  
  try {
    // first, fetch the admin's ID from their email
    const { data: adminRow, error: adminError } = await supabaseClient
      .from('Admins')
      .select('id')
      .eq('email', selectedEmail)
      .maybeSingle();
    
    // if admin not found, show error
    if (adminError || !adminRow){ notify('Admin not found','error'); return; }
    
    // update the student's record with the selected admin's ID
    const { error: updateError } = await supabaseClient
      .from('Users')
      .update({ admin: adminRow.id })
      .eq('id', userId);
    
    // if update failed, show error
    if (updateError){ notify('Failed to assign admin','error'); return; }
    
    // success! update UI and redirect to student dashboard
    notify('Admin assigned','success');
    adminStatus.textContent = 'Assigned';
    adminStatus.className='font-medium text-green-600';
    updateProgress();
    
    // wait a bit before redirecting so user can see the success message
    setTimeout(()=>{ window.location.href='../html/student-dashboard.html'; },600);
  } finally {
    // always hide spinner and restore button text (unless assignment succeeded)
    continueSpinner.classList.add('hidden');
    continueText.textContent='Continue';
    if (adminStatus.textContent !== 'Assigned') continueBtn.disabled = false;
  }
}

// hook up the continue button and logout button to their respective handlers
continueBtn.addEventListener('click', handleContinue);
logoutBtn.addEventListener('click', ()=>{ localStorage.clear(); window.location.href='../html/login_page.html'; });

// checks if the student already has an admin assigned (for returning users)
async function checkExisting(){
  const { data, error } = await supabaseClient
    .from('Users')
    .select('admin')
    .eq('id', userId)
    .maybeSingle();
  
  // if there's an error, bail out
  if (error) return;
  
  // if an admin is already assigned, update the UI accordingly
  if (data?.admin){
    adminStatus.textContent='Assigned';
    adminStatus.className='font-medium text-green-600';
    continueBtn.textContent='Continue';
    continueBtn.disabled=false;
  }
}

// checks if the student has started uploading any documents
async function detectUploadsStarted(){
  const { data, error } = await supabaseClient
    .from('Uploads')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  // if there's an error, bail out
  if (error) return;
  
  // if upload record exists, check if any fields have actual data
  if (data){
    // get all values from the uploads record and filter for arrays with content
    const values = Object.values(data).filter(v=>Array.isArray(v) && v.length>0);
    
    if (values.length>0){
      // student has started uploading
      uploadsStatus.textContent='Started';
      uploadsStatus.className='font-medium text-indigo-600';
    } else {
      // upload record exists but no actual uploads yet
      uploadsStatus.textContent='Not yet';
      uploadsStatus.className='font-medium text-gray-500';
    }
  }
}

// updates the progress bar based on completed steps
function updateProgress(){
  // 3 checkpoints: profile loaded, admin assigned, uploads started
  let score = 0;
  
  // profile is always loaded if we're on this page
  profileStatus.textContent='Loaded'; profileStatus.className='font-medium text-indigo-600'; score += 1;
  
  // if continue button is enabled, admin must be selected
  if (!continueBtn.disabled){ score += 1; }
  
  // if uploads have been started, add to score
  if (uploadsStatus.textContent.toLowerCase().includes('started')) score += 1;
  
  // calculate percentage (out of 3 total checkpoints)
  const pct = Math.round((score/3)*100);
  
  // update the progress bar and text
  progressBar.style.width = pct + '%';
  progressText.textContent = pct + '% Complete';
}

// updates the information card content based on whether user is admin or student
function updateInfoCard(isAdmin) {
  const infoCard = document.querySelector('.bg-gradient-to-br.from-indigo-600.to-indigo-500');
  if (!infoCard) return;
  
  if (isAdmin) {
    // Admin content - explains admin responsibilities
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
    // Student content - explains student journey
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

// initialization function that runs when the page loads
async function init(){
  // make sure the user is logged in
  ensureAuth();
  
  // populate the user card with their info
  populateUserCard();
  
  // Detect if current user is an Admin; if so, show admin-specific view
  const { data: adminSelf } = await supabaseClient
    .from('Admins')
    .select('email')
    .eq('email', userEmail)
    .maybeSingle();
  
  // if this user is an admin, customize the page for them
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
    
    // set all status indicators to show admin profile is ready
    profileStatus.textContent='Active'; profileStatus.className='font-medium text-green-600';
    adminStatus.textContent='Administrator'; adminStatus.className='font-medium text-indigo-600';
    uploadsStatus.textContent='Dashboard Ready'; uploadsStatus.className='font-medium text-green-600';
    progressBar.style.width='100%'; progressText.textContent='Admin Profile Ready';
    
    // enable the continue button and change it to go to admin dashboard
    continueBtn.disabled=false;
    continueBtn.textContent='Go to Dashboard';
    continueBtn.addEventListener('click', ()=>{ window.location.href='../html/admin-dashboard.html'; });
    
    // exit early - no need to load student-specific data
    return;
  }

  // Update the bottom information card for students
  updateInfoCard(false);

  // load student-specific data: available admins, existing assignments, uploads
  await loadAdmins();
  await checkExisting();
  await detectUploadsStarted();
  
  // update the progress bar
  updateProgress();
}

// start the app!
init();
