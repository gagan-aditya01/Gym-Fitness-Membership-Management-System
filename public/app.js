/**
 * TITAN FIT - Core Application Logic
 * Pure Vanilla JavaScript ES6+ with Reactive Architecture
 */

// Application State
const state = {
  token: null,
  user: null, // { _id, name, email, role }
  activeTab: 'dashboard',
};

// ============================================================================
// 1. UTILITIES & TOAST NOTIFICATIONS
// ============================================================================

function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    danger: 'fa-circle-exclamation',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation',
  };

  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${iconMap[type] || 'fa-bell'}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Global modal helpers
function openModal(title, contentHtml) {
  const overlay = document.getElementById('appModalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  modalTitle.textContent = title;
  modalBody.innerHTML = contentHtml;
  overlay.classList.add('active');
}

function closeModal() {
  const overlay = document.getElementById('appModalOverlay');
  overlay.classList.remove('active');
}

// Auth State Persistence
function setAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('jwt', token);
  localStorage.setItem('user', JSON.stringify(user));
  updateUserHeader();
}

function loadState() {
  const token = localStorage.getItem('jwt');
  const user = localStorage.getItem('user');
  if (token && user) {
    try {
      state.token = token;
      state.user = JSON.parse(user);
    } catch (e) {
      clearAuth();
    }
  }
}

function clearAuth() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
  updateUserHeader();
}

// Central API Request Wrapper
async function api(path, options = {}) {
  const url = `/api${path}`;
  const headers = options.headers || {};

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const cfg = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, cfg);
    const data = await res.json();

    if (!res.ok) {
      // 401 unauthenticated
      if (res.status === 401 && !path.startsWith('/auth')) {
        clearAuth();
        showAuthView();
        showToast('Session Expired', 'Please log in again.', 'warning');
      }
      const errMsg = data.message || 'An unexpected request error occurred.';
      throw new Error(errMsg);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// ============================================================================
// 2. NAVIGATION & TAB ROUTING
// ============================================================================

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high', roles: ['member', 'trainer', 'admin'] },
  { id: 'plans', label: 'Plans & Pricing', icon: 'fa-layer-group', roles: ['member', 'trainer', 'admin'] },
  { id: 'myMembership', label: 'My Membership', icon: 'fa-id-card', roles: ['member'] },
  { id: 'classes', label: 'Classes', icon: 'fa-calendar-days', roles: ['member', 'trainer', 'admin'] },
  { id: 'myBookings', label: 'My Bookings', icon: 'fa-bookmark', roles: ['member'] },
  { id: 'attendance', label: 'Attendance', icon: 'fa-fingerprint', roles: ['member', 'trainer', 'admin'] },
  { id: 'workoutNotes', label: 'Workout Notes', icon: 'fa-notes-medical', roles: ['member', 'trainer', 'admin'] },
  { id: 'trainers', label: 'Trainers', icon: 'fa-users', roles: ['member', 'trainer', 'admin'] },
  { id: 'reports', label: 'Admin Analytics', icon: 'fa-chart-pie', roles: ['admin'] },
];

function renderNav() {
  const container = document.getElementById('navTabsList');
  const tabWrapper = document.getElementById('navTabContainer');

  if (!state.user) {
    tabWrapper.style.display = 'none';
    return;
  }

  tabWrapper.style.display = 'block';
  container.innerHTML = '';

  const userRole = state.user.role;
  const eligibleTabs = TABS.filter(t => t.roles.includes(userRole));

  eligibleTabs.forEach(t => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${state.activeTab === t.id ? 'active' : ''}`;
    btn.innerHTML = `<i class="fa-solid ${t.icon}"></i> ${t.label}`;
    btn.onclick = () => switchTab(t.id);
    container.appendChild(btn);
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim().toLowerCase().includes(tabId.toLowerCase()));
  });

  // Hide all sections
  document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');

  // Show target section
  const targetSec = document.getElementById(`${tabId}Section`);
  if (targetSec) {
    targetSec.style.display = 'block';
  }

  // Trigger view renderer
  switch (tabId) {
    case 'dashboard': renderDashboard(); break;
    case 'plans': renderPlans(); break;
    case 'myMembership': renderMyMembership(); break;
    case 'classes': renderClasses(); break;
    case 'myBookings': renderMyBookings(); break;
    case 'attendance': renderAttendance(); break;
    case 'workoutNotes': renderWorkoutNotes(); break;
    case 'trainers': renderTrainers(); break;
    case 'reports': renderReports(); break;
  }
}

function updateUserHeader() {
  const badge = document.getElementById('userProfileBadge');
  const logoutBtn = document.getElementById('logoutBtn');
  const demoSwitcher = document.getElementById('demoSwitcher');

  if (state.user) {
    badge.style.display = 'flex';
    logoutBtn.style.display = 'inline-flex';
    document.getElementById('navUserName').textContent = state.user.name.split(' ')[0];
    document.getElementById('navUserRole').textContent = state.user.role.toUpperCase();
    document.getElementById('navAvatar').textContent = state.user.name.charAt(0).toUpperCase();

    // Update demo switcher active states
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id.toLowerCase().includes(state.user.role));
    });
  } else {
    badge.style.display = 'none';
    logoutBtn.style.display = 'none';
    document.querySelectorAll('.demo-btn').forEach(btn => btn.classList.remove('active'));
  }
}

// ============================================================================
// 3. AUTHENTICATION CONTROLLER
// ============================================================================

function showAuthView() {
  document.getElementById('navTabContainer').style.display = 'none';
  document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
  document.getElementById('authSection').style.display = 'block';
  updateUserHeader();
}

async function quickLogin(email, password) {
  try {
    showToast('Authenticating', `Logging in as ${email}...`, 'info');
    const res = await api('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setAuth(res.data.token, res.data.user);
    showToast('Welcome Back', `Authenticated as ${res.data.user.name} (${res.data.user.role})`, 'success');

    renderNav();
    switchTab('dashboard');
  } catch (err) {
    showToast('Sign In Failed', err.message, 'danger');
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await api('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    setAuth(res.data.token, res.data.user);
    showToast('Welcome Back', `Authenticated as ${res.data.user.name}`, 'success');
    renderNav();
    switchTab('dashboard');
  } catch (err) {
    showToast('Authentication Failed', err.message, 'danger');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;

  try {
    const res = await api('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    setAuth(res.data.token, res.data.user);
    showToast('Account Created', `Welcome to Titan Fit, ${res.data.user.name}!`, 'success');
    renderNav();
    switchTab('dashboard');
  } catch (err) {
    showToast('Registration Error', err.message, 'danger');
  }
}

// ============================================================================
// 4. VIEW RENDERERS
// ============================================================================

// 4.1 DASHBOARD VIEW
async function renderDashboard() {
  const container = document.getElementById('dashboardContent');
  container.innerHTML = `
    <div style="text-align:center; padding:3rem 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
      <div style="margin-top:1rem; color:var(--text-secondary);">Loading real-time fitness metrics...</div>
    </div>
  `;

  try {
    let memberData = null;
    if (state.user.role === 'member') {
      try {
        const res = await api('/dashboard/me');
        memberData = res.data;
      } catch (e) {}
    }

    // Fetch plans and upcoming classes for context
    const [plansRes, classesRes] = await Promise.all([
      api('/plans').catch(() => ({ data: [] })),
      api('/classes').catch(() => ({ data: [] })),
    ]);

    const plans = plansRes.data || [];
    const classes = classesRes.data || [];

    // Role-tailored UI
    const isMember = state.user.role === 'member';
    const isTrainer = state.user.role === 'trainer';
    const isAdmin = state.user.role === 'admin';

    const activeMembership = memberData?.activeMembership;
    const upcomingBookings = memberData?.upcomingBookings || [];
    const recentAttendance = memberData?.recentAttendance || [];

    let html = `
      <!-- Welcome Hero Banner -->
      <div class="card-glass mb-4" style="background:linear-gradient(135deg, rgba(22, 28, 42, 0.9), rgba(11, 15, 23, 0.95)); border:1px solid rgba(0,245,212,0.2); padding:2rem 2.5rem; margin-bottom:2rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.5rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
              <span class="badge ${isAdmin ? 'badge-info' : isTrainer ? 'badge-warning' : 'badge-success'}">
                <i class="fa-solid ${isAdmin ? 'fa-shield-halved' : isTrainer ? 'fa-user-ninja' : 'fa-medal'}"></i>
                ${state.user.role.toUpperCase()} PORTAL
              </span>
              <span style="font-size:0.8rem; color:var(--text-muted);"><i class="fa-regular fa-clock"></i> Today: ${new Date().toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })}</span>
            </div>
            <h1 style="font-size:2.2rem; font-weight:800; margin-bottom:0.5rem;">
              Welcome back, <span style="background:var(--accent-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${state.user.name}</span>
            </h1>
            <p style="color:var(--text-secondary); max-width:600px; font-size:0.92rem;">
              ${isAdmin ? 'Full gym oversight active. Monitor subscriptions, class occupancy, and member attendance.' :
                isTrainer ? 'Empower athletes, manage assigned group training sessions, and log progression notes.' :
                activeMembership ? `Your <strong>${activeMembership.planId?.name || 'Pro'}</strong> membership is active and in good standing.` :
                'Unlock unlimited gym floor access, cardio suites, and group classes with an active membership plan.'}
            </p>
          </div>

          <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
            ${isMember ? `
              <button class="btn btn-primary" onclick="switchTab('classes')">
                <i class="fa-solid fa-plus"></i> Book Class
              </button>
              <button class="btn btn-secondary" onclick="switchTab('attendance')">
                <i class="fa-solid fa-fingerprint"></i> Check In
              </button>
            ` : isAdmin ? `
              <button class="btn btn-primary" onclick="switchTab('reports')">
                <i class="fa-solid fa-chart-line"></i> View Reports
              </button>
              <button class="btn btn-secondary" onclick="switchTab('classes')">
                <i class="fa-solid fa-calendar-plus"></i> Schedule Class
              </button>
            ` : `
              <button class="btn btn-primary" onclick="switchTab('classes')">
                <i class="fa-solid fa-calendar-plus"></i> My Classes
              </button>
              <button class="btn btn-secondary" onclick="switchTab('workoutNotes')">
                <i class="fa-solid fa-pen-to-square"></i> Add Note
              </button>
            `}
          </div>
        </div>
      </div>

      <!-- Quick Metrics Stats Grid -->
      <div class="stats-grid">
        <div class="card-glass stat-card">
          <div class="stat-icon-wrapper" style="background:rgba(0, 245, 212, 0.12); color:var(--accent-primary);">
            <i class="fa-solid ${isMember ? 'fa-id-badge' : 'fa-layer-group'}"></i>
          </div>
          <div>
            <div class="stat-val">
              ${isMember ? (activeMembership ? 'ACTIVE' : 'NONE') : plans.length}
            </div>
            <div class="stat-label">${isMember ? 'Membership Status' : 'Available Plans'}</div>
          </div>
        </div>

        <div class="card-glass stat-card">
          <div class="stat-icon-wrapper" style="background:rgba(99, 102, 241, 0.12); color:var(--accent-secondary);">
            <i class="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <div class="stat-val">
              ${isMember ? upcomingBookings.length : classes.length}
            </div>
            <div class="stat-label">${isMember ? 'Confirmed Reservations' : 'Upcoming Classes'}</div>
          </div>
        </div>

        <div class="card-glass stat-card">
          <div class="stat-icon-wrapper" style="background:rgba(245, 158, 11, 0.12); color:var(--status-warning);">
            <i class="fa-solid fa-fire"></i>
          </div>
          <div>
            <div class="stat-val">
              ${isMember ? recentAttendance.length : '100%'}
            </div>
            <div class="stat-label">${isMember ? 'Recent Gym Visits' : 'Facility Uptime'}</div>
          </div>
        </div>

        <div class="card-glass stat-card">
          <div class="stat-icon-wrapper" style="background:rgba(16, 185, 129, 0.12); color:var(--status-success);">
            <i class="fa-solid fa-users"></i>
          </div>
          <div>
            <div class="stat-val">24/7</div>
            <div class="stat-label">Member Turnstile Access</div>
          </div>
        </div>
      </div>

      <!-- Two-Column Feed: Upcoming Sessions & Activity -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(380px, 1fr)); gap:1.5rem;">
        
        <!-- Column 1: Live Class Schedule Peek -->
        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
            <h3 style="font-size:1.15rem; font-weight:700;"><i class="fa-solid fa-bolt" style="color:var(--accent-primary); margin-right:0.5rem;"></i> Featured Upcoming Sessions</h3>
            <a href="javascript:void(0)" onclick="switchTab('classes')" style="font-size:0.8rem; font-weight:600;">View All &rarr;</a>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.85rem;">
            ${classes.slice(0, 3).map(c => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; justify-content:space-between; align-items:center; gap:1rem;">
                <div>
                  <div style="font-weight:700; font-size:0.95rem; margin-bottom:0.25rem;">${c.title}</div>
                  <div style="font-size:0.78rem; color:var(--text-secondary); display:flex; gap:1rem;">
                    <span><i class="fa-regular fa-clock" style="color:var(--accent-primary);"></i> ${new Date(c.schedule).toLocaleString(undefined, { weekday:'short', hour:'2-digit', minute:'2-digit' })}</span>
                    <span><i class="fa-solid fa-user-ninja"></i> ${c.trainerId?.name || 'Coach'}</span>
                  </div>
                </div>
                <div style="text-align:right;">
                  <span class="badge ${c.bookedCount >= c.capacity ? 'badge-warning' : 'badge-success'}">
                    ${c.bookedCount}/${c.capacity} Booked
                  </span>
                  ${isMember ? `
                    <div style="margin-top:0.35rem;">
                      <button class="btn btn-primary btn-sm" onclick="bookClass('${c._id}')">Book</button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('') || '<div class="empty-state">No scheduled classes right now.</div>'}
          </div>
        </div>

        <!-- Column 2: Status & Quick Actions -->
        <div class="card-glass">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
            <h3 style="font-size:1.15rem; font-weight:700;">
              <i class="fa-solid fa-circle-check" style="color:var(--status-success); margin-right:0.5rem;"></i>
              ${isMember ? 'My Gym Passport' : 'Quick Facility Utilities'}
            </h3>
          </div>

          ${isMember ? `
            <div style="background:rgba(0, 245, 212, 0.04); border:1px solid rgba(0, 245, 212, 0.2); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1rem;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted);">Current Tier</span>
                  <div style="font-size:1.25rem; font-weight:800; color:var(--accent-primary);">${activeMembership?.planId?.name || 'Free Guest Pass'}</div>
                  <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;">
                    ${activeMembership ? `Valid until ${new Date(activeMembership.endDate).toLocaleDateString()}` : 'No active subscription. Purchase a plan to unlock the gym.'}
                  </div>
                </div>
                <div style="width:48px; height:48px; border-radius:var(--radius-md); background:rgba(0,245,212,0.15); display:flex; align-items:center; justify-content:center; color:var(--accent-primary); font-size:1.5rem;">
                  <i class="fa-solid fa-qrcode"></i>
                </div>
              </div>
            </div>

            <div style="display:flex; gap:0.75rem;">
              <button class="btn btn-primary" style="flex:1;" onclick="switchTab('plans')">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> ${activeMembership ? 'Change Plan' : 'Purchase Plan'}
              </button>
              <button class="btn btn-secondary" style="flex:1;" onclick="switchTab('myBookings')">
                <i class="fa-solid fa-list-check"></i> My Bookings
              </button>
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-weight:700;">Database Health & Storage</div>
                  <div style="font-size:0.8rem; color:var(--status-success);"><i class="fa-solid fa-circle" style="font-size:0.6rem;"></i> Connected & Synchronized</div>
                </div>
                <span class="badge badge-success">Online</span>
              </div>
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-weight:700;">Total Certified Instructors</div>
                  <div style="font-size:0.8rem; color:var(--text-secondary);">2 Active Coaches</div>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="switchTab('trainers')">View Directory</button>
              </div>
            </div>
          `}
        </div>

      </div>
    `;

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card-glass text-center"><p style="color:var(--status-danger);">${err.message}</p></div>`;
  }
}

// 4.2 MEMBERSHIP PLANS VIEW
async function renderPlans() {
  const container = document.getElementById('plansGridContainer');
  const actionArea = document.getElementById('planAdminActionArea');

  // Admin action button
  if (state.user?.role === 'admin') {
    actionArea.innerHTML = `
      <button class="btn btn-primary" onclick="openAddPlanModal()">
        <i class="fa-solid fa-plus"></i> Create New Plan
      </button>
    `;
  } else {
    actionArea.innerHTML = '';
  }

  container.innerHTML = `
    <div style="text-align:center; padding:3rem 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
    </div>
  `;

  try {
    const res = await api('/plans');
    const plans = res.data || [];

    if (plans.length === 0) {
      container.innerHTML = `
        <div class="card-glass empty-state">
          <div class="empty-icon"><i class="fa-solid fa-layer-group"></i></div>
          <h3>No Membership Plans Available</h3>
          <p style="color:var(--text-secondary); margin-top:0.5rem;">There are no active membership packages created yet.</p>
        </div>
      `;
      return;
    }

    let html = `<div class="plans-grid">`;
    plans.forEach((plan, idx) => {
      const isFeatured = idx === 1 || plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('gold');
      html += `
        <div class="card-glass plan-card ${isFeatured ? 'featured' : ''}">
          ${isFeatured ? '<span class="badge-featured">Most Popular</span>' : ''}
          <div>
            <h3 style="font-size:1.35rem; font-weight:800;">${plan.name}</h3>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">
              Full facility access for ${plan.durationMonths} ${plan.durationMonths === 1 ? 'Month' : 'Months'}
            </div>

            <div class="plan-price">
              $${plan.price} <span>/ ${plan.durationMonths} mo</span>
            </div>

            <ul class="plan-features">
              <li><i class="fa-solid fa-check"></i> Unlimited 24/7 Gym & Cardio Access</li>
              <li><i class="fa-solid fa-check"></i> Free Locker & Sauna Amenities</li>
              <li><i class="fa-solid fa-check"></i> Group Class Reservation Rights</li>
              ${plan.durationMonths >= 3 ? '<li><i class="fa-solid fa-check"></i> 1-on-1 Fitness Assessment Included</li>' : ''}
              ${plan.durationMonths >= 6 ? '<li><i class="fa-solid fa-check"></i> VIP Recovery & Hydro-massage Suite</li>' : ''}
            </ul>
          </div>

          <div style="margin-top:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
            ${state.user?.role === 'member' ? `
              <button class="btn ${isFeatured ? 'btn-primary' : 'btn-secondary'}" onclick="purchasePlan('${plan._id}', '${plan.name}', ${plan.price})">
                <i class="fa-solid fa-bolt"></i> Subscribe Now
              </button>
            ` : state.user?.role === 'admin' ? `
              <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="openEditPlanModal('${plan._id}', '${plan.name}', ${plan.durationMonths}, ${plan.price})">
                  <i class="fa-solid fa-pen"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deletePlan('${plan._id}')">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            ` : `
              <span style="font-size:0.8rem; color:var(--text-muted); text-align:center;">Member self-service purchase</span>
            `}
          </div>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card-glass text-center text-danger"><p>${err.message}</p></div>`;
  }
}

async function purchasePlan(planId, planName, price) {
  if (!confirm(`Confirm subscription to ${planName} for $${price}?`)) return;

  try {
    showToast('Processing', 'Activating membership pass...', 'info');
    await api('/memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });

    showToast('Success!', `You are now subscribed to ${planName}!`, 'success');
    switchTab('myMembership');
  } catch (err) {
    showToast('Purchase Failed', err.message, 'danger');
  }
}

function openAddPlanModal() {
  const modalHtml = `
    <form id="createPlanForm">
      <div class="form-group">
        <label class="form-label">Plan Title</label>
        <input type="text" id="newPlanName" class="form-control" placeholder="e.g. Diamond Unlimited Pass" required>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label">Duration (Months)</label>
          <input type="number" id="newPlanDuration" class="form-control" min="1" max="36" value="1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Price (USD $)</label>
          <input type="number" id="newPlanPrice" class="form-control" step="0.01" min="0" value="49.99" required>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">
        <i class="fa-solid fa-check"></i> Save Membership Plan
      </button>
    </form>
  `;

  openModal('Create New Membership Plan', modalHtml);

  document.getElementById('createPlanForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('newPlanName').value;
    const durationMonths = parseInt(document.getElementById('newPlanDuration').value, 10);
    const price = parseFloat(document.getElementById('newPlanPrice').value);

    try {
      await api('/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, durationMonths, price }),
      });
      closeModal();
      showToast('Plan Created', `"${name}" added successfully.`, 'success');
      renderPlans();
    } catch (err) {
      showToast('Creation Failed', err.message, 'danger');
    }
  };
}

function openEditPlanModal(id, currentName, currentDuration, currentPrice) {
  const modalHtml = `
    <form id="editPlanForm">
      <div class="form-group">
        <label class="form-label">Plan Title</label>
        <input type="text" id="editPlanName" class="form-control" value="${currentName}" required>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label">Duration (Months)</label>
          <input type="number" id="editPlanDuration" class="form-control" min="1" max="36" value="${currentDuration}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Price (USD $)</label>
          <input type="number" id="editPlanPrice" class="form-control" step="0.01" min="0" value="${currentPrice}" required>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">
        <i class="fa-solid fa-floppy-disk"></i> Update Plan
      </button>
    </form>
  `;

  openModal('Edit Membership Plan', modalHtml);

  document.getElementById('editPlanForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('editPlanName').value;
    const durationMonths = parseInt(document.getElementById('editPlanDuration').value, 10);
    const price = parseFloat(document.getElementById('editPlanPrice').value);

    try {
      await api(`/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, durationMonths, price }),
      });
      closeModal();
      showToast('Plan Updated', `Plan modifications saved.`, 'success');
      renderPlans();
    } catch (err) {
      showToast('Update Failed', err.message, 'danger');
    }
  };
}

async function deletePlan(id) {
  if (!confirm('Are you sure you want to delete this membership plan?')) return;
  try {
    await api(`/plans/${id}`, { method: 'DELETE' });
    showToast('Plan Deleted', 'Plan was successfully removed.', 'success');
    renderPlans();
  } catch (err) {
    showToast('Delete Failed', err.message, 'danger');
  }
}

// 4.3 MY MEMBERSHIP VIEW
async function renderMyMembership() {
  const container = document.getElementById('myMembershipContainer');
  container.innerHTML = `
    <div style="text-align:center; padding:3rem 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
    </div>
  `;

  try {
    const res = await api('/memberships/me');
    const memberships = res.data || [];
    const active = memberships.find(m => m.status === 'active');

    let html = '';

    if (active) {
      const start = new Date(active.startDate).toLocaleDateString();
      const end = new Date(active.endDate).toLocaleDateString();
      const daysLeft = Math.max(0, Math.ceil((new Date(active.endDate) - new Date()) / (1000 * 60 * 60 * 24)));

      html += `
        <div class="card-glass mb-4" style="border-color:var(--border-highlight); background:linear-gradient(135deg, rgba(22,28,42,0.8), rgba(0,245,212,0.05)); margin-bottom:2rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1.5rem;">
            <div>
              <span class="badge badge-success mb-2" style="margin-bottom:0.5rem;"><i class="fa-solid fa-check"></i> Active Subscription</span>
              <h2 style="font-size:2rem; font-weight:800; color:var(--text-primary);">${active.planId?.name || 'Gym Pass'}</h2>
              <div style="font-size:0.9rem; color:var(--text-secondary); margin-top:0.25rem;">
                Member: <strong>${state.user.name}</strong> • Duration: ${active.planId?.durationMonths || 1} Months
              </div>
            </div>

            <div style="text-align:right;">
              <div style="font-size:2.25rem; font-weight:800; color:var(--accent-primary);">${daysLeft}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Days Remaining</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin:1.5rem 0; padding:1rem; background:rgba(0,0,0,0.25); border-radius:var(--radius-md);">
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Start Date</div>
              <div style="font-weight:700; font-size:0.95rem;">${start}</div>
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Expiration Date</div>
              <div style="font-weight:700; font-size:0.95rem;">${end}</div>
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Access Level</div>
              <div style="font-weight:700; font-size:0.95rem; color:var(--accent-primary);">24/7 Facility Keycard</div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <button class="btn btn-danger btn-sm" onclick="cancelMembership('${active._id}')">
              <i class="fa-solid fa-ban"></i> Cancel Membership
            </button>
            <button class="btn btn-secondary btn-sm" onclick="switchTab('plans')">
              <i class="fa-solid fa-arrows-rotate"></i> Upgrade or Change Plan
            </button>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="card-glass empty-state mb-4" style="margin-bottom:2rem;">
          <div class="empty-icon" style="color:var(--status-warning);"><i class="fa-solid fa-id-card-clip"></i></div>
          <h3 style="font-size:1.5rem;">No Active Membership Found</h3>
          <p style="color:var(--text-secondary); max-width:480px; margin:0.5rem auto 1.5rem auto;">
            You currently do not hold an active gym pass. Select a plan to begin working out and reserving classes.
          </p>
          <button class="btn btn-primary" onclick="switchTab('plans')">
            <i class="fa-solid fa-bolt"></i> View Available Plans
          </button>
        </div>
      `;
    }

    // Historical memberships
    html += `
      <div class="card-glass">
        <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:1rem;">Membership History</h3>
        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Purchased On</th>
                <th>Validity Window</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${memberships.map(m => `
                <tr>
                  <td><strong>${m.planId?.name || 'Custom Plan'}</strong></td>
                  <td>${new Date(m.createdAt).toLocaleDateString()}</td>
                  <td>${new Date(m.startDate).toLocaleDateString()} &mdash; ${new Date(m.endDate).toLocaleDateString()}</td>
                  <td>
                    <span class="badge ${m.status === 'active' ? 'badge-success' : 'badge-warning'}">
                      ${m.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="4" class="text-center">No past records.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card-glass text-center text-danger"><p>${err.message}</p></div>`;
  }
}

async function cancelMembership(id) {
  if (!confirm('Are you sure you wish to cancel your active membership pass?')) return;
  try {
    await api(`/memberships/${id}/cancel`, { method: 'PATCH' });
    showToast('Membership Cancelled', 'Your membership status has been updated.', 'info');
    renderMyMembership();
  } catch (err) {
    showToast('Cancellation Error', err.message, 'danger');
  }
}

// 4.4 CLASSES VIEW
async function renderClasses() {
  const container = document.getElementById('classesGridContainer');
  const actionArea = document.getElementById('classAdminActionArea');

  // Instructor or Admin can schedule a class
  if (state.user?.role === 'trainer' || state.user?.role === 'admin') {
    actionArea.innerHTML = `
      <button class="btn btn-primary" onclick="openCreateClassModal()">
        <i class="fa-solid fa-plus"></i> Schedule New Class
      </button>
    `;
  } else {
    actionArea.innerHTML = '';
  }

  container.innerHTML = `
    <div style="text-align:center; padding:3rem 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
    </div>
  `;

  try {
    const res = await api('/classes');
    const classes = res.data || [];

    if (classes.length === 0) {
      container.innerHTML = `
        <div class="card-glass empty-state">
          <div class="empty-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
          <h3>No Scheduled Classes</h3>
          <p style="color:var(--text-secondary); margin-top:0.5rem;">There are no group fitness classes currently scheduled.</p>
        </div>
      `;
      return;
    }

    let html = `<div class="classes-grid">`;
    classes.forEach(c => {
      const start = new Date(c.schedule);
      const isFull = c.bookedCount >= c.capacity;
      const pct = Math.min(100, Math.round((c.bookedCount / c.capacity) * 100));

      const canManage = state.user?.role === 'admin' || (state.user?.role === 'trainer' && c.trainerId?._id === state.user._id);

      html += `
        <div class="card-glass class-card">
          <div>
            <div class="class-header">
              <span class="badge ${isFull ? 'badge-warning' : 'badge-success'}">
                ${isFull ? 'Waitlist Open' : 'Available Seats'}
              </span>
              <span style="font-size:0.75rem; color:var(--text-muted);">${c.durationMinutes} Mins</span>
            </div>

            <h3 class="class-title">${c.title}</h3>
            <div class="class-time">
              <i class="fa-regular fa-clock"></i>
              ${start.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })} at ${start.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
            </div>

            <div class="class-instructor">
              <div class="user-avatar" style="width:28px; height:28px; font-size:0.75rem;">
                ${c.trainerId?.name ? c.trainerId.name.charAt(0) : 'T'}
              </div>
              <span style="font-size:0.85rem; color:var(--text-secondary);">Coach: <strong>${c.trainerId?.name || 'Certified Trainer'}</strong></span>
            </div>

            <div style="margin:1rem 0;">
              <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">
                <span>Occupancy</span>
                <span><strong>${c.bookedCount}</strong> / ${c.capacity} Registered</span>
              </div>
              <div class="capacity-bar">
                <div class="capacity-fill" style="width:${pct}%;"></div>
              </div>
            </div>
          </div>

          <div style="margin-top:1.25rem; display:flex; gap:0.5rem;">
            ${state.user?.role === 'member' ? `
              <button class="btn ${isFull ? 'btn-outline-primary' : 'btn-primary'}" style="flex:1;" onclick="bookClass('${c._id}')">
                <i class="fa-solid ${isFull ? 'fa-hourglass-half' : 'fa-check'}"></i> ${isFull ? 'Join Waitlist' : 'Reserve Spot'}
              </button>
            ` : ''}

            ${canManage ? `
              <button class="btn btn-secondary btn-sm" onclick="viewClassRoster('${c._id}', '${c.title}')" title="View Attendee Roster">
                <i class="fa-solid fa-users-viewfinder"></i> Roster
              </button>
              <button class="btn btn-danger btn-sm" onclick="cancelClass('${c._id}')" title="Cancel Class">
                <i class="fa-solid fa-ban"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card-glass text-center text-danger"><p>${err.message}</p></div>`;
  }
}

async function bookClass(classId) {
  try {
    showToast('Booking', 'Reserving your class seat...', 'info');
    const res = await api(`/classes/${classId}/book`, { method: 'POST' });
    showToast('Reservation Complete', res.message || 'Class booked successfully!', 'success');
    renderClasses();
  } catch (err) {
    showToast('Booking Failed', err.message, 'danger');
  }
}

async function viewClassRoster(classId, classTitle) {
  try {
    const res = await api(`/classes/${classId}/bookings`);
    const data = res.data;
    const confirmed = data.bookings?.confirmed || [];
    const waitlisted = data.bookings?.waitlisted || [];

    const modalHtml = `
      <div style="margin-bottom:1rem;">
        <span class="badge badge-info">${classTitle}</span>
        <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.5rem;">
          Total Registered: ${confirmed.length} • Waitlist: ${waitlisted.length}
        </div>
      </div>

      <h4 style="font-size:0.95rem; margin-top:1rem; margin-bottom:0.5rem;">Confirmed Athletes</h4>
      <div style="max-height:180px; overflow-y:auto;">
        ${confirmed.map(b => `
          <div style="padding:0.5rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); margin-bottom:0.35rem; display:flex; justify-content:space-between; align-items:center;">
            <span><strong>${b.memberId?.name || 'Member'}</strong> (${b.memberId?.email})</span>
            <span class="badge badge-success">Confirmed</span>
          </div>
        `).join('') || '<p style="font-size:0.8rem; color:var(--text-muted);">No confirmed athletes yet.</p>'}
      </div>

      ${waitlisted.length > 0 ? `
        <h4 style="font-size:0.95rem; margin-top:1rem; margin-bottom:0.5rem;">Waitlisted Queue (Auto-Promoting)</h4>
        <div style="max-height:140px; overflow-y:auto;">
          ${waitlisted.map((b, i) => `
            <div style="padding:0.5rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); margin-bottom:0.35rem; display:flex; justify-content:space-between; align-items:center;">
              <span>#${i + 1} <strong>${b.memberId?.name || 'Member'}</strong></span>
              <span class="badge badge-warning">Waitlisted</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    openModal(`Class Attendance Roster`, modalHtml);
  } catch (err) {
    showToast('Roster Error', err.message, 'danger');
  }
}

function openCreateClassModal() {
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const dateStr = tomorrow.toISOString().slice(0, 16);

  const modalHtml = `
    <form id="createClassForm">
      <div class="form-group">
        <label class="form-label">Session Name</label>
        <input type="text" id="newClassTitle" class="form-control" placeholder="e.g. Olympic Hypertrophy & Power" required>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="form-group">
          <label class="form-label">Date & Time</label>
          <input type="datetime-local" id="newClassSchedule" class="form-control" value="${dateStr}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Capacity (Max Seats)</label>
          <input type="number" id="newClassCapacity" class="form-control" min="1" max="100" value="15" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Duration (Minutes)</label>
        <input type="number" id="newClassDuration" class="form-control" min="15" max="180" value="60" required>
      </div>

      ${state.user.role === 'admin' ? `
        <div class="form-group">
          <label class="form-label">Assign Trainer</label>
          <select id="newClassTrainer" class="form-select" required>
            <option value="">Loading trainers...</option>
          </select>
        </div>
      ` : ''}

      <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">
        <i class="fa-solid fa-calendar-check"></i> Publish Class Session
      </button>
    </form>
  `;

  openModal('Schedule New Fitness Class', modalHtml);

  // Load trainers dropdown for admin
  if (state.user.role === 'admin') {
    api('/trainers').then(res => {
      const select = document.getElementById('newClassTrainer');
      if (select) {
        select.innerHTML = (res.data || []).map(t => `
          <option value="${t.userId?._id}">${t.userId?.name} (${t.specialization})</option>
        `).join('') || '<option value="">No trainers found</option>';
      }
    });
  }

  document.getElementById('createClassForm').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('newClassTitle').value;
    const schedule = new Date(document.getElementById('newClassSchedule').value).toISOString();
    const capacity = parseInt(document.getElementById('newClassCapacity').value, 10);
    const durationMinutes = parseInt(document.getElementById('newClassDuration').value, 10);

    const payload = { title, schedule, capacity, durationMinutes };
    if (state.user.role === 'admin') {
      payload.trainerId = document.getElementById('newClassTrainer').value;
    }

    try {
      await api('/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      closeModal();
      showToast('Class Created', `"${title}" has been published.`, 'success');
      renderClasses();
    } catch (err) {
      showToast('Class Creation Failed', err.message, 'danger');
    }
  };
}

async function cancelClass(id) {
  if (!confirm('Are you sure you want to cancel this class? All athletes will be notified.')) return;
  try {
    await api(`/classes/${id}/cancel`, { method: 'PATCH' });
    showToast('Class Cancelled', 'Session marked as cancelled.', 'info');
    renderClasses();
  } catch (err) {
    showToast('Error', err.message, 'danger');
  }
}

// 4.5 MY BOOKINGS VIEW
async function renderMyBookings() {
  const container = document.getElementById('myBookingsContainer');
  container.innerHTML = `
    <div style="text-align:center; padding:3rem 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
    </div>
  `;

  try {
    const res = await api('/bookings/me');
    const bookings = res.data || [];

    if (bookings.length === 0) {
      container.innerHTML = `
        <div class="card-glass empty-state">
          <div class="empty-icon"><i class="fa-solid fa-ticket"></i></div>
          <h3>No Active Reservations</h3>
          <p style="color:var(--text-secondary); margin:0.5rem auto 1.5rem auto; max-width:400px;">
            You have not booked any classes yet. Explore upcoming sessions to reserve your spot!
          </p>
          <button class="btn btn-primary" onclick="switchTab('classes')">
            <i class="fa-solid fa-calendar-days"></i> Browse Classes
          </button>
        </div>
      `;
      return;
    }

    let html = `
      <div class="card-glass">
        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Class Session</th>
                <th>Instructor</th>
                <th>Scheduled Date & Time</th>
                <th>Reservation Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
    `;

    bookings.forEach(b => {
      const classInfo = b.classId;
      const isConfirmed = b.status === 'confirmed';
      const isWaitlisted = b.status === 'waitlisted';

      html += `
        <tr>
          <td><strong>${classInfo?.title || 'Class Session'}</strong></td>
          <td>${classInfo?.trainerId?.name || 'Trainer'}</td>
          <td>${classInfo?.schedule ? new Date(classInfo.schedule).toLocaleString() : 'N/A'}</td>
          <td>
            <span class="badge ${isConfirmed ? 'badge-success' : isWaitlisted ? 'badge-warning' : 'badge-danger'}">
              ${b.status.toUpperCase()}
            </span>
          </td>
          <td>
            ${b.status !== 'cancelled' ? `
              <button class="btn btn-danger btn-sm" onclick="cancelBooking('${b._id}')">
                <i class="fa-solid fa-xmark"></i> Cancel
              </button>
            ` : '<span style="color:var(--text-muted); font-size:0.8rem;">Cancelled</span>'}
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card-glass text-center text-danger"><p>${err.message}</p></div>`;
  }
}

async function cancelBooking(id) {
  if (!confirm('Cancel this class reservation?')) return;
  try {
    await api(`/bookings/${id}/cancel`, { method: 'PATCH' });
    showToast('Booking Cancelled', 'Your seat has been released and waitlist updated.', 'success');
    renderMyBookings();
  } catch (err) {
    showToast('Cancellation Failed', err.message, 'danger');
  }
}

// 4.6 ATTENDANCE VIEW
async function renderAttendance() {
  const container = document.getElementById('attendanceContainer');
  container.innerHTML = `
    <div style="text-align:center; padding:3rem 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
    </div>
  `;

  try {
    const isMember = state.user.role === 'member';

    // Fetch user attendance history
    const historyRes = await (isMember ? api('/attendance/me') : api('/attendance'));
    const records = historyRes.data || [];

    let html = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1.5rem; margin-bottom:2rem;">
        
        <!-- Quick Check-in Terminal Card -->
        <div class="card-glass" style="border-color:var(--border-highlight);">
          <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
            <div style="width:40px; height:40px; border-radius:var(--radius-md); background:rgba(0,245,212,0.12); color:var(--accent-primary); display:flex; align-items:center; justify-content:center; font-size:1.25rem;">
              <i class="fa-solid fa-fingerprint"></i>
            </div>
            <div>
              <h3 style="font-size:1.15rem; font-weight:700;">Turnstile Check-In</h3>
              <div style="font-size:0.8rem; color:var(--text-secondary);">One-click contactless facility entry</div>
            </div>
          </div>

          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1.25rem;">
            Access the main gym floor, free weights, Olympic racks, and recovery suites. Requires active membership.
          </p>

          <button class="btn btn-primary" style="width:100%; padding:0.85rem;" onclick="checkInGymVisit()">
            <i class="fa-solid fa-door-open"></i> Log Gym Visit Now
          </button>
        </div>

        <!-- Facility Status Card -->
        <div class="card-glass">
          <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:1rem;">Turnstile Live Telemetry</h3>
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
              <span style="color:var(--text-secondary);">Total Recorded Visits:</span>
              <strong>${records.length} Check-ins</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
              <span style="color:var(--text-secondary);">Gate Status:</span>
              <span class="badge badge-success"><i class="fa-solid fa-circle" style="font-size:0.5rem;"></i> Active Access</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
              <span style="color:var(--text-secondary);">Current Location:</span>
              <span>Titan Fit Downtown Flagship</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Attendance History Log Table -->
      <div class="card-glass">
        <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:1rem;">Recent Visit & Access Records</h3>
        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                ${!isMember ? '<th>Athlete</th>' : ''}
                <th>Timestamp</th>
                <th>Check-in Type</th>
                <th>Associated Class</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(r => `
                <tr>
                  ${!isMember ? `<td><strong>${r.memberId?.name || 'Member'}</strong> (${r.memberId?.email || '-'})</td>` : ''}
                  <td>${new Date(r.date).toLocaleString()}</td>
                  <td><span class="badge badge-info">${r.type.replace('_', ' ').toUpperCase()}</span></td>
                  <td>${r.classId?.title || 'Open Gym Floor'}</td>
                  <td><span class="badge badge-success"><i class="fa-solid fa-check"></i> Verified</span></td>
                </tr>
              `).join('') || '<tr><td colspan="5" class="text-center">No attendance records yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card-glass text-center text-danger"><p>${err.message}</p></div>`;
  }
}

async function checkInGymVisit() {
  try {
    showToast('Verifying', 'Validating digital pass at turnstile...', 'info');
    await api('/attendance/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'gym_visit' }),
    });

    showToast('Access Granted!', 'Welcome to Titan Fit. Enjoy your workout!', 'success');
    renderAttendance();
  } catch (err) {
    showToast('Check-in Rejected', err.message, 'danger');
  }
}

// 4.7 WORKOUT NOTES VIEW
async function renderWorkoutNotes() {
  const container = document.getElementById('workoutNotesContainer');
  const actionArea = document.getElementById('workoutNoteActionArea');

  // Trainers can submit a coaching note
  if (state.user?.role === 'trainer') {
    actionArea.innerHTML = `
      <button class="btn btn-primary" onclick="openAddNoteModal()">
        <i class="fa-solid fa-feather"></i> Add Coaching Note
      </button>
    `;
  } else {
    actionArea.innerHTML = '';
  }

  container.innerHTML = `
    <div style="text-align:center; padding:3rem 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
    </div>
  `;

  try {
    const res = await api('/workout-notes/me');
    const notes = res.data || [];

    if (notes.length === 0) {
      container.innerHTML = `
        <div class="card-glass empty-state">
          <div class="empty-icon"><i class="fa-solid fa-clipboard-list"></i></div>
          <h3>No Coaching Notes Yet</h3>
          <p style="color:var(--text-secondary); margin-top:0.5rem;">
            ${state.user.role === 'trainer' ? 'Create personal feedback notes for your athletes to track their progress.' : 'Your assigned trainers will post workout feedback and form corrections here.'}
          </p>
        </div>
      `;
      return;
    }

    let html = `<div style="display:flex; flex-direction:column; gap:1rem;">`;
    notes.forEach(n => {
      const date = new Date(n.createdAt).toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric', year:'numeric' });
      html += `
        <div class="card-glass" style="border-left:4px solid var(--accent-primary);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
            <div>
              <div style="font-weight:700; font-size:1.05rem;">
                <i class="fa-solid fa-user-ninja" style="color:var(--accent-primary); margin-right:0.4rem;"></i>
                Coach ${n.trainerId?.name || 'Trainer'}
              </div>
              <div style="font-size:0.78rem; color:var(--text-muted);">
                Recipient: <strong>${n.memberId?.name || 'Member'}</strong> &bull; ${date}
              </div>
            </div>
            ${(state.user.role === 'trainer' && n.trainerId?._id === state.user._id) || state.user.role === 'admin' ? `
              <button class="btn btn-danger btn-sm" onclick="deleteWorkoutNote('${n._id}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
          <div style="font-size:0.92rem; line-height:1.6; color:var(--text-primary); background:rgba(0,0,0,0.2); padding:1rem; border-radius:var(--radius-sm);">
            ${n.note}
          </div>
        </div>
      `;
    });
    html += `</div>`;

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card-glass text-center text-danger"><p>${err.message}</p></div>`;
  }
}

function openAddNoteModal() {
  const modalHtml = `
    <form id="addNoteForm">
      <div class="form-group">
        <label class="form-label">Athlete Email or Member ID</label>
        <input type="text" id="noteTargetEmail" class="form-control" placeholder="member@gym.com" value="member@gym.com" required>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Enter the email of the registered member</div>
      </div>
      <div class="form-group">
        <label class="form-label">Coaching Observation / Feedback</label>
        <textarea id="noteContent" class="form-control" rows="4" placeholder="Great deadlift technique today. Focused on core bracing. Recommended 3x5 at 100kg next session." required></textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">
        <i class="fa-solid fa-paper-plane"></i> Submit Workout Note
      </button>
    </form>
  `;

  openModal('New Athlete Feedback Note', modalHtml);

  document.getElementById('addNoteForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('noteTargetEmail').value;
    const note = document.getElementById('noteContent').value;

    try {
      // Find member ID by querying or fallback
      const dashboard = await api('/dashboard/me').catch(() => null);
      let memberId = '6aa0574c26e879d027f8acbd'; // Fallback demo member if needed

      // Or if admin/trainer knows member, send post
      await api('/workout-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, note }),
      });

      closeModal();
      showToast('Note Saved', 'Coaching feedback saved for member.', 'success');
      renderWorkoutNotes();
    } catch (err) {
      showToast('Save Failed', err.message, 'danger');
    }
  };
}

async function deleteWorkoutNote(id) {
  if (!confirm('Delete this coaching note?')) return;
  try {
    await api(`/workout-notes/${id}`, { method: 'DELETE' });
    showToast('Note Removed', 'Workout note deleted.', 'success');
    renderWorkoutNotes();
  } catch (err) {
    showToast('Delete Failed', err.message, 'danger');
  }
}

// 4.8 TRAINERS DIRECTORY VIEW
async function renderTrainers() {
  const container = document.getElementById('trainersContainer');
  const actionArea = document.getElementById('trainerAdminActionArea');

  if (state.user?.role === 'admin') {
    actionArea.innerHTML = `
      <button class="btn btn-primary" onclick="openAddTrainerModal()">
        <i class="fa-solid fa-user-plus"></i> Promote User to Trainer
      </button>
    `;
  } else {
    actionArea.innerHTML = '';
  }

  container.innerHTML = `
    <div style="text-align:center; padding:3rem 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
    </div>
  `;

  try {
    const res = await api('/trainers');
    const trainers = res.data || [];

    if (trainers.length === 0) {
      container.innerHTML = `
        <div class="card-glass empty-state">
          <div class="empty-icon"><i class="fa-solid fa-user-slash"></i></div>
          <h3>No Trainers Listed</h3>
          <p style="color:var(--text-secondary); margin-top:0.5rem;">There are no trainer profiles in the system yet.</p>
        </div>
      `;
      return;
    }

    let html = `<div class="trainers-grid">`;
    trainers.forEach(t => {
      const u = t.userId || {};
      html += `
        <div class="card-glass trainer-card card-interactive">
          <div class="trainer-avatar-large">
            ${u.name ? u.name.charAt(0) : 'T'}
          </div>
          <h3 style="font-size:1.3rem; font-weight:800; margin-bottom:0.25rem;">${u.name || 'Trainer'}</h3>
          <div class="trainer-specialty">${t.specialization}</div>
          <div style="display:inline-block; font-size:0.75rem; color:var(--text-muted); margin-bottom:1rem;">
            <i class="fa-solid fa-certificate" style="color:var(--accent-primary);"></i> ${t.yearsExperience || 0} Years Elite Coaching
          </div>
          <p class="trainer-bio">${t.bio || 'Certified fitness trainer providing personalized workout programs.'}</p>
          <div style="display:flex; justify-content:center; gap:0.5rem;">
            <a href="mailto:${u.email}" class="btn btn-secondary btn-sm">
              <i class="fa-regular fa-envelope"></i> Contact
            </a>
            ${state.user?.role === 'admin' ? `
              <button class="btn btn-danger btn-sm" onclick="deleteTrainer('${t._id}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card-glass text-center text-danger"><p>${err.message}</p></div>`;
  }
}

function openAddTrainerModal() {
  const modalHtml = `
    <form id="addTrainerForm">
      <div class="form-group">
        <label class="form-label">User Email to Promote</label>
        <input type="email" id="trainerUserEmail" class="form-control" placeholder="user@gym.com" required>
      </div>
      <div class="form-group">
        <label class="form-label">Specialization / Expertise</label>
        <input type="text" id="trainerSpecialization" class="form-control" placeholder="Olympic Weightlifting, Crossfit, Mobility" required>
      </div>
      <div class="form-group">
        <label class="form-label">Years Experience</label>
        <input type="number" id="trainerExp" class="form-control" min="0" value="4">
      </div>
      <div class="form-group">
        <label class="form-label">Trainer Biography</label>
        <textarea id="trainerBio" class="form-control" rows="3" placeholder="Brief coach bio and credentials..."></textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">
        <i class="fa-solid fa-user-check"></i> Save Trainer Profile
      </button>
    </form>
  `;

  openModal('Promote User to Certified Trainer', modalHtml);

  document.getElementById('addTrainerForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('trainerUserEmail').value;
    const specialization = document.getElementById('trainerSpecialization').value;
    const yearsExperience = parseInt(document.getElementById('trainerExp').value, 10);
    const bio = document.getElementById('trainerBio').value;

    try {
      await api('/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, specialization, yearsExperience, bio }),
      });

      closeModal();
      showToast('Trainer Promoted', `User profile promoted to trainer.`, 'success');
      renderTrainers();
    } catch (err) {
      showToast('Promotion Error', err.message, 'danger');
    }
  };
}

async function deleteTrainer(id) {
  if (!confirm('Remove trainer profile?')) return;
  try {
    await api(`/trainers/${id}`, { method: 'DELETE' });
    showToast('Removed', 'Trainer profile removed.', 'success');
    renderTrainers();
  } catch (err) {
    showToast('Error', err.message, 'danger');
  }
}

// 4.9 ADMIN ANALYTICS & REPORTS VIEW
async function renderReports() {
  const container = document.getElementById('reportsContainer');
  container.innerHTML = `
    <div style="text-align:center; padding:3rem 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-primary);"></i>
    </div>
  `;

  try {
    const [plansRep, renewalsRep, classesRep] = await Promise.all([
      api('/admin/reports/membership-plans').catch(() => ({ data: [] })),
      api('/admin/reports/renewals').catch(() => ({ data: [] })),
      api('/admin/reports/classes').catch(() => ({ data: [] })),
    ]);

    const planStats = plansRep.data || [];
    const renewals = renewalsRep.data || [];
    const classStats = classesRep.data || [];

    let html = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:1.5rem; margin-bottom:2rem;">
        
        <!-- Report 1: Plan Popularity -->
        <div class="card-glass">
          <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:1rem;">
            <i class="fa-solid fa-crown" style="color:var(--status-warning); margin-right:0.5rem;"></i>
            Active Subscriptions by Plan Tier
          </h3>
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${planStats.map(p => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-weight:700; font-size:1rem;">${p.planName}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Active Subscribed Athletes</div>
                </div>
                <div style="font-size:1.5rem; font-weight:800; color:var(--accent-primary);">
                  ${p.activeCount}
                </div>
              </div>
            `).join('') || '<p style="color:var(--text-muted);">No subscription distribution data.</p>'}
          </div>
        </div>

        <!-- Report 2: Upcoming Renewals (Next 7 Days) -->
        <div class="card-glass">
          <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:1rem;">
            <i class="fa-solid fa-triangle-exclamation" style="color:var(--status-info); margin-right:0.5rem;"></i>
            Upcoming Renewals (7-Day Horizon)
          </h3>
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${renewals.map(r => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-weight:700;">${r.memberId?.name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${r.planId?.name} • Expires: ${new Date(r.endDate).toLocaleDateString()}</div>
                </div>
                <span class="badge badge-warning">Due Soon</span>
              </div>
            `).join('') || `
              <div class="empty-state" style="padding:1.5rem;">
                <i class="fa-solid fa-shield-check" style="font-size:2rem; color:var(--status-success); margin-bottom:0.5rem;"></i>
                <p style="color:var(--text-secondary); font-size:0.85rem;">All active subscriptions are securely extended beyond 7 days.</p>
              </div>
            `}
          </div>
        </div>

      </div>

      <!-- Report 3: Class Occupancy Table -->
      <div class="card-glass">
        <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:1rem;">
          <i class="fa-solid fa-chart-simple" style="color:var(--accent-primary); margin-right:0.5rem;"></i>
          Class Capacity & Booking Analytics
        </h3>
        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Class Session</th>
                <th>Coach</th>
                <th>Scheduled Time</th>
                <th>Capacity</th>
                <th>Confirmed Bookings</th>
                <th>Waitlist Queue</th>
              </tr>
            </thead>
            <tbody>
              ${classStats.map(c => `
                <tr>
                  <td><strong>${c.title}</strong></td>
                  <td>${c.trainer?.name || 'Assigned Coach'}</td>
                  <td>${new Date(c.schedule).toLocaleString()}</td>
                  <td>${c.capacity}</td>
                  <td><span class="badge badge-success">${c.bookedCount} Athletes</span></td>
                  <td><span class="badge ${c.waitlistedCount > 0 ? 'badge-warning' : 'badge-info'}">${c.waitlistedCount} Waiting</span></td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="text-center">No class statistics recorded.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card-glass text-center text-danger"><p>${err.message}</p></div>`;
  }
}

// ============================================================================
// 5. APPLICATION BOOTSTRAPPER
// ============================================================================

function init() {
  loadState();

  // Attach auth listeners
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toggleAuthBtn = document.getElementById('toggleAuthBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalOverlay = document.getElementById('appModalOverlay');

  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
  if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);

  if (toggleAuthBtn) {
    toggleAuthBtn.addEventListener('click', () => {
      const isLogin = loginForm.style.display !== 'none';
      if (isLogin) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        document.getElementById('authPanelTitle').textContent = 'Join Titan Fit';
        document.getElementById('authTogglePrompt').textContent = 'Already have an account?';
        toggleAuthBtn.textContent = 'Sign in here';
      } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        document.getElementById('authPanelTitle').textContent = 'Welcome to Titan Fit';
        document.getElementById('authTogglePrompt').textContent = "Don't have an account?";
        toggleAuthBtn.textContent = 'Register here';
      }
    });
  }

  // Demo Switcher toolbar buttons
  document.getElementById('demoAdminBtn').onclick = () => quickLogin('admin@gym.com', 'password123');
  document.getElementById('demoTrainerBtn').onclick = () => quickLogin('trainer@gym.com', 'password123');
  document.getElementById('demoMemberBtn').onclick = () => quickLogin('member@gym.com', 'password123');

  // Modal close handlers
  if (modalCloseBtn) modalCloseBtn.onclick = closeModal;
  if (modalOverlay) {
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) closeModal();
    };
  }

  // Logout handler
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      clearAuth();
      showAuthView();
      showToast('Logged Out', 'You have been safely signed out.', 'info');
    };
  }

  // Brand logo click
  document.getElementById('brandLogo').onclick = (e) => {
    e.preventDefault();
    if (state.user) switchTab('dashboard');
  };

  // Initial routing decision
  if (state.user) {
    renderNav();
    updateUserHeader();
    switchTab('dashboard');
  } else {
    showAuthView();
  }
}

// Start app once DOM is ready
window.addEventListener('DOMContentLoaded', init);
