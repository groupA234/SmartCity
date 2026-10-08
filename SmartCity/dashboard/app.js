// ============================================================
//  SMART CITY PORTAL — app.js
// ============================================================

const navItems   = document.querySelectorAll('.nav-item[data-section]');
const sections   = document.querySelectorAll('.section');
const pageTitle  = document.getElementById('pageTitle');
const menuToggle = document.getElementById('menuToggle');
const sidebar    = document.querySelector('.sidebar');

// Map section id → display label
const titles = {
  home:     'Dashboard',
  taxes:    'Pay Taxes',
  report:   'Report a Problem',
  waste:    'Waste Management',
  news:     'News',
  about:    'About Us',
  settings: 'Settings',
};

// ── Navigate to a section ──────────────────────────────────
function navigateTo(sectionId) {
  // Update nav items
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });

  // Show the right section
  sections.forEach(sec => {
    sec.classList.toggle('active', sec.id === sectionId);
  });

  // Update topbar title
  pageTitle.textContent = titles[sectionId] || 'Dashboard';

  // Close sidebar on mobile
  sidebar.classList.remove('open');

  // Scroll to top of content
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Sidebar nav clicks ─────────────────────────────────────
navItems.forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.section));
});

// ── Hero / quick-card / footer buttons ────────────────────
document.addEventListener('click', e => {
  const goto = e.target.closest('[data-goto]');
  if (goto) navigateTo(goto.dataset.goto);
});

// ── Mobile hamburger ──────────────────────────────────────
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', e => {
  if (
    window.innerWidth <= 768 &&
    !sidebar.contains(e.target) &&
    e.target !== menuToggle
  ) {
    sidebar.classList.remove('open');
  }
});

// ── News filter buttons ────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active-filter'));
    btn.classList.add('active-filter');
  });
});

// ── Problem category pills ─────────────────────────────────
document.querySelectorAll('.prob-cat').forEach(cat => {
  cat.addEventListener('click', () => {
    document.querySelectorAll('.prob-cat').forEach(c => c.classList.remove('active-cat'));
    cat.classList.add('active-cat');
  });
});

// ── Theme selector ─────────────────────────────────────────
document.querySelectorAll('.theme-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.theme-opt').forEach(o => o.classList.remove('active-theme'));
    opt.classList.add('active-theme');
  });
});

// ── Form submission feedback (demo) ───────────────────────
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 28px; right: 28px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: #fff; padding: 14px 22px; border-radius: 10px;
    font-size: 0.9rem; font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 9999;
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Inject the slideUp keyframe once
const style = document.createElement('style');
style.textContent = `@keyframes slideUp {
  from { opacity:0; transform:translateY(20px); }
  to   { opacity:1; transform:translateY(0); }
}`;
document.head.appendChild(style);

document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.textContent.trim();
    if (text === 'Submit Payment')  showToast('✅ Payment submitted successfully!');
    if (text === 'Submit Report')   showToast('✅ Report submitted! Ref: RPT-' + Math.floor(Math.random()*90000+10000));
    if (text === 'Request Pickup')  showToast('✅ Pickup request submitted!');
    if (text === 'Save Changes')    showToast('✅ Profile updated successfully!');
  });
});
