// Vanilla JS To-Do / Kanban App (migrated from React implementation)
// Features: tasks CRUD, per-status columns, sorting, filtering by status & tags, priorities, tags mgmt, statistics, theme toggle, localStorage persistence.

// ========================= State Handling =========================
const storage = {
  async get(key, fallback) {
    try {
      const response = await fetch(`/api/storage/${key}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.text();
      if (data === 'null') {
        return fallback;
      }
      return JSON.parse(data) ?? fallback;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return fallback;
    }
  },
  async set(key, value) {
    try {
      const response = await fetch(`/api/storage/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to set ${key}:`, error);
    }
  }
};

let state = {
  tasks: [],
  tags: ['Work', 'Personal'],
  priorities: ['Low', 'Medium', 'High'],
  theme: 'light',
  view: 'dashboard',
  sortBy: 'deadline',
  filterByStatus: '',
  filterByTags: []
};

async function initializeState() {
  // Load initial state from Cloudflare KV
  const [tasks, tags, priorities, theme, filterByTags] = await Promise.all([
    storage.get('tasks', []),
    storage.get('tags', ['Work', 'Personal']),
    storage.get('priorities', ['Low', 'Medium', 'High']),
    storage.get('theme', 'light'),
    storage.get('filterByTags', [])
  ]);
  
  state = {
    ...state,
    tasks,
    tags,
    priorities,
    theme,
    filterByTags
  };
  
  render();
}

function setState(patch) {
  state = { ...state, ...patch };
  // Persist changed top-level keys asynchronously
  ['tasks','tags','priorities','theme','filterByTags'].forEach(k => {
    if (k in patch) {
      storage.set(k, state[k]).catch(err => console.error(`Failed to persist ${k}:`, err));
    }
  });
  render();
}

// ========================= Utilities =========================
const qs = sel => document.querySelector(sel);
const ce = (tag, props={}) => Object.assign(document.createElement(tag), props);
const nowDateString = () => { const n=new Date(); return [n.getFullYear(),String(n.getMonth()+1).padStart(2,'0'),String(n.getDate()).padStart(2,'0')].join('-'); };

function validate(formData) {
  const errors = {};
  const title = formData.get('title')?.trim();
  if (!title) errors.title = 'Title is required'; else if (title.length < 3) errors.title = 'Title must be at least 3 characters long'; else if (title.length > 100) errors.title = 'Title must be less than 100 characters';
  const description = formData.get('description')?.trim();
  if (description && description.length > 500) errors.description = 'Description must be less than 500 characters';
  const priority = formData.get('priority');
  const validPriorities = state.priorities.map(p => p.toLowerCase());
  if (!priority || !validPriorities.includes(priority.toLowerCase())) errors.priority = 'Please select a valid priority';
  const dueDate = formData.get('dueDate');
  if (dueDate) {
    const d = new Date(dueDate + 'T00:00:00'); const today = new Date(); today.setHours(0,0,0,0); if (d < today) errors.dueDate = 'Due date cannot be in the past';
  }
  const tagsString = formData.get('tags')?.trim();
  if (tagsString) {
    const tagList = tagsString.split(',').map(t=>t.trim()).filter(Boolean);
    if (tagList.length > 10) errors.tags = 'Maximum 10 tags allowed';
    if (tagList.some(t => t.length > 20)) errors.tags = 'Each tag must be less than 20 characters';
  }
  return errors;
}

function showErrors(errors) {
  ['title','description','priority','dueDate','tags'].forEach(field => {
    const span = document.querySelector(`.error-message[data-error-for="${field}"]`);
    if (!span) return;
    if (errors[field]) { span.textContent = errors[field]; span.hidden = false; } else { span.hidden = true; span.textContent=''; }
  });
}

// ========================= Rendering Root Views =========================
function render() {
  document.body.classList.toggle('dark', state.theme === 'dark');
  document.body.classList.toggle('light', state.theme === 'light');
  const main = qs('#main');
  main.innerHTML = '';
  if (state.view === 'dashboard') main.appendChild(renderDashboard());
  else if (state.view === 'statistics') main.appendChild(renderStatistics());
  else if (state.view === 'settings') main.appendChild(renderSettings());
  updatePrioritySelect();
  updateThemeToggle();
  updateSidebar();
}

// ------------------------- Dashboard -------------------------
function filteredAndSortedTasks() {
  let list = [...state.tasks];
  if (state.filterByStatus) list = list.filter(t => t.status === state.filterByStatus);
  if (state.filterByTags.length) list = list.filter(t => state.filterByTags.some(tag => t.tags.includes(tag)));
  list.sort((a,b) => {
    if (state.sortBy === 'deadline') return new Date(a.deadline||'2999-12-31') - new Date(b.deadline||'2999-12-31');
    if (state.sortBy === 'priority') {
      const order = state.priorities.reduce((acc,p,i)=>{acc[p]=i;return acc;},{}); return order[a.priority]-order[b.priority];
    }
    if (state.sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });
  return list;
}

function renderDashboard() {
  const container = ce('div', { className: 'dashboard-view' });
  // Filters
  const filtersDiv = ce('div', { className: 'filters' });
  const sortSelect = ce('select');
  sortSelect.innerHTML = '<option value="deadline">Sort by Deadline</option><option value="priority">Sort by Priority</option><option value="title">Sort by Title</option>';
  sortSelect.value = state.sortBy; sortSelect.onchange = e => setState({ sortBy: e.target.value });
  const statusSelect = ce('select');
  statusSelect.innerHTML = '<option value="">All Statuses</option><option value="To-Do">To-Do</option><option value="In Progress">In Progress</option><option value="Done">Done</option>';
  statusSelect.value = state.filterByStatus; statusSelect.onchange = e => setState({ filterByStatus: e.target.value });
  const tagFilters = ce('div', { className: 'tag-filters' });
  const label = ce('span', { className: 'filter-label', textContent: 'Filter by Tags:' });
  const options = ce('div', { className: 'tag-filter-options' });
  state.tags.forEach(tag => {
    const btn = ce('button', { className: 'tag-filter-btn' + (state.filterByTags.includes(tag)?' active':'') , textContent: tag });
    btn.onclick = () => {
      const exists = state.filterByTags.includes(tag);
      setState({ filterByTags: exists ? state.filterByTags.filter(t=>t!==tag) : [...state.filterByTags, tag] });
    };
    options.appendChild(btn);
  });
  if (state.filterByTags.length) {
    const clearBtn = ce('button', { className: 'clear-tags-btn', textContent: 'Clear All' });
    clearBtn.onclick = () => setState({ filterByTags: [] });
    options.appendChild(clearBtn);
  }
  tagFilters.append(label, options);
  filtersDiv.append(sortSelect, statusSelect, tagFilters);
  container.appendChild(filtersDiv);

  // Board columns
  const board = ce('div', { className: 'task-board' });
  ['To-Do','In Progress','Done'].forEach(status => {
    const column = ce('div', { className: 'task-column' });
    const header = ce('h2');
    const tasksForStatus = filteredAndSortedTasks().filter(t => t.status === status);
    header.textContent = status + ' ';
    const count = ce('span', { className: 'task-count', textContent: '(' + tasksForStatus.length + ')' });
    header.appendChild(count);
    column.appendChild(header);
    const listDiv = ce('div', { className: 'task-list' });
    tasksForStatus.forEach(task => listDiv.appendChild(renderTaskItem(task)));
    column.appendChild(listDiv);
    board.appendChild(column);
  });
  container.appendChild(board);
  return container;
}

function renderTaskItem(task) {
  const item = ce('div', { className: 'task-item expanded' });
  const header = ce('div', { className: 'task-header' });
  const title = ce('h3', { textContent: task.title });
  const toggleBtn = ce('button', { className: 'collapse-btn', innerHTML: '&#9662;' });
  let expanded = true;
  toggleBtn.onclick = () => { expanded = !expanded; item.classList.toggle('collapsed', !expanded); item.classList.toggle('expanded', expanded); toggleBtn.innerHTML = expanded ? '&#9662;' : '&#9656;'; };
  header.append(title, toggleBtn);
  item.appendChild(header);
  const content = ce('div', { className: 'task-content' });
  const desc = ce('p', { className: 'task-description', textContent: task.description });
  const priority = ce('p', { textContent: 'Priority: ' + task.priority });
  const deadline = ce('p', { textContent: 'Deadline: ' + (task.deadline || '') });
  const tagsDiv = ce('div', { className: 'tags' });
  task.tags.forEach(t => tagsDiv.appendChild(ce('span', { className:'tag', textContent: t })));
  const actions = ce('div', { className: 'task-actions' });
  const statusBtns = ce('div', { className: 'status-buttons' });
  ['To-Do','In Progress','Done'].forEach(s => {
    const b = ce('button', { className: 'status-btn' + (task.status === s ? ' active' : ''), textContent: s });
    b.dataset.status = s;
    b.onclick = () => {
      if (task.status !== s) updateTask(task.id, { status: s });
    };
    statusBtns.appendChild(b);
  });
  const editBtn = ce('button', { textContent: 'Edit' });
  editBtn.onclick = () => openModal(task);
  const delBtn = ce('button', { textContent: 'Delete' });
  delBtn.onclick = () => deleteTask(task.id);
  actions.append(statusBtns, editBtn, delBtn);
  content.append(desc, priority, deadline, tagsDiv, actions);
  item.appendChild(content);
  return item;
}

// ------------------------- Statistics -------------------------
function renderStatistics() {
  const wrapper = ce('div', { className: 'statistics-view' });
  const all = state.tasks;
  const total = all.length;
  const done = all.filter(t=>t.status==='Done').length;
  const pct = total ? ((done/total)*100).toFixed(2) : 0;
  const summary = ce('div', { className: 'summary-card', innerHTML: `<h3>Total Tasks: ${total}</h3><h3>Completion: ${pct}%</h3>` });
  wrapper.appendChild(ce('h2', { textContent: 'Statistics' }));
  wrapper.appendChild(summary);
  // Basic bar representation (no external lib) for priorities & statuses
  const charts = ce('div', { className: 'charts' });
  charts.appendChild(simpleBarChart('Task Status', [
    { name:'To-Do', value: all.filter(t=>t.status==='To-Do').length },
    { name:'In Progress', value: all.filter(t=>t.status==='In Progress').length },
    { name:'Done', value: all.filter(t=>t.status==='Done').length }
  ]));
  charts.appendChild(simpleBarChart('Task Priority', state.priorities.map(p => ({ name: p, value: all.filter(t=>t.priority===p).length }))));
  wrapper.appendChild(charts);
  return wrapper;
}

function simpleBarChart(title, data) {
  const wrap = ce('div', { className: 'chart' });
  wrap.appendChild(ce('h3', { textContent: title }));
  const max = Math.max(1, ...data.map(d=>d.value));
  const svgNS = 'http://www.w3.org/2000/svg';
  const width = 300; const height = 180; const barW = Math.floor(width / data.length) - 10;
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  data.forEach((d,i)=>{
    const x = 10 + i*(barW+10); const barH = (d.value / max) * (height - 40); const y = height - barH - 20;
    const rect = document.createElementNS(svgNS,'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y); rect.setAttribute('width', barW); rect.setAttribute('height', barH); rect.setAttribute('fill', '#007bff');
    svg.appendChild(rect);
    const label = document.createElementNS(svgNS,'text');
    label.setAttribute('x', x + barW/2); label.setAttribute('y', height - 5); label.setAttribute('text-anchor','middle'); label.setAttribute('font-size','10'); label.textContent = d.name; svg.appendChild(label);
    const val = document.createElementNS(svgNS,'text');
    val.setAttribute('x', x + barW/2); val.setAttribute('y', y - 4); val.setAttribute('text-anchor','middle'); val.setAttribute('font-size','10'); val.textContent = d.value; svg.appendChild(val);
  });
  wrap.appendChild(svg);
  return wrap;
}

// ------------------------- Settings -------------------------
function renderSettings() {
  const wrap = ce('div', { className: 'settings-view' });
  wrap.appendChild(ce('h2', { textContent: 'Settings' }));

  // Tags section
  wrap.appendChild(manageListSection('Manage Tags', state.tags, newTag => {
    if (newTag && !state.tags.includes(newTag)) setState({ tags: [...state.tags, newTag] });
  }, tagToDelete => setState({ tags: state.tags.filter(t=>t!==tagToDelete) }))); 

  // Priorities section
  wrap.appendChild(manageListSection('Manage Priorities', state.priorities, newP => {
    if (newP && !state.priorities.includes(newP)) setState({ priorities: [...state.priorities, newP] });
  }, pToDelete => {
    if (state.priorities.length > 1) setState({ priorities: state.priorities.filter(p=>p!==pToDelete) });
  }, true));

  return wrap;
}

function manageListSection(title, items, onAdd, onDelete, protectSingle=false) {
  const section = ce('div', { className: 'settings-section' });
  section.appendChild(ce('h3', { textContent: title }));
  const form = ce('div', { className: 'add-item-form' });
  const input = ce('input', { type:'text', placeholder: 'New item' });
  const btn = ce('button', { className: 'add-btn', innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>' });
  btn.onclick = () => { const v=input.value.trim(); if (v) { onAdd(v); input.value=''; } }; 
  input.addEventListener('keydown', e => { if (e.key==='Enter') { e.preventDefault(); btn.click(); } });
  form.append(input, btn);
  section.appendChild(form);
  const list = ce('div', { className: 'items-list' });
  items.forEach(it => {
    const pill = ce('div', { className: 'item-pill' });
    pill.appendChild(ce('span', { textContent: it }));
    if (!(protectSingle && items.length <= 1)) {
      const del = ce('button', { className: 'delete-btn', textContent: '×' });
      del.onclick = () => onDelete(it);
      pill.appendChild(del);
    }
    list.appendChild(pill);
  });
  section.appendChild(list);
  return section;
}

// ========================= Tasks CRUD =========================
function addTask(task) { setState({ tasks: [...state.tasks, task] }); }
function updateTask(id, patch) { setState({ tasks: state.tasks.map(t => t.id===id?{...t,...patch}:t) }); }
function deleteTask(id) { setState({ tasks: state.tasks.filter(t=>t.id!==id) }); }

// ========================= Modal Logic =========================
const modal = qs('#taskModal');
const form = qs('#taskForm');
const submitBtn = qs('#submitTaskBtn');

function openModal(task=null) {
  if (!modal) return;
  form.reset();
  showErrors({});
  if (task) {
    qs('#modalTitle').textContent = 'Edit Task';
    qs('#taskId').value = task.id;
    qs('#titleInput').value = task.title;
    qs('#descriptionInput').value = task.description;
    qs('#prioritySelect').value = task.priority.toLowerCase();
    qs('#dueDateInput').value = task.deadline || nowDateString();
    qs('#tagsInput').value = task.tags.join(', ');
    submitBtn.textContent = 'Update Task';
  } else {
    qs('#modalTitle').textContent = 'Add Task';
    qs('#taskId').value = '';
    qs('#dueDateInput').value = nowDateString();
    submitBtn.textContent = 'Add Task';
  }
  modal.hidden = false;
  // Focus first input for accessibility
  const first = qs('#titleInput'); if (first) first.focus();
}

function closeModal() { if (!modal.hidden) { modal.hidden = true; } }

form.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(form);
  const errors = validate(data);
  showErrors(errors);
  if (Object.keys(errors).length) return;
  const title = data.get('title').trim();
  const description = data.get('description').trim();
  const priority = data.get('priority');
  const dueDate = data.get('dueDate');
  const tagsString = data.get('tags').trim();
  const tagList = tagsString ? tagsString.split(',').map(t=>t.trim()).filter(Boolean) : [];
  const existingId = data.get('taskId');
  if (existingId) {
    updateTask(Number(existingId), { title, description, priority: capitalize(priority), tags: tagList, deadline: dueDate || null });
  } else {
    addTask({ id: Date.now(), title, description, status: 'To-Do', priority: capitalize(priority), tags: tagList, createdAt: new Date().toISOString(), deadline: dueDate || null });
  }
  closeModal();
});

qs('#addTaskBtn').onclick = () => openModal();
qs('#closeModalBtn').onclick = closeModal;
qs('#cancelModalBtn').onclick = closeModal;
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// ========================= Theme & Navigation =========================
function updateThemeToggle() { /* icon handled via CSS pseudo-element */ }
qs('#themeToggle').onclick = () => setState({ theme: state.theme === 'light' ? 'dark' : 'light' });

function updateSidebar() {
  const sidebar = qs('#sidebar');
  [...sidebar.querySelectorAll('li')].forEach(li => {
    li.classList.toggle('active', li.dataset.view === state.view);
  });
}

qs('#sidebar').addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li) return;
  setState({ view: li.dataset.view });
  closeSidebar();
});
qs('#sidebar').addEventListener('keydown', e => { if (e.key==='Enter') { const li = e.target.closest('li'); if (li) { setState({ view: li.dataset.view }); closeSidebar(); } } });

// ========================= Mobile Sidebar =========================
const hamburger = qs('#hamburger');
const overlay = qs('#overlay');
const sidebar = qs('#sidebar');
function openSidebar(){ sidebar.classList.add('open'); overlay.hidden = false; }
function closeSidebar(){ sidebar.classList.remove('open'); overlay.hidden = true; }

hamburger.onclick = () => { sidebar.classList.contains('open') ? closeSidebar() : openSidebar(); };
overlay.onclick = closeSidebar;

// ========================= Helpers =========================
function updatePrioritySelect() {
  const sel = qs('#prioritySelect');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">Select priority</option>' + state.priorities.map(p => `<option value="${p.toLowerCase()}">${p}</option>`).join('');
  if (prev) sel.value = prev; else sel.value = 'medium';
}
function capitalize(str){ return str ? str.charAt(0).toUpperCase()+str.slice(1).toLowerCase() : str; }

// Initial adjustments
async function bootstrap(){
  try {
    document.body.classList.add(state.theme);
    const due = qs('#dueDateInput'); if (due) due.min = nowDateString();
    if (modal) modal.hidden = true;
    
    // Initialize state from Cloudflare KV and render
    await initializeState();
    
    // Reattach critical handlers (defensive if script re-run)
    const addBtn = qs('#addTaskBtn'); if (addBtn) addBtn.onclick = () => openModal();
    const themeT = qs('#themeToggle'); if (themeT) themeT.onclick = () => setState({ theme: state.theme === 'light' ? 'dark' : 'light' });
    if (sidebar) {
      sidebar.onclick = e => { const li = e.target.closest('li'); if (!li) return; setState({ view: li.dataset.view }); closeSidebar(); };
      sidebar.onkeydown = e => { if (e.key==='Enter') { const li = e.target.closest('li'); if (li) { setState({ view: li.dataset.view }); closeSidebar(); } } };
    }
    console.info('[tod] App initialized');
  } catch (err) {
    console.error('[tod] Initialization error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
