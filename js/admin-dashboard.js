// supabase client initialization
const SUPABASE_URL = 'https://asccuwumidjqcwdcmsrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzY2N1d3VtaWRqcWN3ZGNtc3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjk1OTQsImV4cCI6MjA2Njg0NTU5NH0.eqmYPNdSoIjvAxKFlR4c-xQzW4FomEWSEe7nv-X4mFU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// maps groups to their items (refer the marking sheet B)
const CATEGORY_GROUPS = [
  { id:'basics', label:'Basics', items:['10th-percentage','12th-percentage','cgpa'] },
  { id:'github-profile', label:'GitHub Profile', items:['number-of-contributions','frequency-of-contributions','projects-done-for-community','number-of-collaborations'] },
  { id:'coding-practice-platform', label:'Coding Practice', items:['number-of-badges-or-recognitions','number-of-medium-or-hard-questions-solved'] },
  { id:'internship-experience', label:'Internships', items:['internship-one','internship-two','internship-three','internship-four','internship-five','internship-six','internship-seven','internship-eight','internship-nine','internship-ten'] },
  { id:'skillset-and-standard-certifications', label:'Certifications', items:['certificate-one','certificate-two','certificate-three','certificate-four','certificate-five'] },
  { id:'projects-done', label:'Projects', items:['project-one','project-two','project-three'] },
  { id:'full-stack-developer-experience', label:'Full Stack Experience', items:['fsd-project-one'] },
  { id:'coding-competitions-and-hackathons-won', label:'Hackathons', items:['hackathon-one','hackathon-two','hackathon-three','hackathon-four'] },
  { id:'inhouse-projects-done', label:'In-house Projects', items:['inhouse-one','inhouse-two'] },
  { id:'membership-of-professional-bodies', label:'Memberships', items:['membership-one'] },
];

// maps items to parents
const TITLE_PARENT = {
  '10th-percentage':'basics', '12th-percentage':'basics', 'cgpa':'basics',
  'number-of-contributions':'github-profile','frequency-of-contributions':'github-profile','projects-done-for-community':'github-profile','number-of-collaborations':'github-profile',
  'number-of-badges-or-recognitions':'coding-practice-platform','number-of-medium-or-hard-questions-solved':'coding-practice-platform',
  'internship-one':'internship-experience','internship-two':'internship-experience','internship-three':'internship-experience','internship-four':'internship-experience','internship-five':'internship-experience','internship-six':'internship-experience','internship-seven':'internship-experience','internship-eight':'internship-experience','internship-nine':'internship-experience','internship-ten':'internship-experience',
  'certificate-one':'skillset-and-standard-certifications','certificate-two':'skillset-and-standard-certifications','certificate-three':'skillset-and-standard-certifications','certificate-four':'skillset-and-standard-certifications','certificate-five':'skillset-and-standard-certifications',
  'project-one':'projects-done','project-two':'projects-done','project-three':'projects-done',
  'fsd-project-one':'full-stack-developer-experience',
  'hackathon-one':'coding-competitions-and-hackathons-won','hackathon-two':'coding-competitions-and-hackathons-won','hackathon-three':'coding-competitions-and-hackathons-won','hackathon-four':'coding-competitions-and-hackathons-won',
  'inhouse-one':'inhouse-projects-done','inhouse-two':'inhouse-projects-done',
  'membership-one':'membership-of-professional-bodies'
};

// max marks each group can have
const PARENT_MAX = {
  'basics':10,'github-profile':15,'coding-practice-platform':10,'internship-experience':10,'skillset-and-standard-certifications':15,'projects-done':5,'full-stack-developer-experience':5,'coding-competitions-and-hackathons-won':10,'inhouse-projects-done':8,'membership-of-professional-bodies':2
};

// kind of like a react useState
let currentItemId = null;
let selectedStudentId = null;

// DOM
const userNameEl = document.getElementById('user-name');
const navGroupsUl = document.getElementById('nav-groups');
const navGroupsMobile = document.getElementById('nav-groups-mobile');
const openMobileNavBtn = document.getElementById('open-mobile-nav');
const mobileDrawer = document.getElementById('mobile-drawer');
const closeMobileNavBackdrop = document.getElementById('close-mobile-nav');
const closeMobileNavBtn = document.getElementById('close-mobile-nav-btn');
const uploadTitle = document.getElementById('upload-title-text');
const uploadPreview = document.getElementById('upload-preview-admin');
const marksInput = document.getElementById('marks-input');
const submitMarksBtn = document.getElementById('submit-marks');
const exportBtn = document.getElementById('menu-export-csv');
const exportAllBtn = document.getElementById('menu-export-all');
const studentSelect = document.getElementById('student-select');
const profileImage = document.getElementById('profile-image');
const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const logoutBtnMobile = document.getElementById('logout-btn-mobile');
const currentSectionPill = document.getElementById('current-section-pill');

// Stats + header menu DOM
const adminStatsGrid = document.getElementById('admin-stats-grid');
const statsOverallBtn = document.getElementById('stats-overall-btn');
const statsSelectedBtn = document.getElementById('stats-selected-btn');
const headerMenuBtn = document.getElementById('header-menu-btn');
const headerMenu = document.getElementById('header-menu');
const menuExportCsv = document.getElementById('menu-export-csv');
const menuExportAll = document.getElementById('menu-export-all');

// admin details from localStorage
const adminName = localStorage.getItem('userName');
const adminEmail = localStorage.getItem('userEmail');
const adminPicture = localStorage.getItem('userPicture');
const adminId = localStorage.getItem('userId');

// a helper function to build a skeleton loader for lists
// basically shows a loading effect on the frontend when fetching data
function buildListSkeleton(rows=4) {

  const wrap = document.createElement('div');
  wrap.className = 'space-y-2';

  for (let i = 0; i < rows; i++) {
    const r = document.createElement('div');
    r.className = 'h-8 rounded-lg shimmer';
    wrap.appendChild(r);
  }

  return wrap.outerHTML;

}

// toast / notification utilities
// this function is called if you want to notify something in the frontend
function notify(msg, type = 'info') {

  // enque our message as a toast
  enqueueToast(msg, type);

}

const TOAST_LIMIT = 5; // amount of toasts that can be showed on frontend at once
let toastQueue = []; // queue of all toasts
let activeToasts = []; // toasts currently being shown

function enqueueToast(message, type = 'info', options = {}) {

  // create a unique id for this toast
  // this will be useful later when we want to remove it from active toasts
  // Math.random() to avoid collisions in case of multiple toasts in the same millisecond
  // remember Math.random() returns a number between 0 and 1
  const id = Date.now() + Math.random();

  // so a toast is a tuple of id, message, type and options (we don't use options currently but it's there for future extensibility)
  toastQueue.push({ id, message, type, options });
  processToastQueue();

}

// this puts the toasts from the queue into the DOM if there's space
function processToastQueue() {

  // get the thing that shows toasts on the frontend
  const stack = document.getElementById('toast-stack');
  if (!stack) // if it's null for some reason just get out of the function
    return;
  // if there are less than TOAST_LIMIT active toasts, render more from the queue
  while (activeToasts.length < TOAST_LIMIT && toastQueue.length) {
    renderToast(toastQueue.shift(), stack); // take the first toast from the queue and render it in the stack div
  }

}

function renderToast(toast, stack) {

  activeToasts.push(toast);

  // we make a div that represents the toast itself
  const div = document.createElement('div');
  const color = toast.type==='error'? 'text-red-600 border-red-200 bg-red-50': toast.type==='success'? 'text-green-600 border-green-200 bg-green-50': toast.type==='warn'? 'text-yellow-700 border-yellow-200 bg-yellow-50':'text-indigo-600 border-indigo-200 bg-indigo-50';
  div.className = 'pointer-events-auto w-full rounded-lg shadow ring-1 ring-black/10 backdrop-blur bg-white/90 dark:bg-gray-800/90 flex items-start gap-3 px-4 py-3 animate-[fadeIn_.25s_ease]';
  div.innerHTML = `<div class="flex-1 text-sm font-medium ${color}">${toast.message}</div><button class="shrink-0 text-gray-400 hover:text-gray-600" aria-label="Close">&times;</button>`;
  
  // get the close button using which the toast can be closed by the user
  const closeBtn = div.querySelector('button');
  const remove = () => dismissToast(toast.id, div); // we define a function that removes the toast from active toasts and the DOM

  // close button should remove the toast when clicked
  closeBtn.addEventListener('click', remove);

  // append the toast div to the stack
  stack.appendChild(div);

  // set a timeout to automatically remove the toast after some time (default 3.5s) if the user doesn't close it manually
  setTimeout(remove, toast.options.ttl || 3500);

}

function dismissToast(id, el) {

  activeToasts = activeToasts.filter(t => t.id !== id);
  if (el && el.parentElement) {
    // remove element from DOM with a fade-out effect
    el.style.opacity = '0';
    el.style.transform = 'translateY(-4px)';

    // el.remove() is not the remove we defined in renderToast, it's a DOM method that removes the element from the DOM
    // we remove the element and continue processing the toast queue
    setTimeout(() => { el.remove(); processToastQueue(); }, 180);
  }
  else
    // if el is not provided, just continue processing the toast queue
    processToastQueue();

}

// if localStorage doesn't have adminId, redirect to login page :fire:
function ensureAuth() {

  if (!adminId) {
    window.location.href = '../html/login_page.html';
  }

}

function renderSidebar(){

  // we create a fragment to minimize reflows (a reflow is when the browser has to recalculate styles and layout due to DOM changes, which can be expensive if done repeatedly)
  const fragment = document.createDocumentFragment(); // for PC
  const fragmentMobile = document.createDocumentFragment(); // for mobile
  CATEGORY_GROUPS.forEach(group => {

    // Desktop item
    const li = document.createElement('li');
    const innerUl = document.createElement('ul');
    innerUl.className='-mx-2 space-y-1'; // tailwind css stuff
    const headerBtn = document.createElement('button');
    headerBtn.type='button';
    headerBtn.className='group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white items-center justify-between';
    headerBtn.innerHTML = `<span>${group.label}</span><svg class="size-4 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>`;
    let open=false;
    const itemsWrap = document.createElement('div');
    itemsWrap.className='hidden pl-2';
    group.items.forEach(id=>{
      const btn = document.createElement('button');
      btn.type='button';
      btn.className='w-full text-left flex gap-x-3 rounded-md p-2 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white';
      btn.textContent = id.replace(/-/g,' ');
      btn.addEventListener('click',()=>selectItem(id));
      itemsWrap.appendChild(btn);
    });
    headerBtn.addEventListener('click',()=>{open=!open; itemsWrap.classList.toggle('hidden',!open); headerBtn.classList.toggle('bg-gray-800',open); headerBtn.classList.toggle('text-white',open);});
    innerUl.appendChild(headerBtn); innerUl.appendChild(itemsWrap); li.appendChild(innerUl); fragment.appendChild(li);

    // Mobile clone
    if (navGroupsMobile){
      const liM = document.createElement('li');
      const innerUlM = document.createElement('ul');
      innerUlM.className='space-y-1';
      const headerBtnM = document.createElement('button');
      headerBtnM.type='button';
      headerBtnM.className='group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white items-center justify-between';
      headerBtnM.innerHTML = `<span>${group.label}</span><svg class="size-4 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>`;
      let openM=false;
      const itemsWrapM = document.createElement('div');
      itemsWrapM.className='hidden pl-2';
      group.items.forEach(id=>{
        const btn = document.createElement('button');
        btn.type='button';
        btn.className='w-full text-left flex gap-x-3 rounded-md p-2 text-xs font-medium text-gray-300 hover:bg-gray-800 hover:text-white';
        btn.textContent = id.replace(/-/g,' ');
        btn.addEventListener('click',()=>{ selectItem(id); toggleMobileDrawer(false); });
        itemsWrapM.appendChild(btn);
      });
      headerBtnM.addEventListener('click',()=>{openM=!openM; itemsWrapM.classList.toggle('hidden',!openM); headerBtnM.classList.toggle('bg-gray-800',openM); headerBtnM.classList.toggle('text-white',openM);});
      innerUlM.appendChild(headerBtnM); innerUlM.appendChild(itemsWrapM); liM.appendChild(innerUlM); fragmentMobile.appendChild(liM);
    }
  });
  navGroupsUl.appendChild(fragment);
  if (navGroupsMobile) navGroupsMobile.appendChild(fragmentMobile);
}

// loads all students that belong to this admin from the database
async function loadStudents(){
  // reset the dropdown to show a placeholder option
  studentSelect.innerHTML = '<option value="" disabled selected>Select Student</option>';
  
  // fetch all students whose admin field matches this admin's ID
  const { data, error } = await supabaseClient
    .from('Users')
    .select('id,name,email')
    .eq('admin', adminId);
  
  // if there's an error fetching students, show a notification and bail out
  if (error){ notify('Student fetch failed','error'); return; }
  
  // if no students were found, show a message in the dropdown
  if (!data || data.length===0){ studentSelect.innerHTML='<option>No students found</option>'; return; }
  
  // for each student, create an option element and add it to the dropdown
  data.forEach(st=>{
    const opt=document.createElement('option');
    opt.value=st.id; opt.textContent=`${st.name} (${st.email})`; studentSelect.appendChild(opt);
  });
  
  // Auto-select the first student if not selected
  if (!selectedStudentId && data.length>0){
    selectedStudentId = data[0].id;
    studentSelect.value = selectedStudentId;
  }
}

// when the student dropdown changes, update the selected student and reload data
studentSelect.addEventListener('change',(e)=>{ selectedStudentId = e.target.value; if(currentItemId) selectItem(currentItemId); if (!showOverallStats) loadSelectedStats(); });

// called when an item (like "10th-percentage" or "internship-one") is selected from the sidebar
async function selectItem(id){
  // make sure a student is selected before proceeding
  if(!selectedStudentId){ notify('Pick a student.','warn'); return; }
  
  // update the current item ID (kind of like setting state in React)
  currentItemId = id;
  
  // update the UI to show which item is currently selected
  uploadTitle.textContent = id.replace(/-/g,' ');
  currentSectionPill.textContent = uploadTitle.textContent;
  
  // get the parent category of this item (e.g., "basics" for "10th-percentage")
  const parent = TITLE_PARENT[id];
  
  // set the max value for the marks input based on the parent category
  marksInput.max = PARENT_MAX[parent];
  
  // fetch and display the uploads for this item
  await renderUploads();
  
  // load any existing marks for this category
  await loadExistingMarks(parent);
}

// fetches and displays the uploads (links) for the currently selected item
async function renderUploads(){
  // show skeleton loader while fetching
  uploadPreview.innerHTML = buildListSkeleton(5);
  
  // fetch the specific column (item) from the Uploads table for this student
  const { data, error } = await supabaseClient
    .from('Uploads')
    .select(currentItemId)
    .eq('user_id', selectedStudentId)
    .single();
  
  // if there's an error, show an error message
  if (error){ uploadPreview.innerHTML='<p class="text-xs text-red-500">Failed to load.</p>'; return; }
  
  // get the array of URLs for this item
  const urls = data[currentItemId];
  
  // if there are no uploads, show a message
  if(!urls || urls.length===0){ uploadPreview.innerHTML='<p class="text-sm text-gray-500">No uploads yet.</p>'; return; }
  
  // clear the skeleton loader
  uploadPreview.innerHTML='';
  
  // for each URL, create a nice-looking item with a link and delete button
  for(let i=0;i<urls.length;i++){
    const url=urls[i];
    const div=document.createElement('div');
    div.className='flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 text-sm';
    const a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; a.className='text-indigo-600 font-medium truncate max-w-[60vw] sm:max-w-xs';
    
    // default display text
    let display=`Item ${i+1}`;
    
    // try to get a custom name for this link from the LinkNames table
    const { data: linkNameData } = await supabaseClient
      .from('LinkNames')
      .select('name')
      .eq('link', url)
      .eq('user_id', selectedStudentId)
      .eq('column_name', currentItemId)
      .maybeSingle();
    
    // if a custom name exists, use it
    if (linkNameData?.name) display = linkNameData.name;
    a.textContent=display;
    
    // create a delete button
    const delBtn=document.createElement('button');
    delBtn.className='text-xs text-red-600 hover:text-red-700 font-medium';
    delBtn.textContent='Delete';
    delBtn.addEventListener('click',()=>handleDelete(url));
    
    // add the link and delete button to the div, then add the div to the preview area
    div.appendChild(a); div.appendChild(delBtn); uploadPreview.appendChild(div);
  }
}

// handles deleting a link/upload from the database
async function handleDelete(url){
  // first, delete any custom name for this link from LinkNames table
  await supabaseClient.from('LinkNames').delete().eq('link', url).eq('user_id', selectedStudentId).eq('column_name', currentItemId);
  
  // fetch the current array of links for this item
  const { data, error } = await supabaseClient.from('Uploads').select(currentItemId).eq('user_id', selectedStudentId).single();
  if (error) { notify('Delete failed','error'); return; }
  
  // filter out the deleted URL from the array
  const existing = data[currentItemId] || [];
  const updated = existing.filter(l=>l!==url);
  
  // update the database with the new array (without the deleted URL)
  await supabaseClient.from('Uploads').update({ [currentItemId]: updated }).eq('user_id', selectedStudentId);
  
  // show success message and refresh the uploads list
  notify('Deleted');
  await renderUploads();
}

// loads the existing marks for a category and displays them in the input field
async function loadExistingMarks(parent){
  // fetch the marks for this parent category (e.g., "basics", "github-profile")
  const { data, error } = await supabaseClient
    .from('UploadsMarks')
    .select(parent)
    .eq('user_id', selectedStudentId)
    .single();
  
  // if there's an error, clear the input field
  if (error){ marksInput.value=''; return; }
  
  // populate the input field with the existing marks (or 0 if none exist)
  marksInput.value = data[parent] || 0;
}

// debounce timer for auto-saving marks as the user types
let marksDebounce;

// when the marks input changes, wait 400ms before saving (debouncing)
marksInput.addEventListener('input',()=>{ clearTimeout(marksDebounce); marksDebounce=setTimeout(saveMarks,400); });

// also save marks when the submit button is clicked
submitMarksBtn.addEventListener('click', saveMarks);

// saves the marks entered by the admin to the database
async function saveMarks(){
  // make sure an item is selected before saving
  if(!currentItemId){ notify('Pick item','warn'); return; }
  
  // get the parent category for this item
  const parent = TITLE_PARENT[currentItemId];
  
  // parse the value from the input field (default to 0 if invalid)
  const val = parseFloat(marksInput.value)||0;
  
  // validate that the marks don't exceed the maximum allowed for this category
  if (val > PARENT_MAX[parent]) { notify('Exceeds max','warn'); marksInput.value=PARENT_MAX[parent]; return; }
  
  // update the database with the new marks
  const { error } = await supabaseClient
    .from('UploadsMarks')
    .update({ [parent]: val })
    .eq('user_id', selectedStudentId);
  
  // if there's an error, show a notification
  if (error){ notify('Save failed','error'); return; }
  
  // show success message
  notify('Marks saved','success');
}

// hook up the export button to the export function
exportBtn.addEventListener('click', exportCSV);

// exports the marks for the currently selected student as a CSV file
async function exportCSV(){
  // make sure a student is selected
  if(!selectedStudentId){ notify('Pick student','warn'); return; }
  
  // fetch all marks for this student
  const { data: marksData, error } = await supabaseClient
    .from('UploadsMarks')
    .select('*')
    .eq('user_id', selectedStudentId)
    .single();
  
  // if there's an error, bail out
  if (error){ notify('Export failed','error'); return; }
  
  // fetch the student's name to use in the filename
  const { data: studentData } = await supabaseClient
    .from('Users')
    .select('name')
    .eq('id', selectedStudentId)
    .maybeSingle();
  
  const studentName = studentData?.name || 'student';
  
  // build the CSV: headers are the category names from PARENT_MAX
  const headers = Object.keys(PARENT_MAX);
  
  // build a row of marks for each category
  const row = headers.map(h=>marksData[h] ?? '').join(',');
  
  // combine headers and row into CSV format
  const csv = `Student Name,${headers.join(',')}\n${studentName},${row}`;
  
  // create a Blob (binary large object) from the CSV string
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  // create a temporary URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // create a temporary link element, click it to download, then remove it
  const a=document.createElement('a'); a.href=url; a.download=`${studentName}_marks.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  
  notify('CSV exported','success');
}

// if the export all button exists, hook it up to the export all function
if (exportAllBtn){
  exportAllBtn.addEventListener('click', exportAllCSV);
}

// exports marks for ALL students belonging to this admin as a single CSV file
async function exportAllCSV(){
  // Fetch all students belonging to this admin
  const { data: students, error: stErr } = await supabaseClient
    .from('Users')
    .select('id,name,email')
    .eq('admin', adminId);
  
  if (stErr){ notify('Failed to fetch students','error'); return; }
  if (!students || students.length===0){ notify('No students to export','warn'); return; }
  
  // Fetch marks for all students
  const ids = students.map(s=>s.id);
  const { data: marksRows, error: mErr } = await supabaseClient
    .from('UploadsMarks')
    .select('*')
    .in('user_id', ids);
  
  if (mErr){ notify('Failed to fetch marks','error'); return; }
  
  // create a map of user_id to marks row for easy lookup
  const byId = new Map(marksRows.map(r=>[r.user_id, r]));
  
  // build CSV headers: student name, email, then all category names
  const headers = ['Student Name','Email', ...Object.keys(PARENT_MAX)];
  const lines = [headers.join(',')];
  
  // for each student, build a row with their name, email, and marks for each category
  for (const s of students){
    const row = byId.get(s.id) || {};
    const vals = Object.keys(PARENT_MAX).map(h=> row[h] ?? '');
    lines.push([s.name, s.email, ...vals].join(','));
  }
  
  // join all lines into a single CSV string
  const csv = lines.join('\n');
  
  // create a Blob and download it
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`all_students_marks.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  
  notify('All students CSV exported','success');
}

// ---------- Stats (Overall / Selected) and Header Menu ----------

// track when the skeleton was shown to ensure minimum display time
let statsSkeletonShownAt = performance.now();

// flag to determine whether to show overall stats (all students) or selected student stats
let showOverallStats = true;

// displays skeleton loaders for the stats cards
function setStatsSkeleton(){
  if (!adminStatsGrid) return;
  
  // clear existing stats
  adminStatsGrid.innerHTML = '';
  
  // create 12 skeleton cards with shimmer effects
  for(let i=0;i<12;i++){
    const s = document.createElement('div');
    s.className='rounded-xl border border-gray-200 p-4 bg-white';
    s.innerHTML='<div class="h-3 w-24 rounded shimmer mb-4"></div><div class="h-7 w-16 rounded shimmer mb-3"></div><div class="h-1.5 w-full rounded shimmer"></div>';
    adminStatsGrid.appendChild(s);
  }
  
  // remember when we showed the skeleton (for minimum display duration)
  statsSkeletonShownAt = performance.now();
}

// creates a single stat card showing upload progress for a category
function statCard(label, uploaded, total){
  // calculate percentage (avoid division by zero)
  const pct = total ? Math.round((uploaded/total)*100) : 0;
  
  const card = document.createElement('div');
  card.className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col';
  
  // build the card HTML: label, percentage badge, counts, and progress bar
  card.innerHTML = `<div class="flex items-center justify-between mb-2"><p class="text-xs font-medium text-gray-500 uppercase tracking-wide">${label}</p><span class="text-[10px] font-medium px-2 py-0.5 rounded-full ${pct===100?'bg-green-100 text-green-700':'bg-indigo-100 text-indigo-700'}">${pct}%</span></div><div class="flex-1 flex items-end"><p class="text-2xl font-semibold text-gray-800">${uploaded}<span class="text-sm text-gray-400 font-normal">/${total}</span></p></div><div class="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div class="h-full rounded-full ${pct===100?'bg-green-500':'bg-indigo-500'}" style="width:${pct}%;"></div></div>`;
  
  return card;
}

// loads and displays stats for the currently selected student
async function loadSelectedStats(){
  if (!adminStatsGrid) return;
  if (!selectedStudentId) { setStatsSkeleton(); return; }
  
  // show skeleton while loading
  setStatsSkeleton();
  const started = performance.now();
  
  // fetch all uploads for this student
  const { data, error } = await supabaseClient
    .from('Uploads')
    .select('*')
    .eq('user_id', selectedStudentId)
    .maybeSingle();
  
  if (error){ adminStatsGrid.innerHTML=''; notify('Stats load failed','error'); return; }
  
  // for each category group, count how many items have uploads
  const stats = CATEGORY_GROUPS.map(g=>{
    let total=0; let uploaded=0;
    g.items.forEach(i=>{
      total++;
      const arr = data?.[i] || [];
      if (Array.isArray(arr) && arr.length>0) uploaded++;
    });
    return { label: g.label, uploaded, total };
  });
  
  // ensure skeleton shows for at least 800ms for smooth UX
  const MIN_SKELETON_MS = 800;
  const elapsed = started - statsSkeletonShownAt;
  if (elapsed < MIN_SKELETON_MS){ await new Promise(r=>setTimeout(r, MIN_SKELETON_MS - elapsed)); }
  
  // clear skeleton and show actual stat cards
  adminStatsGrid.innerHTML='';
  stats.forEach(s=> adminStatsGrid.appendChild(statCard(s.label, s.uploaded, s.total)));
}

// loads and displays overall stats for ALL students belonging to this admin
async function loadOverallStats(){
  if (!adminStatsGrid) return;
  
  // show skeleton while loading
  setStatsSkeleton();
  const started = performance.now();
  
  // fetch all students belonging to this admin
  const { data: students, error: stErr } = await supabaseClient
    .from('Users')
    .select('id')
    .eq('admin', adminId);
  
  if (stErr){ adminStatsGrid.innerHTML=''; notify('Stats load failed','error'); return; }
  
  const ids = (students||[]).map(s=>s.id);
  if (ids.length===0){ adminStatsGrid.innerHTML=''; notify('No students','warn'); return; }
  
  // fetch uploads for all students
  const { data: uploadsRows, error: upErr } = await supabaseClient
    .from('Uploads')
    .select('*')
    .in('user_id', ids);
  
  if (upErr){ adminStatsGrid.innerHTML=''; notify('Stats load failed','error'); return; }
  
  // for each category group, count total items across all students and how many have uploads
  const stats = CATEGORY_GROUPS.map(g=>{
    const total = g.items.length * ids.length; // e.g., 3 items × 5 students = 15 total
    let uploaded = 0;
    
    for (const row of uploadsRows){
      for (const item of g.items){
        const arr = row[item];
        if (Array.isArray(arr) && arr.length>0) uploaded++;
      }
    }
    
    return { label: g.label, uploaded, total };
  });
  
  // ensure skeleton shows for at least 800ms for smooth UX
  const MIN_SKELETON_MS = 800;
  const elapsed = started - statsSkeletonShownAt;
  if (elapsed < MIN_SKELETON_MS){ await new Promise(r=>setTimeout(r, MIN_SKELETON_MS - elapsed)); }
  
  // clear skeleton and show actual stat cards
  adminStatsGrid.innerHTML='';
  stats.forEach(s=> adminStatsGrid.appendChild(statCard(s.label, s.uploaded, s.total)));
}

// updates the UI for the stats toggle buttons and loads the appropriate stats
function updateStatsToggle(){
  if (!statsOverallBtn || !statsSelectedBtn) return;
  
  if (showOverallStats){
    // highlight the overall button and load overall stats
    statsOverallBtn.classList.add('bg-indigo-600','text-white');
    statsSelectedBtn.classList.remove('bg-indigo-600','text-white');
    statsSelectedBtn.classList.add('text-gray-700');
    loadOverallStats();
  } else {
    // highlight the selected button and load selected student stats
    statsSelectedBtn.classList.add('bg-indigo-600','text-white');
    statsOverallBtn.classList.remove('bg-indigo-600','text-white');
    statsOverallBtn.classList.add('text-gray-700');
    loadSelectedStats();
  }
}

// Header menu interactions (the three-dot menu in the header)
if (headerMenuBtn){
  // toggle the menu visibility when the button is clicked
  headerMenuBtn.addEventListener('click', ()=>{
    headerMenu.classList.toggle('hidden');
  });
  
  // close the menu when clicking outside of it
  document.addEventListener('click',(e)=>{
    if (!headerMenuBtn.contains(e.target) && !headerMenu.contains(e.target)){
      headerMenu.classList.add('hidden');
    }
  });
}

// hook up the menu items to their respective functions
if (menuExportCsv){ menuExportCsv.addEventListener('click', ()=>{ headerMenu.classList.add('hidden'); exportCSV(); }); }
if (menuExportAll){ menuExportAll.addEventListener('click', ()=>{ headerMenu.classList.add('hidden'); exportAllCSV(); }); }

// hook up the stats toggle buttons
if (statsOverallBtn){ statsOverallBtn.addEventListener('click', ()=>{ showOverallStats=true; updateStatsToggle(); }); }
if (statsSelectedBtn){ statsSelectedBtn.addEventListener('click', ()=>{ showOverallStats=false; updateStatsToggle(); }); }

// Mobile drawer controls (the hamburger menu for small screens)
function toggleMobileDrawer(open){
  if (!mobileDrawer) return;
  
  if (open){
    // show the drawer and prevent body scrolling
    mobileDrawer.classList.remove('hidden');
    document.body.style.overflow='hidden';
  } else {
    // hide the drawer and restore body scrolling
    mobileDrawer.classList.add('hidden');
    document.body.style.overflow='';
  }
}

// hook up the mobile drawer controls
if (openMobileNavBtn){ openMobileNavBtn.addEventListener('click', ()=>toggleMobileDrawer(true)); }
if (closeMobileNavBackdrop){ closeMobileNavBackdrop.addEventListener('click', ()=>toggleMobileDrawer(false)); }
if (closeMobileNavBtn){ closeMobileNavBtn.addEventListener('click', ()=>toggleMobileDrawer(false)); }

// logout functionality: clear localStorage and redirect to login page
logoutBtn.addEventListener('click',()=>{ localStorage.clear(); window.location.href='../html/login_page.html'; });
if (logoutBtnMobile){ logoutBtnMobile.addEventListener('click',()=>{ localStorage.clear(); window.location.href='../html/login_page.html'; }); }

// profile button: redirect to profile setup page
document.getElementById('goto-profile').addEventListener('click',()=>{window.location.href='../html/profile-setup.html';});

// initialization function that runs when the page loads
async function init(){
  // check if the admin is logged in, redirect to login if not
  ensureAuth();
  
  // clear the name and email fields (they'll be populated if we add that feature later)
  userNameEl.textContent = '';
  userEmailEl.textContent = '';
  
  // set the admin's profile picture if available
  if (adminPicture) profileImage.src = adminPicture;
  
  // render the sidebar navigation
  renderSidebar();
  
  // load all students belonging to this admin
  await loadStudents();
  
  // load the initial stats (overall by default)
  updateStatsToggle();
  
  // If student and categories are both available, preselect first category for smoother load
  if (!currentItemId && selectedStudentId){
    const firstGroup = CATEGORY_GROUPS[0];
    const firstItem = firstGroup?.items?.[0];
    if (firstItem){
      await selectItem(firstItem);
    }
  }
  
  // show the app (remove hidden class from root element)
  document.getElementById('app-root').classList.remove('hidden');
}

// start the app!
init();