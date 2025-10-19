// Student Dashboard Script (Tailwind UI based)
// =============================================================
const SUPABASE_URL = 'https://asccuwumidjqcwdcmsrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzY2N1d3VtaWRqcWN3ZGNtc3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjk1OTQsImV4cCI6MjA2Njg0NTU5NH0.eqmYPNdSoIjvAxKFlR4c-xQzW4FomEWSEe7nv-X4mFU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Category metadata (collapsed design)
const CATEGORY_GROUPS = [
  {
    id: 'basics',
    label: 'Basics',
    color: 'indigo',
    items: [
      { id: '10th-percentage', label: '10th Percentage' },
      { id: '12th-percentage', label: '12th Percentage' },
      { id: 'cgpa', label: 'CGPA' },
    ],
  },
  {
    id: 'github-profile',
    label: 'GitHub Profile',
    color: 'violet',
    items: [
      { id: 'number-of-contributions', label: 'Contributions (1y)' },
      { id: 'frequency-of-contributions', label: 'Contribution Frequency' },
      { id: 'projects-done-for-community', label: 'Community Projects' },
      { id: 'number-of-collaborations', label: 'Collaborations' },
    ],
  },
  {
    id: 'coding-practice-platform',
    label: 'Coding Practice',
    color: 'fuchsia',
    items: [
      { id: 'number-of-badges-or-recognitions', label: 'Badges / Recognitions' },
      { id: 'number-of-medium-or-hard-questions-solved', label: 'Medium/Hard Qs Solved' },
    ],
  },
  {
    id: 'internship-experience',
    label: 'Internships',
    color: 'pink',
    items: Array.from({ length: 10 }, (_, i) => ({ id: `internship-${['one','two','three','four','five','six','seven','eight','nine','ten'][i]}`, label: `Internship ${i+1}` })),
  },
  {
    id: 'skillset-and-standard-certifications',
    label: 'Certifications',
    color: 'rose',
    items: Array.from({ length: 5 }, (_, i) => ({ id: `certificate-${['one','two','three','four','five'][i]}`, label: `Certificate ${i+1}` })),
  },
  {
    id: 'projects-done',
    label: 'Projects',
    color: 'amber',
    items: [
      { id: 'project-one', label: 'Project One' },
      { id: 'project-two', label: 'Project Two' },
      { id: 'project-three', label: 'Project Three' },
    ],
  },
  {
    id: 'full-stack-developer-experience',
    label: 'Full Stack Experience',
    color: 'lime',
    items: [ { id: 'fsd-project-one', label: 'FSD Project One' } ],
  },
  {
    id: 'coding-competitions-and-hackathons-won',
    label: 'Hackathons',
    color: 'emerald',
    items: [
      { id: 'hackathon-one', label: 'Hackathon One' },
      { id: 'hackathon-two', label: 'Hackathon Two' },
      { id: 'hackathon-three', label: 'Hackathon Three' },
      { id: 'hackathon-four', label: 'Hackathon Four' },
    ],
  },
  {
    id: 'inhouse-projects-done',
    label: 'In-house Projects',
    color: 'cyan',
    items: [
      { id: 'inhouse-one', label: 'Inhouse One' },
      { id: 'inhouse-two', label: 'Inhouse Two' },
    ],
  },
  {
    id: 'membership-of-professional-bodies',
    label: 'Memberships',
    color: 'sky',
    items: [ { id: 'membership-one', label: 'Membership One' } ],
  }
];

// Help text / config for dynamic modal inputs
const FIELD_CONFIG = {
  'number-of-contributions': { quantity: 'Enter Number of Contributions' },
  'frequency-of-contributions': { quantity: 'Enter Contribution Frequency' },
  'number-of-collaborations': { quantity: 'Enter Number of Collaborations' },
  'number-of-badges-or-recognitions': { quantity: 'Enter Count', type: { label: 'Select Platform', options: ['LeetCode','HackerRank','CodeChef','Codeforces','GeeksforGeeks','Google Cloud','Alteryx','Other','Multiple Platforms'] } },
  'number-of-medium-or-hard-questions-solved': { quantity: 'Enter Count' },
  'certificate-one': { type: { label: 'Certificate Type', options: ['CISCO','CCNA','CCNP','MCNA','MCNP','Matlab','Redhat','IBM','NPTEL','Coursera','Programming','Udemy'] } },
};
['certificate-two','certificate-three','certificate-four','certificate-five'].forEach(k=>FIELD_CONFIG[k]=FIELD_CONFIG['certificate-one']);

['internship-one','internship-two','internship-three','internship-four','internship-five','internship-six','internship-seven','internship-eight','internship-nine','internship-ten']
  .forEach(k=>FIELD_CONFIG[k]={ type: { label: 'Internship Type', options:['IIT','NIT','Placed from SRM','Fortune 500 Companies','Small Companies','< 3 Months','Paid Internship'] }});

// State
let currentItemId = null;
let userId = localStorage.getItem('userId');
const userName = localStorage.getItem('userName');
const userEmail = localStorage.getItem('userEmail');
const userPicture = localStorage.getItem('userPicture');
let statsSkeletonShownAt = performance.now();

// DOM refs
const appRoot = document.getElementById('app-root');
const navGroupsUl = document.getElementById('nav-groups');
const navGroupsMobile = document.getElementById('nav-groups-mobile');
const openMobileNavBtn = document.getElementById('open-mobile-nav');
const mobileDrawer = document.getElementById('mobile-drawer');
const closeMobileNavBackdrop = document.getElementById('close-mobile-nav');
const closeMobileNavBtn = document.getElementById('close-mobile-nav-btn');
const uploadTitle = document.getElementById('upload-title-text');
const uploadPreview = document.getElementById('upload-preview');
const currentSectionPill = document.getElementById('current-section-pill');
const sectionHelp = document.getElementById('section-help');
const statsGrid = document.getElementById('stats-grid');
const profileImage = document.getElementById('profile-image');
const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const logoutBtnMobile = document.getElementById('logout-btn-mobile');

// Modal refs
const modal = document.getElementById('upload-modal');
const openModalBtn = document.getElementById('open-upload-modal');
const closeModalBtn = document.getElementById('close-upload-modal');
const modeToggle = document.getElementById('mode-toggle');
const quantityWrapper = document.getElementById('quantity-wrapper');
const quantityInput = document.getElementById('quantity-input');
const quantityLabel = document.getElementById('quantity-label');
const typeWrapper = document.getElementById('type-wrapper');
const typeLabel = document.getElementById('type-label');
const typeSelect = document.getElementById('type-select');
const fileUploadWrapper = document.getElementById('file-upload-wrapper');
const fileInput = document.getElementById('file-input');
const linkWrapper = document.getElementById('link-upload-wrapper');
const linkInput = document.getElementById('link-input');
const linkSubmit = document.getElementById('link-submit');
const modalContext = document.getElementById('modal-context');

// Toast / Notification Utilities
function notify(msg, type='info') {
  // legacy popup fallback (kept for compatibility) -> now delegates to toast system
  enqueueToast(msg, type);
}

const TOAST_LIMIT = 5;
let toastQueue = [];
let activeToasts = [];

function enqueueToast(message, type='info', options={}){
  const id = Date.now() + Math.random();
  toastQueue.push({ id, message, type, options });
  processToastQueue();
}

function processToastQueue(){
  const stack = document.getElementById('toast-stack');
  if(!stack) return; // safety
  while (activeToasts.length < TOAST_LIMIT && toastQueue.length){
    const toast = toastQueue.shift();
    renderToast(toast, stack);
  }
}

function renderToast(toast, stack){
  activeToasts.push(toast);
  const div = document.createElement('div');
  div.className = `pointer-events-auto w-full rounded-lg shadow ring-1 ring-black/10 backdrop-blur bg-white/90 dark:bg-gray-800/90 flex items-start gap-3 px-4 py-3 animate-[fadeIn_.25s_ease]`;
  const color = toast.type==='error'? 'text-red-600 border-red-200 bg-red-50': toast.type==='success'? 'text-green-600 border-green-200 bg-green-50': toast.type==='warn'? 'text-yellow-700 border-yellow-200 bg-yellow-50':'text-indigo-600 border-indigo-200 bg-indigo-50';
  div.innerHTML = `<div class="flex-1 text-sm font-medium ${color} bg-opacity-40">${toast.message}</div><button class="shrink-0 text-gray-400 hover:text-gray-600" aria-label="Close">&times;</button>`;
  const closeBtn = div.querySelector('button');
  const remove = () => dismissToast(toast.id, div);
  closeBtn.addEventListener('click', remove);
  stack.appendChild(div);
  const ttl = toast.options.ttl || 3500;
  setTimeout(remove, ttl);
}

function dismissToast(id, el){
  activeToasts = activeToasts.filter(t=>t.id!==id);
  if (el && el.parentElement){ el.style.opacity='0'; el.style.transform='translateY(-4px)'; setTimeout(()=>{el.remove(); processToastQueue();},180); }
  else processToastQueue();
}

function ensureAuth() {
  if (!userId) {
    window.location.href = 'login_page.html';
  }
}

function renderSidebar() {
  const fragment = document.createDocumentFragment();
  const fragmentMobile = document.createDocumentFragment();
  CATEGORY_GROUPS.forEach(group => {
    // Desktop group
    const li = document.createElement('li');
    const innerUl = document.createElement('ul');
    innerUl.className = '-mx-2 space-y-1';
    const headerBtn = document.createElement('button');
    headerBtn.type='button';
    headerBtn.className='group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white items-center justify-between';
    headerBtn.innerHTML = `<span>${group.label}</span><svg class="size-4 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>`;
    let open=false;
    const itemsWrap = document.createElement('div');
    itemsWrap.className='hidden pl-2';

    group.items.forEach(item=>{
      const a = document.createElement('button');
      a.type='button';
      a.className='w-full text-left flex gap-x-3 rounded-md p-2 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white';
      a.textContent=item.label;
      a.dataset.itemId=item.id;
      a.addEventListener('click',()=>selectItem(item.id,item.label));
      itemsWrap.appendChild(a);
    });

    headerBtn.addEventListener('click',()=>{open=!open; itemsWrap.classList.toggle('hidden',!open); headerBtn.classList.toggle('bg-gray-800',open); headerBtn.classList.toggle('text-white',open);});

    innerUl.appendChild(headerBtn);
    innerUl.appendChild(itemsWrap);
    li.appendChild(innerUl);
    fragment.appendChild(li);

    // Mobile clone
    if (navGroupsMobile){
      const liM = document.createElement('li');
      const innerUlM = document.createElement('ul');
      innerUlM.className = 'space-y-1';
      const headerBtnM = document.createElement('button');
      headerBtnM.type='button';
      headerBtnM.className='group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white items-center justify-between';
      headerBtnM.innerHTML = `<span>${group.label}</span><svg class="size-4 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>`;
      let openM=false;
      const itemsWrapM = document.createElement('div');
      itemsWrapM.className='hidden pl-2';
      group.items.forEach(item=>{
        const aM = document.createElement('button');
        aM.type='button';
        aM.className='w-full text-left flex gap-x-3 rounded-md p-2 text-xs font-medium text-gray-300 hover:bg-gray-800 hover:text-white';
        aM.textContent=item.label;
        aM.dataset.itemId=item.id;
        aM.addEventListener('click',()=>{ selectItem(item.id,item.label); toggleMobileDrawer(false); });
        itemsWrapM.appendChild(aM);
      });
      headerBtnM.addEventListener('click',()=>{openM=!openM; itemsWrapM.classList.toggle('hidden',!openM); headerBtnM.classList.toggle('bg-gray-800',openM); headerBtnM.classList.toggle('text-white',openM);});
      innerUlM.appendChild(headerBtnM);
      innerUlM.appendChild(itemsWrapM);
      liM.appendChild(innerUlM);
      fragmentMobile.appendChild(liM);
    }
  });
  navGroupsUl.insertBefore(fragment, navGroupsUl.firstChild);
  if (navGroupsMobile) navGroupsMobile.appendChild(fragmentMobile);
}

// Mobile drawer controls
function toggleMobileDrawer(open){
  if (!mobileDrawer) return;
  if (open){ mobileDrawer.classList.remove('hidden'); document.body.style.overflow='hidden'; }
  else { mobileDrawer.classList.add('hidden'); document.body.style.overflow=''; }
}
if (openMobileNavBtn){ openMobileNavBtn.addEventListener('click', ()=>toggleMobileDrawer(true)); }
if (closeMobileNavBackdrop){ closeMobileNavBackdrop.addEventListener('click', ()=>toggleMobileDrawer(false)); }
if (closeMobileNavBtn){ closeMobileNavBtn.addEventListener('click', ()=>toggleMobileDrawer(false)); }

async function loadStats() {
  // simple placeholder aggregated counts
  const started = performance.now();
  const { data, error } = await supabaseClient
    .from('Uploads')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return;
  const stats = CATEGORY_GROUPS.map(g=>{
    let total=0; let uploaded=0;
    g.items.forEach(i=>{total++; const arr = data[i.id]; if (Array.isArray(arr) && arr.length>0) uploaded++;});
    return { id:g.id, label:g.label, uploaded, total };
  });
  const MIN_SKELETON_MS = 800; // ensure smoother perception
  const elapsed = started - statsSkeletonShownAt;
  if (elapsed < MIN_SKELETON_MS){
    await new Promise(r=>setTimeout(r, MIN_SKELETON_MS - elapsed));
  }
  statsGrid.innerHTML = '';
  stats.forEach(s=>{
    const pct = Math.round((s.uploaded/s.total)*100);
    const card = document.createElement('div');
    card.className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col';
    card.innerHTML=`<div class="flex items-center justify-between mb-2"><p class="text-xs font-medium text-gray-500 uppercase tracking-wide">${s.label}</p><span class="text-[10px] font-medium px-2 py-0.5 rounded-full ${pct===100?'bg-green-100 text-green-700':'bg-indigo-100 text-indigo-700'}">${pct}%</span></div><div class="flex-1 flex items-end"><p class="text-2xl font-semibold text-gray-800">${s.uploaded}<span class="text-sm text-gray-400 font-normal">/${s.total}</span></p></div><div class="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div class="h-full rounded-full ${pct===100?'bg-green-500':'bg-indigo-500'}" style="width:${pct}%;"></div></div>`;
    statsGrid.appendChild(card);
  });
}

async function selectItem(id,label){
  currentItemId = id;
  uploadTitle.textContent = label;
  currentSectionPill.textContent = label;
  sectionHelp.textContent = 'Review or add uploads for ' + label + '.';
  await renderUploads();
  configureModalForItem(id);
}

function configureModalForItem(id){
  const cfg = FIELD_CONFIG[id] || {};
  // reset
  quantityWrapper.classList.add('hidden');
  typeWrapper.classList.add('hidden');
  quantityInput.value='';
  typeSelect.innerHTML='';
  if (cfg.quantity){
    quantityLabel.textContent = cfg.quantity;
    quantityWrapper.classList.remove('hidden');
  }
  if (cfg.type){
    typeLabel.textContent = cfg.type.label;
    typeSelect.innerHTML = cfg.type.options.map(o=>`<option value="${o}">${o}</option>`).join('');
    typeWrapper.classList.remove('hidden');
  }
  modalContext.textContent = 'Adding evidence for ' + id.replace(/-/g,' ');
}

async function renderUploads(){
  uploadPreview.innerHTML = '<p class="text-xs text-gray-500">Loading...</p>';
  const { data, error } = await supabaseClient
    .from('Uploads')
    .select(currentItemId)
    .eq('user_id', userId)
    .single();
  if (error){ uploadPreview.innerHTML = '<p class="text-xs text-red-500">Failed to load.</p>'; return; }
  const urls = data[currentItemId];
  if (!urls || urls.length===0){
    uploadPreview.innerHTML = '<p class="text-sm text-gray-500">No uploads yet.</p>';
    return;
  }
  uploadPreview.innerHTML = '';
  for (let i=0;i<urls.length;i++){
    const url = urls[i];
    const row = document.createElement('div');
    row.className='flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 text-sm';
    const link = document.createElement('a');
    link.href=url; link.target='_blank';
    link.rel='noopener noreferrer';
  link.className='text-indigo-600 font-medium truncate max-w-[60vw] sm:max-w-xs';
    // fetch link name
    let display = `Item ${i+1}`;
    const { data: linkNameData } = await supabaseClient
      .from('LinkNames')
      .select('name')
      .eq('link', url)
      .eq('user_id', userId)
      .eq('column_name', currentItemId)
      .maybeSingle();
    if (linkNameData?.name) display = linkNameData.name;
    link.textContent = display;

    const delBtn = document.createElement('button');
    delBtn.className='text-xs text-red-600 hover:text-red-700 font-medium';
    delBtn.textContent='Delete';
    delBtn.addEventListener('click',()=>handleDelete(url));

    row.appendChild(link); row.appendChild(delBtn); uploadPreview.appendChild(row);
  }
}

async function handleDelete(url){
  // delete link names first
  await supabaseClient.from('LinkNames')
    .delete()
    .eq('link', url)
    .eq('user_id', userId)
    .eq('column_name', currentItemId);

  const { data: rowData, error } = await supabaseClient
    .from('Uploads')
    .select(currentItemId)
    .eq('user_id', userId)
    .single();
  if (error) { notify('Delete failed','error'); return; }
  const existing = rowData[currentItemId] || [];
  const updated = existing.filter(l=>l!==url);
  await supabaseClient.from('Uploads').update({ [currentItemId]: updated }).eq('user_id', userId);
  notify('Deleted');
  await renderUploads();
  await loadStats();
}

function openModal(){ if(!currentItemId){notify('Pick a category first','warn'); return;} modal.classList.remove('hidden'); modal.classList.add('flex'); }
function closeModal(){ modal.classList.add('hidden'); modal.classList.remove('flex'); fileInput.value=''; linkInput.value=''; }

modeToggle.addEventListener('change',()=>{
  const fileMode = modeToggle.checked;
  fileUploadWrapper.classList.toggle('hidden', !fileMode);
  linkWrapper.classList.toggle('hidden', fileMode);
});

openModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

fileInput.addEventListener('change', async (e)=>{
  if (!currentItemId) return;
  const files = Array.from(e.target.files);
  if (files.length===0) return;
  // get existing
  const { data: rowData, error } = await supabaseClient
    .from('Uploads')
    .select(currentItemId)
    .eq('user_id', userId)
    .single();
  if (error) { notify('Fetch failed','error'); return; }
  let existing = rowData[currentItemId] || [];
  const newUrls = [];
  for (const file of files){
    const path = `${Date.now()}-${file.name}`;
    const { error: upErr } = await supabaseClient.storage.from('files-and-links').upload(path, file);
    if (upErr){ notify('Upload failed','error'); continue; }
    const { data: pub } = supabaseClient.storage.from('files-and-links').getPublicUrl(path);
    newUrls.push(pub.publicUrl);
  }
  const updated = [...existing, ...newUrls];
  await supabaseClient.from('Uploads').update({ [currentItemId]: updated }).eq('user_id', userId);

  // Insert link names
  const baseNamePart1 = quantityWrapper.classList.contains('hidden')? '' : quantityInput.value;
  const baseNamePart2 = typeWrapper.classList.contains('hidden')? '' : typeSelect.value;
  for (let i=0;i<newUrls.length;i++){
    const linkName = `${existing.length + i + 1}. ${currentItemId} ${baseNamePart1} ${baseNamePart2}`.trim();
    await supabaseClient.from('LinkNames').insert({ name: linkName, link: newUrls[i], user_id: userId, column_name: currentItemId });
  }
  notify('Uploaded','success');
  closeModal();
  await renderUploads();
  await loadStats();
});

linkSubmit.addEventListener('click', async ()=>{
  if (!currentItemId) return;
  const link = linkInput.value.trim();
  if (!link){ notify('Enter link','warn'); return; }
  const { data: rowData, error } = await supabaseClient
    .from('Uploads')
    .select(currentItemId)
    .eq('user_id', userId)
    .single();
  if (error) { notify('Fetch failed','error'); return; }
  let existing = rowData[currentItemId] || [];
  if (existing.includes(link)){ notify('Already added','warn'); return; }
  existing.push(link);
  await supabaseClient.from('Uploads').update({ [currentItemId]: existing }).eq('user_id', userId);

  const baseNamePart1 = quantityWrapper.classList.contains('hidden')? '' : quantityInput.value;
  const baseNamePart2 = typeWrapper.classList.contains('hidden')? '' : typeSelect.value;
  const linkName = `${existing.length}. ${currentItemId} ${baseNamePart1} ${baseNamePart2}`.trim();
  await supabaseClient.from('LinkNames').insert({ name: linkName, link, user_id: userId, column_name: currentItemId });
  notify('Link saved','success');
  linkInput.value='';
  closeModal();
  await renderUploads();
  await loadStats();
});

logoutBtn.addEventListener('click', ()=>{ localStorage.clear(); window.location.href='login_page.html'; });
if (logoutBtnMobile){ logoutBtnMobile.addEventListener('click', ()=>{ localStorage.clear(); window.location.href='login_page.html'; }); }

document.getElementById('goto-profile').addEventListener('click',()=>{window.location.href='profile-setup.html';});

async function init(){
  ensureAuth();
  userNameEl.textContent = userName || 'User';
  userEmailEl.textContent = userEmail || '';
  if (userPicture) profileImage.src = userPicture;
  renderSidebar();
  appRoot.classList.remove('hidden');
  // Ensure Uploads row exists (already created at signup, but safe):
  // pick default first category item
  const firstItem = CATEGORY_GROUPS[0].items[0];
  statsSkeletonShownAt = performance.now();
  await selectItem(firstItem.id, firstItem.label);
  await loadStats();
}

init();
