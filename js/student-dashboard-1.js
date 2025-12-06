// Student Dashboard Script (Tailwind UI based)
// =============================================================

import * as db from './database-functions.js';

// Category metadata - defines all the groups and items students can upload evidence for
// each group has an id, label, color (for UI), and a list of items
const CATEGORY_GROUPS = [
  {
    id: 'basics',
    label: 'Basics',
    color: 'indigo',
    items: [
      { id: 'full-registration-number', label: 'Full Registration Number' },
      { id: 'full-name', label: 'Full Name' },
      { id: 'gender', label: 'Gender' },
      { id: 'nri-student', label: 'NRI Student' },
      { id: 'date-of-birth', label: 'Date of Birth' },
      { id: 'department', label: 'Department' },
      { id: 'specialization', label: 'Specialization' },
      { id: 'section', label: 'Section' },
      { id: 'srmist-mail-id', label: 'SRMIST Mail ID' },
      { id: 'personal-mail-id', label: 'Personal Mail ID' },
      { id: 'mobile-number-contact-whatsapp', label: 'Mobile Number (WhatsApp)'},
      { id: 'alternate-number', label: 'Alternate Number' },
    ],
  },
  {
    id: 'parents-details',
    label: 'Parents Details',
    color: 'violet',
    items: [
      { id: 'father-mobile-number', label: 'Father Mobile Number' },
      { id: 'father-email-id', label: 'Father Email ID' },
      { id: 'mother-mobile-number', label: 'Mother Mobile Number' },
      { id: 'mother-email-id', label: 'Mother Email ID' },
      { id: 'guardian-contact-number', label: 'Guardian Contact Number' },
    ],
  },
  {
    id: 'academic-details',
    label: 'Academic Details',
    color: 'fuchsia',
    items: [
      { id: 'name-of-faculty-advisor', label: 'Name of Faculty Advisor' },
      { id: 'languages-known', label: 'Languages Known' },
      { id: 'tenth-percentage', label: '10th Percentage' },
      { id: 'tenth-medium-of-instruction', label: '10th Medium of Instruction' },
      { id: 'tenth-board-of-studies', label: '10th Board of Studies' },
      { id: 'studied-diploma', label: 'Studied Diploma' },
      { id: 'twelfth-or-diploma-percentage', label: '12th / Diploma Percentage' },
      { id: 'twelfth-medium-of-instruction', label: '12th Medium of Instruction' },
      { id: 'twelfth-board-of-studies', label: '12th Board of Studies' },
      { id: 'cgpa-upto-6th-semester', label: 'CGPA up to 6th Semester' },
      { id: 'no-of-standing-arrears', label: 'No. of Standing Arrears' },
      { id: 'history-of-arrears', label: 'History of Arrears' },
      { id: 'github-profile-link', label: 'GitHub Profile Link' },
      { id: 'coding-practice-platform', label: 'Coding Practice Platform' },
      { id: '10th-12th-marksheet-pdf-upload', label: '10th & 12th Marksheet PDF Upload (Both in Single PDF)' },
    ],
  }
];

// Help text / config for dynamic modal inputs
// This object describes the expected UI for each item. It contains two kinds of properties:
// - quantity: a label for the numeric input (the existing `quantity` input in the modal)
// - type: an object { label, options } used by the existing `type` select in the modal
// - input: a descriptive hint of the input type (text | date | boolean | file | link) for future UI
// We keep `type` and `quantity` where the current modal code expects them so backward compatibility
// is preserved. The additional `input` property can be used when you extend the modal UI.
const FIELD_CONFIG = {
  // Basics
  'full-registration-number': { input: 'text' },
  'full-name': { input: 'text' },
  'gender': { input: 'type', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  'nri-student': { input: 'type', options: ['Yes', 'No'] },
  'date-of-birth': { input: 'date' },
  'department': { input: 'type', options: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'Other'] },
  'specialization': { input: 'text' },
  'section': { input: 'text' },
  'srmist-mail-id': { input: 'text' },
  'personal-mail-id': { input: 'text' },
  'mobile-number-contact-whatsapp': { input: 'text' },
  'alternate-number': { input: 'text' },

  // Parents details
  'father-mobile-number': { input: 'text' },
  'father-email-id': { input: 'text' },
  'mother-mobile-number': { input: 'text' },
  'mother-email-id': { input: 'text' },
  'guardian-contact-number': { input: 'text' },

  // Academic details
  'name-of-faculty-advisor': { input: 'text' },
  'languages-known': { input: 'text' },
  'tenth-percentage': { input: 'quantity' },
  'tenth-medium-of-instruction': { input: 'type', options: ['English', 'Tamil', 'Other'] },
  'tenth-board-of-studies': { input: 'text' },
  'studied-diploma': { input: 'type', options: ['Yes', 'No'] },
  'twelfth-or-diploma-percentage': { input: 'quantity' },
  'twelfth-medium-of-instruction': { input: 'type', options: ['English', 'Tamil', 'Other'] },
  'twelfth-board-of-studies': { input: 'text' },
  'cgpa-upto-6th-semester': { input: 'quantity' },
  'no-of-standing-arrears': { input: 'quantity' },
  'history-of-arrears': { input: 'text' },
  'github-profile-link': { input: 'link' },
  'coding-practice-platform': { input: 'type-and-link', options: ['LeetCode', 'CodeChef', 'Codeforces', 'HackerRank', 'GeeksforGeeks', 'Other'] },
  '10th-12th-marksheet-pdf-upload': { input: 'file' }
};

// State variables - kind of like React useState
let userId = localStorage.getItem('userId'); // user ID from login
const userName = localStorage.getItem('userName'); // user's name
const userEmail = localStorage.getItem('userEmail'); // user's email
const userPicture = localStorage.getItem('userPicture'); // user's profile picture
let statsSkeletonShownAt = performance.now(); // timestamp for skeleton loader timing

// DOM references - all the UI elements we'll be interacting with
const appRoot = document.getElementById('app-root');
const navGroupsUl = document.getElementById('nav-groups');
const navGroupsMobile = document.getElementById('nav-groups-mobile');
const openMobileNavBtn = document.getElementById('open-mobile-nav');
const mobileDrawer = document.getElementById('mobile-drawer');
const closeMobileNavBackdrop = document.getElementById('close-mobile-nav');
const closeMobileNavBtn = document.getElementById('close-mobile-nav-btn');
const statsGrid = document.getElementById('stats-grid');
const profileImage = document.getElementById('profile-image');
const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const logoutBtnMobile = document.getElementById('logout-btn-mobile');

// Modal references - elements for the upload modal dialog
const formDiv = document.getElementById('form-div');
const currentSectionPill = document.getElementById('current-section-pill');

// Toast / Notification Utilities
// this is the notification system that shows popup messages at the top of the screen
function notify(msg, type='info') {
  // legacy popup fallback (kept for compatibility) -> now delegates to toast system
  enqueueToast(msg, type);
}

// constants for the toast queue system
const TOAST_LIMIT = 5; // maximum number of toasts to show at once
let toastQueue = []; // queue of pending toasts
let activeToasts = []; // currently displayed toasts

// adds a toast to the queue
function enqueueToast(message, type='info', options={}){
  // create unique ID using timestamp + random number to avoid collisions
  const id = Date.now() + Math.random();
  toastQueue.push({ id, message, type, options });
  processToastQueue();
}

// processes the toast queue and displays toasts if there's space
function processToastQueue(){
  const stack = document.getElementById('toast-stack');
  if(!stack) return; // safety check
  
  // while we have space and toasts waiting, render them
  while (activeToasts.length < TOAST_LIMIT && toastQueue.length){
    const toast = toastQueue.shift(); // take first toast from queue
    renderToast(toast, stack);
  }
}

// renders a single toast notification
function renderToast(toast, stack){
  activeToasts.push(toast);
  
  // create the toast element
  const div = document.createElement('div');
  div.className = `pointer-events-auto w-full rounded-lg shadow ring-1 ring-black/10 backdrop-blur bg-white/90 dark:bg-gray-800/90 flex items-start gap-3 px-4 py-3 animate-[fadeIn_.25s_ease]`;
  
  // determine color based on toast type
  const color = toast.type==='error'? 'text-red-600 border-red-200 bg-red-50': toast.type==='success'? 'text-green-600 border-green-200 bg-green-50': toast.type==='warn'? 'text-yellow-700 border-yellow-200 bg-yellow-50':'text-indigo-600 border-indigo-200 bg-indigo-50';
  
  // build the toast HTML with message and close button
  div.innerHTML = `<div class="flex-1 text-sm font-medium ${color} bg-opacity-40">${toast.message}</div><button class="shrink-0 text-gray-400 hover:text-gray-600" aria-label="Close">&times;</button>`;
  
  // set up close button
  const closeBtn = div.querySelector('button');
  const remove = () => dismissToast(toast.id, div);
  closeBtn.addEventListener('click', remove);
  
  // add to DOM
  stack.appendChild(div);
  
  // auto-dismiss after time-to-live (default 3.5 seconds)
  const ttl = toast.options.ttl || 3500;
  setTimeout(remove, ttl);
}

// dismisses a toast and processes the queue to show the next one
function dismissToast(id, el){
  // remove from active toasts array
  activeToasts = activeToasts.filter(t=>t.id!==id);
  
  // animate out and remove from DOM
  if (el && el.parentElement){
    el.style.opacity='0';
    el.style.transform='translateY(-4px)';
    setTimeout(()=>{
      el.remove();
      processToastQueue(); // show next toast if any
    },180);
  } else {
    processToastQueue();
  }
}

// checks if the user is logged in, redirects to login page if not
function ensureAuth() {
  if (!userId) {
    window.location.href = '../html/login-page.html';
  }
}

// renders the sidebar navigation with all categories and items
function renderSidebar() {
  // use document fragments for better performance (minimizes reflows)
  const fragment = document.createDocumentFragment();
  const fragmentMobile = document.createDocumentFragment();
  
  CATEGORY_GROUPS.forEach(group => {
    // Desktop group
    const li = document.createElement('li');
    const innerUl = document.createElement('ul');
    innerUl.className = '-mx-2 space-y-1';
    
    // create the collapsible header button for the group
    const headerBtn = document.createElement('button');
    headerBtn.type='button';
    headerBtn.className='group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white items-center justify-between';
    headerBtn.innerHTML = `<span>${group.label}</span><svg class="size-4 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>`;
    
    const itemsWrap = document.createElement('div');
    itemsWrap.className='hidden pl-2';

    // add all items in this group
    group.items.forEach(item=>{
      const a = document.createElement('a');
      a.type='button';
      a.className='w-full text-left flex gap-x-3 rounded-md p-2 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white';
      a.textContent=item.label;
      a.dataset.itemId=item.id;
      a.id = `nav-item-${item.id}`;
      itemsWrap.appendChild(a);
    });

    // toggle the group open/closed when header is clicked
    headerBtn.addEventListener('click',()=>{
      // determine current state
      const wasOpen = !itemsWrap.classList.contains('hidden');
      if (wasOpen) {
        // close this one
        itemsWrap.classList.add('hidden');
        headerBtn.classList.remove('bg-gray-800','text-white');
      } else {
        // close any other open groups in the sidebar
        if (navGroupsUl) {
          const otherHeaders = navGroupsUl.querySelectorAll('button.group');
          otherHeaders.forEach(h => {
            if (h === headerBtn) return;
            h.classList.remove('bg-gray-800','text-white');
            const sib = h.nextElementSibling;
            if (sib && sib.classList) sib.classList.add('hidden');
          });
        }
        // open this one
        itemsWrap.classList.remove('hidden');
        headerBtn.classList.add('bg-gray-800','text-white');
        selectGroup(group.id, group.label);
      }
    });

    innerUl.appendChild(headerBtn);
    innerUl.appendChild(itemsWrap);
    li.appendChild(innerUl);
    fragment.appendChild(li);

    // Mobile clone (same structure but for mobile drawer)
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
        aM.id = `nav-item-mobile-${item.id}`;
        itemsWrapM.appendChild(aM);
      });
      headerBtnM.addEventListener('click',()=>{
        const wasOpenM = !itemsWrapM.classList.contains('hidden');
        if (wasOpenM) {
          itemsWrapM.classList.add('hidden');
          headerBtnM.classList.remove('bg-gray-800','text-white');
        } else {
          // close other mobile groups
          if (navGroupsMobile) {
            const otherHeadersM = navGroupsMobile.querySelectorAll('button.group');
            otherHeadersM.forEach(h=>{
              if (h === headerBtnM) return;
              h.classList.remove('bg-gray-800','text-white');
              const sib = h.nextElementSibling;
              if (sib && sib.classList) sib.classList.add('hidden');
            });
          }
          itemsWrapM.classList.remove('hidden');
          headerBtnM.classList.add('bg-gray-800','text-white');
          selectGroup(group.id, group.label);
        }
      });
      innerUlM.appendChild(headerBtnM);
      innerUlM.appendChild(itemsWrapM);
      liM.appendChild(innerUlM);
      fragmentMobile.appendChild(liM);
    }
  });
  
  // add to DOM in one operation (better performance)
  navGroupsUl.insertBefore(fragment, navGroupsUl.firstChild);
  if (navGroupsMobile) navGroupsMobile.appendChild(fragmentMobile);
}

// Mobile drawer controls - toggles the hamburger menu on mobile devices
function toggleMobileDrawer(open){
  if (!mobileDrawer) return;
  
  if (open){
    // show drawer and prevent body scrolling
    mobileDrawer.classList.remove('hidden');
    document.body.style.overflow='hidden';
  } else {
    // hide drawer and restore body scrolling
    mobileDrawer.classList.add('hidden');
    document.body.style.overflow='';
  }
}

// hook up mobile drawer controls
if (openMobileNavBtn){ openMobileNavBtn.addEventListener('click', ()=>toggleMobileDrawer(true)); }
if (closeMobileNavBackdrop){ closeMobileNavBackdrop.addEventListener('click', ()=>toggleMobileDrawer(false)); }
if (closeMobileNavBtn){ closeMobileNavBtn.addEventListener('click', ()=>toggleMobileDrawer(false)); }

// loads and displays statistics for all categories (how many items uploaded vs total)
async function loadStats() {
  // simple placeholder aggregated counts
  const started = performance.now();

  // fetch all uploads for this student
  const { data, error } = await db.fetchStudentUploads1(userId);
  if (error) return;
  
  // for each category group, count how many items have uploads
  const stats = CATEGORY_GROUPS.map(g=>{
    let total=0; let uploaded=0;
    g.items.forEach(i=>{
      total++;
      const arr = data[i.id];
      if (Array.isArray(arr) && arr.length>0) {
        uploaded++;
      }
      else if (Number.isFinite(arr)) {
        uploaded++;
      }
      else if (typeof arr === 'string' && arr.trim() !== '') {
        uploaded++;
      }
    });
    return { id:g.id, label:g.label, uploaded, total };
  });
  
  // ensure skeleton shows for at least 800ms for smoother perception
  const MIN_SKELETON_MS = 800;
  const elapsed = started - statsSkeletonShownAt;
  if (elapsed < MIN_SKELETON_MS){
    await new Promise(r=>setTimeout(r, MIN_SKELETON_MS - elapsed));
  }
  
  // clear skeleton and render actual stat cards
  statsGrid.innerHTML = '';
  stats.forEach(s=>{
    const pct = Math.round((s.uploaded/s.total)*100);
    const card = document.createElement('div');
    card.className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col';
    card.innerHTML=`<div class="flex items-center justify-between mb-2"><p class="text-xs font-medium text-gray-500 uppercase tracking-wide">${s.label}</p><span class="text-[10px] font-medium px-2 py-0.5 rounded-full ${pct===100?'bg-green-100 text-green-700':'bg-indigo-100 text-indigo-700'}">${pct}%</span></div><div class="flex-1 flex items-end"><p class="text-2xl font-semibold text-gray-800">${s.uploaded}<span class="text-sm text-gray-400 font-normal">/${s.total}</span></p></div><div class="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div class="h-full rounded-full ${pct===100?'bg-green-500':'bg-indigo-500'}" style="width:${pct}%;"></div></div>`;
    statsGrid.appendChild(card);
  });
}

async function getQuantityUploadModal(id, label) {

  const root = document.createElement('div');
  root.className = 'flex flex-col gap-4 border-2 border-indigo-300 rounded-2xl p-4 my-6';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'mb-3';
  const h2 = document.createElement('h2');
  h2.className = 'text-lg font-semibold text-gray-900';
  h2.textContent = label || 'Add Upload';
  titleWrap.appendChild(h2);
  root.appendChild(titleWrap);

  const quantityWrap = document.createElement('div');
  quantityWrap.id = `quantity-upload-wrapper`;
  quantityWrap.className = 'flex items-center gap-2 justify-center w-full';
  quantityWrap.innerHTML = `
      <input type="number" id="quantity-input-${id}" placeholder="Enter ${FIELD_CONFIG[id].quantity || 'quantity'}..." class="w-full max-w-xl rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
      <button id="quantity-submit" class="inline-flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow">Submit</button>`;
  root.appendChild(quantityWrap);

  const quantityInput = quantityWrap.querySelector(`#quantity-input-${id}`); 
  const quantitySubmit = quantityWrap.querySelector('#quantity-submit');

  quantitySubmit.addEventListener('click', async ()=>{
    if (!id) return;

    // get the quantity from input
    const quantityValue = quantityInput.value.trim();
    if (!quantityValue){
      notify('Enter valid quantity','warn');
      return;
    }

    await db.updateSpecificStudentUploads1(userId, id, quantityValue);

    notify('Quantity saved','success');
    await renderQuantities(id);
    await loadStats();

  });

  return root;
}

async function getTextUploadModal(id, label) {

  const root = document.createElement('div');
  root.className = 'flex flex-col gap-4 border-2 border-indigo-300 rounded-2xl p-4 my-6';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'mb-3';
  const h2 = document.createElement('h2');
  h2.className = 'text-lg font-semibold text-gray-900';
  h2.textContent = label || 'Add Upload';
  titleWrap.appendChild(h2);
  root.appendChild(titleWrap);

  const textWrap = document.createElement('div');
  textWrap.id = `text-upload-wrapper`;
  textWrap.className = 'flex items-center gap-2 justify-center w-full';
  textWrap.innerHTML = `
      <input type="text" id="text-input-${id}" placeholder="Enter text..." class="w-full max-w-xl rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
      <button id="text-submit" class="inline-flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow">Submit</button>`;
  root.appendChild(textWrap);

  const textInput = textWrap.querySelector(`#text-input-${id}`); 
  const textSubmit = textWrap.querySelector('#text-submit');

  textSubmit.addEventListener('click', async ()=>{
    if (!id) return;

    // get the text from input
    const textValue = textInput.value.trim();
    if (!textValue){
      notify('Enter text','warn');
      return;
    }

    await db.updateSpecificStudentUploads1(userId, id, textValue);

    notify('Text saved','success');
    await renderTexts(id);
    await loadStats();

  });

  return root;
}
async function getTypeUploadModal(id, label) {

  const root = document.createElement('div');
  root.className = 'flex flex-col gap-4 border-2 border-indigo-300 rounded-2xl p-4 my-6';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'mb-3';
  const h2 = document.createElement('h2');
  h2.className = 'text-lg font-semibold text-gray-900';
  h2.textContent = label || 'Add Upload';
  titleWrap.appendChild(h2);
  root.appendChild(titleWrap);

  const typeWrap = document.createElement('div');
  typeWrap.id = 'type-wrapper';
  typeWrap.className = 'flex items-center gap-2 justify-center w-full';
  typeWrap.innerHTML = `
      <label class="block text-xs font-bold text-gray-700 mb-1" id="type-label">Select Type</label>
      <select id="type-select-${id}" class="w-full max-w-xl rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"></select>
      <button id="type-submit" class="inline-flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow">Submit</button>`;
  root.appendChild(typeWrap);

  const typeSelect = typeWrap.querySelector(`#type-select-${id}`);
  const typeSubmit = typeWrap.querySelector('#type-submit');

  const options = FIELD_CONFIG[id].options;
  for (const option of options) {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    typeSelect.appendChild(opt);
  }

  typeSubmit.addEventListener('click', async ()=>{
    if (!id) return;

    // get the type from select
    const typeValue = typeSelect.value;
    if (!typeValue){
      notify('Select type','warn');
      return;
    }

    await db.updateSpecificStudentUploads1(userId, id, typeValue);

    notify('Type saved','success');
    await renderTypes(id);
    await loadStats();

  });

  return root;
}

async function getDateUploadModal(id, label) {

  const root = document.createElement('div');
  root.className = 'flex flex-col gap-4 border-2 border-indigo-300 rounded-2xl p-4 my-6';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'mb-3';
  const h2 = document.createElement('h2');
  h2.className = 'text-lg font-semibold text-gray-900';
  h2.textContent = label || 'Add Upload';
  titleWrap.appendChild(h2);
  root.appendChild(titleWrap);

  const dateWrap = document.createElement('div');
  dateWrap.id = 'date-upload-wrapper';
  dateWrap.className = 'flex items-center gap-2 justify-center w-full';
  dateWrap.innerHTML = `
      <input type="date" id="date-input-${id}" class="w-full max-w-xl rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
      <button id="date-submit" class="inline-flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow">Submit</button>`;
  root.appendChild(dateWrap);

  const dateInput = dateWrap.querySelector(`#date-input-${id}`); 
  const dateSubmit = dateWrap.querySelector('#date-submit');

  dateSubmit.addEventListener('click', async ()=>{
    if (!id) return;
    
    // get the date from input
    const dateValue = dateInput.value;
    if (!dateValue){
      notify('Select date','warn');
      return;
    }

    await db.updateSpecificStudentUploads1(userId, id, dateValue);

    notify('Date saved','success');
    await renderDates(id);
    await loadStats();
  });

  return root;
}

async function getTypeAndLinkUploadModal(id, label) {

  const root = document.createElement('div');
  root.className = 'flex flex-col gap-4 border-2 border-indigo-300 rounded-2xl p-4 my-6';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'mb-3';
  const h2 = document.createElement('h2');
  h2.className = 'text-lg font-semibold text-gray-900';
  h2.textContent = label || 'Add Upload';
  titleWrap.appendChild(h2);
  root.appendChild(titleWrap);

  const typeWrap = document.createElement('div');
  typeWrap.id = 'type-wrapper';
  typeWrap.className = 'flex items-center gap-2 justify-center w-full';
  typeWrap.innerHTML = `
      <label class="block text-xs font-bold text-gray-700 mb-1" id="type-label">Select Type</label>
      <select id="type-select" class="w-full max-w-xl rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"></select>`;
  root.appendChild(typeWrap);

  const typeSelect = typeWrap.querySelector('#type-select');

  const options = FIELD_CONFIG[id].options;
  for (const option of options) {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    typeSelect.appendChild(opt);
  }

  const linkWrap = document.createElement('div');
  linkWrap.id = 'link-upload-wrapper';
  linkWrap.className = 'flex items-center gap-2 justify-center w-full';
  linkWrap.innerHTML = ` 
      <input type="url" id="link-input" placeholder="https://..." class="w-full max-w-xl rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
      <button id="link-submit" class="inline-flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow">Submit</button>`;
  root.appendChild(linkWrap);

  const linkSubmit = linkWrap.querySelector('#link-submit');
  const linkInput = linkWrap.querySelector('#link-input');

  const uploadPreview = document.createElement('div');
  uploadPreview.id = `upload-preview-${id}`;
  uploadPreview.className = 'grid gap-3';
  root.appendChild(uploadPreview);

  linkSubmit.addEventListener('click', async ()=>{
    if (!id) return;
    
    if (!typeSelect.value){
      notify('Select type','warn');
      return;
    }

    // get the URL from input
    const link = linkInput.value.trim();
    if (!link){
      notify('Enter link','warn');
      return;
    }

    // fetch existing URLs for this item
    const { data: rowData, error } = await db.fetchSpecificStudentUploads1(userId, id);
    
    if (error) {
      notify('Fetch failed','error');
      return;
    }
    
    let existing = rowData[id] || [];
    
    // check if this exact URL was already added
    if (existing.includes(link)){
      notify('Already added','warn');
      return;
    }
    
    // add new URL to array
    existing.push(link);
    
    // update database with new URL
    await db.updateSpecificStudentUploads1(userId, id, existing);

    // create descriptive link name from modal inputs
    const linkName = `${existing.length}. ${id} ${typeSelect.value}`.trim();
    
    // store link name in separate table
    await db.createNewLinkName(linkName, link, userId, id);

    // show success and refresh UI
    notify('Link saved','success');
    linkInput.value=''; // clear input
    await renderUploads(id);
    await loadStats();
  });

  return root;

}

async function getLinkUploadModal(id, label) {

  const root = document.createElement('div');
  root.className = 'flex flex-col gap-4 border-2 border-indigo-300 rounded-2xl p-4 my-6';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'mb-3';
  const h2 = document.createElement('h2');
  h2.className = 'text-lg font-semibold text-gray-900';
  h2.textContent = label || 'Add Link';
  titleWrap.appendChild(h2);
  root.appendChild(titleWrap);

  const linkWrap = document.createElement('div');
  linkWrap.id = 'link-upload-wrapper';
  linkWrap.className = 'flex items-center gap-2 justify-center w-full';
  linkWrap.innerHTML = ` 
      <input type="url" id="link-input" placeholder="https://..." class="w-full max-w-xl rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
      <button id="link-submit" class="inline-flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow">Submit</button>`;
  root.appendChild(linkWrap);

  const linkSubmit = linkWrap.querySelector('#link-submit');
  const linkInput = linkWrap.querySelector('#link-input');

  const uploadPreview = document.createElement('div');
  uploadPreview.id = `upload-preview-${id}`;
  uploadPreview.className = 'grid gap-3';
  root.appendChild(uploadPreview);

  // handles link URL submissions (when user chooses "link" mode)
  linkSubmit.addEventListener('click', async ()=>{
    if (!id) return;
    
    // get the URL from input
    const link = linkInput.value.trim();
    if (!link){
      notify('Enter link','warn');
      return;
    }

    // fetch existing URLs for this item
    const { data: rowData, error } = await db.fetchSpecificStudentUploads1(userId, id);
    
    if (error) {
      notify('Fetch failed','error');
      return;
    }
    
    let existing = rowData[id] || [];
    
    // check if this exact URL was already added
    if (existing.includes(link)){
      notify('Already added','warn');
      return;
    }
    
    // add new URL to array
    existing.push(link);
    
    // update database with new URL
    await db.updateSpecificStudentUploads1(userId, id, existing);

    // create descriptive link name from modal inputs
    const linkName = `${existing.length}. ${id}`.trim();
    
    // store link name in separate table
    await db.createNewLinkName(linkName, link, userId, id);

    // show success and refresh UI
    notify('Link saved','success');
    linkInput.value=''; // clear input
    await renderUploads(id);
    await loadStats();
  });

  return root

}

async function getFileUploadModal(id, label) {

  const root = document.createElement('div');
  root.className = 'flex flex-col gap-4 border-2 border-indigo-300 rounded-2xl p-4 my-6';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'mb-3';
  const h2 = document.createElement('h2');
  h2.className = 'text-lg font-semibold text-gray-900';
  h2.textContent = label || 'Add Upload';
  titleWrap.appendChild(h2);
  root.appendChild(titleWrap);

  const fileWrap = document.createElement('div');
  fileWrap.id = 'file-upload-wrapper';
  fileWrap.className = 'w-full mx-auto';
  fileWrap.innerHTML = ` 
            <label for="file-input" class="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-xl border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium cursor-pointer transition">
              <span>Upload Files</span>
            </label>
            <input id="file-input" type="file" class="hidden" />`;
  root.appendChild(fileWrap);

  const uploadPreview = document.createElement('div');
  uploadPreview.id = `upload-preview-${id}`;
  uploadPreview.className = 'grid gap-3';
  root.appendChild(uploadPreview);

  const fileInput = root.querySelector('#file-input');
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // fetch existing uploads for this item
    const { data: rowData, error } = await db.fetchSpecificStudentUploads1(userId, id);
    if (error) {
      notify('Fetch failed', 'error');
      return;
    }

    let existing = rowData[id] || null;

    // sanitize file name
    const sanitizedFileName = file.name.replace(/\s+/g, '_').toLowerCase();


    // create unique filename with timestamp
    const path = `${Date.now()}-${sanitizedFileName}`;

    // upload file to Supabase storage
    const upErr = await db.uploadFileToStorage(path, file);
    console.log('Upload error:', upErr);
    if (upErr) {
      notify('Upload failed', 'error');
      return;
    }

    // get public URL
    const pub = await db.fetchPublicUrlFromStorage(path);
    const newUrl = pub.publicUrl;

    // combine URLs and update DB
    const updated = newUrl;
    if (existing) {
      await db.deleteSpecificLinkName(existing, userId, id);
    }
    await db.updateSpecificStudentUploads1(userId, id, updated);

    // construct link name using modal inputs
    const linkName = `${id}`.trim();

    // insert link name into DB
    await db.createNewLinkName(linkName, newUrl, userId, id);

    // success feedback + refresh UI
    notify('Uploaded', 'success');
    await renderUploads(id);
    await loadStats();
  });

  return root;

}

// called when a student selects an item from the sidebar
async function selectGroup(id, label){
  
  currentSectionPill.textContent = label;
  formDiv.innerHTML = ''; // clear existing form content

  let ourGroup = null;
  for (let g of CATEGORY_GROUPS){
    if (g.id === id){
      ourGroup = g;
      break;
    }
  }

  for (let item of ourGroup.items){
    let fieldOption = FIELD_CONFIG[item.id] || {};
    if (fieldOption.input === 'file'){
      const modalContent = await getFileUploadModal(item.id, item.label);
      const navItem = document.getElementById(`nav-item-${item.id}`);
      const navItemMobile = document.getElementById(`nav-item-mobile-${item.id}`);
      navItem.href = `#upload-preview-${item.id}`;
      navItemMobile.href = `#upload-preview-${item.id}`;
      formDiv.appendChild(modalContent);
      renderUploads(item.id);
    }
    else if (fieldOption.input === 'link') {
      const modalContent = await getLinkUploadModal(item.id, item.label);
      const navItem = document.getElementById(`nav-item-${item.id}`);
      const navItemMobile = document.getElementById(`nav-item-mobile-${item.id}`);
      navItem.href = `#upload-preview-${item.id}`;
      navItemMobile.href = `#upload-preview-${item.id}`;
      formDiv.appendChild(modalContent);
      renderUploads(item.id);
    }
    else if (fieldOption.input === 'type-and-link') {
      const modalContent = await getTypeAndLinkUploadModal(item.id, item.label);
      const navItem = document.getElementById(`nav-item-${item.id}`);
      const navItemMobile = document.getElementById(`nav-item-mobile-${item.id}`);
      navItem.href = `#upload-preview-${item.id}`;
      navItemMobile.href = `#upload-preview-${item.id}`;
      formDiv.appendChild(modalContent);
      renderUploads(item.id);
    }
    else if (fieldOption.input === 'date') {
      const modalContent = await getDateUploadModal(item.id, item.label);
      const navItem = document.getElementById(`nav-item-${item.id}`);
      const navItemMobile = document.getElementById(`nav-item-mobile-${item.id}`);
      navItem.href = `#date-input-${item.id}`;
      navItemMobile.href = `#date-input-${item.id}`;
      formDiv.appendChild(modalContent);
      renderDates(item.id);
    }
    else if (fieldOption.input === 'type') {
      const modalContent = await getTypeUploadModal(item.id, item.label);
      const navItem = document.getElementById(`nav-item-${item.id}`);
      const navItemMobile = document.getElementById(`nav-item-mobile-${item.id}`);
      navItem.href = `#type-select-${item.id}`;
      navItemMobile.href = `#type-select-${item.id}`;
      formDiv.appendChild(modalContent);
      renderTypes(item.id);
    }
    else if (fieldOption.input === 'text') {
      const modalContent = await getTextUploadModal(item.id, item.label);
      const navItem = document.getElementById(`nav-item-${item.id}`);
      const navItemMobile = document.getElementById(`nav-item-mobile-${item.id}`);
      navItem.href = `#text-input-${item.id}`;
      navItemMobile.href = `#text-input-${item.id}`;
      formDiv.appendChild(modalContent);
      renderTexts(item.id);
    }
    else if (fieldOption.input === 'quantity') {
      const modalContent = await getQuantityUploadModal(item.id, item.label);
      const navItem = document.getElementById(`nav-item-${item.id}`);
      const navItemMobile = document.getElementById(`nav-item-mobile-${item.id}`);
      navItem.href = `#quantity-input-${item.id}`;
      navItemMobile.href = `#quantity-input-${item.id}`;
      formDiv.appendChild(modalContent);
      renderQuantities(item.id);
    }
  }
}

async function renderQuantities(id) {

  const quantityInput = document.getElementById(`quantity-input-${id}`);

  const { data, error } = await db.fetchSpecificStudentUploads1(userId, id);
  if (error) {
    quantityInput.value = '';
    return;
  }
  quantityInput.value = data[id];

}

async function renderTexts(id) {

  const textInput = document.getElementById(`text-input-${id}`);

  const { data, error } = await db.fetchSpecificStudentUploads1(userId, id);
  if (error) {
    textInput.value = '';
    return;
  }
  textInput.value = data[id] || '';

}

async function renderTypes(id) {

  const typeSelect = document.getElementById(`type-select-${id}`);

  const { data, error } = await db.fetchSpecificStudentUploads1(userId, id);
  if (error) {
    typeSelect.value = '';
    return;
  }
  typeSelect.value = data[id] || '';

}

async function renderDates(id) {

  const dateInput = document.getElementById(`date-input-${id}`);

  const { data, error } = await db.fetchSpecificStudentUploads1(userId, id);
  if (error) {
    dateInput.value = '';
    return;
  }
  dateInput.value = data[id] || '';

}

async function renderUploads(id) {

  const uploadPreview = document.getElementById(`upload-preview-${id}`);
  uploadPreview.innerHTML = '<p class="text-xs text-gray-500">Loading...</p>';

  const { data, error } = await db.fetchSpecificStudentUploads1(userId, id);

  if (error) {
    uploadPreview.innerHTML = '<p class="text-xs text-red-500">Failed to load.</p>';
    return;
  }

  const urls = data[id];

  // check if urls is array or single string
  let urlArray = [];
  if (Array.isArray(urls)) {
    urlArray = urls;
  } else if (typeof urls === 'string' && urls.length > 0) {
    urlArray = [urls];
  }

  if (!urlArray || urlArray.length === 0) {
    uploadPreview.innerHTML = '<p class="text-sm text-gray-500">No uploads yet.</p>';
    return;
  }

  uploadPreview.innerHTML = '';

  for (let i = 0; i < urlArray.length; i++) {
    const url = urlArray[i];
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 text-sm';

    const link = document.createElement('a');
    link.href = url; link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'text-indigo-600 font-medium truncate max-w-[60vw] sm:max-w-xs';

    let display = `Item ${i + 1}`;
    const linkNameData = await db.fetchSpecificLinkName(url, userId, id);
    if (linkNameData?.name) display = linkNameData.name;
    link.textContent = display;

    const delBtn = document.createElement('button');
    delBtn.className = 'text-xs text-red-600 hover:text-red-700 font-medium';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => handleDelete(url, id));

    row.appendChild(link);
    row.appendChild(delBtn);
    uploadPreview.appendChild(row);
  }

}

// handles deleting a single upload/link
async function handleDelete(url, id){
  // first delete the custom link name if one exists
  await db.deleteSpecificLinkName(url, userId, id);

  // fetch current list of URLs
  const { data: rowData, error } = await db.fetchSpecificStudentUploads1(userId, id);
  
  if (error) {
    notify('Delete failed','error');
    return;
  }
  
  // filter out the deleted URL
  let updated = null;
  if (Array.isArray(rowData[id])){
    const existing = rowData[id] || [];
    updated = existing.filter(l=>l!==url);
  } else {
    updated = null;
  }
  
  // update the database with the new array
  await db.updateSpecificStudentUploads1(userId, id, updated);
  
  // show success and refresh the UI
  notify('Deleted');
  await renderUploads(id);
  await loadStats(); // update the stats cards
}

// logout button handlers for both desktop and mobile views
// clears all session data and redirects to login page
logoutBtn.addEventListener('click', ()=>{
  localStorage.clear();
  window.location.href='../html/login-page.html';
});

if (logoutBtnMobile){
  logoutBtnMobile.addEventListener('click', ()=>{
    localStorage.clear();
    window.location.href='../html/login-page.html';
  });
}

// "go to profile" button redirects to profile setup page
document.getElementById('goto-profile').addEventListener('click',()=>{
  window.location.href='../html/profile-setup.html';
});

function scrollElementToCenter(id, options = { behavior: 'smooth' }) {
  const el = document.getElementById(id);
  if (!el) return;
  // detect fixed header height (adjust selector if header is different)
  const header = document.querySelector('header');
  const headerH = header ? header.offsetHeight : 0;

  const rect = el.getBoundingClientRect();
  const absoluteTop = window.pageYOffset + rect.top;
  // compute top so element's center lands at viewport center
  const targetScrollTop = Math.max(0,
    Math.floor(absoluteTop - (window.innerHeight / 2) + (rect.height / 2) - Math.round(headerH / 2))
  );

  window.scrollTo({ top: targetScrollTop, behavior: options.behavior || 'auto' });
}

// delegate clicks for anchor links
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const hash = a.getAttribute('href') || '';
  if (!hash.startsWith('#')) return;
  const id = hash.slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  scrollElementToCenter(id, { behavior: 'smooth' });
});

// initialization function - runs when page loads
async function init(){
  // verify user is logged in (redirects if not)
  ensureAuth();

  await db.initializeUserRowInNecessaryTables(userId);
  
  // populate header with user info from localStorage
  userNameEl.textContent = userName || 'User';
  userEmailEl.textContent = userEmail || '';
  if (userPicture) profileImage.src = userPicture;
  
  // build the sidebar with all category groups and items
  renderSidebar();
  
  // show the main app (was hidden during load)
  appRoot.classList.remove('hidden');
  
  // Note: Uploads row is already created during signup in profile-setup.js
  // so we don't need to create it here
  
  // automatically select the first item in the first category
  const firstGroup = CATEGORY_GROUPS[0];
  
  // record when we started showing skeleton loaders
  statsSkeletonShownAt = performance.now();
  
  // load that item's uploads and stats
  await selectGroup(firstGroup.id, firstGroup.label);
  await loadStats();
}

// start the app
init();