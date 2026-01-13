// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});

// Active nav highlighting
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { threshold: 0.4 }
);
sections.forEach(s => observer.observe(s));

// Modal logic
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

const copy = {
  rodents: {
    title: 'Rodents',
    body: 'We inspect entry points, set tamper-safe traps, seal gaps/vents, and sanitize attics/basements if needed. Includes follow-up visit to remove traps and recheck seals.'
  },
  insects: {
    title: 'Insects',
    body: 'Ants/roaches/spiders/mosquitoes/bed bugs: interior flush-out + exterior perimeter barrier, pet-safe products, and crack/crevice treatment. We target nests/harborage and return if activity rebounds.'
  },
  specialty: {
    title: 'Specialty',
    body: 'Termites: monitor + spot treat. Wasps/Bees: remove nests and treat return spots. Wildlife: humane capture and exclusion. Always includes photo proof of work.'
  }
};

document.querySelectorAll('[data-modal]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.modal;
    modalTitle.textContent = copy[key].title;
    modalBody.textContent = copy[key].body;
    modal.classList.add('active');
  });
});
function closeModal() { modal.classList.remove('active'); }
modalClose?.addEventListener('click', closeModal);
modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Inputs and buttons
const nameInput = document.getElementById('contact-name');
const phoneInput = document.getElementById('contact-phone');
const serviceInput = document.getElementById('contact-service');
const detailsInput = document.getElementById('contact-details');
const btnText = document.getElementById('btn-text');
const btnEmail = document.getElementById('btn-email');
const btnSubmit = document.getElementById('btn-submit');
const openStatus = document.getElementById('open-status');
const serviceBlurb = document.getElementById('service-blurb');
const quizIssue = document.getElementById('quiz-issue');
const quizUrgency = document.getElementById('quiz-urgency');
const quizApply = document.getElementById('quiz-apply');
const toast = document.getElementById('toast');
const API_BASE = 'http://127.0.0.1:8000';

// Availability logic
const hoursMap = {
  0: { open: null, close: null }, // Sunday closed
  1: { open: 9, close: 18 },
  2: { open: 9, close: 18 },
  3: { open: 9, close: 18 },
  4: { open: 9, close: 18 },
  5: { open: 9, close: 18 },
  6: { open: 9, close: 18 },
};
function clientOpenStatus() {
  if (!openStatus) return;
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const { open, close } = hoursMap[day] || { open: 9, close: 17 };
  const isOpen = typeof open === 'number' && typeof close === 'number' && hour >= open && hour < close;
  setStatusBadge(isOpen ? 'We are OPEN now.' : 'We are CLOSED now.', isOpen);
}

function setStatusBadge(text, isOpen) {
  if (!openStatus) return;
  openStatus.classList.toggle('status-open', isOpen);
  openStatus.classList.toggle('status-closed', !isOpen);
  const textSpan = openStatus.querySelector('span:last-child');
  if (textSpan) textSpan.textContent = text;
}

async function fetchAvailability() {
  if (!openStatus) return;
  try {
    const res = await fetch(`${API_BASE}/api/hours/status`);
    if (!res.ok) throw new Error('bad');
    const data = await res.json();
    setStatusBadge(data.status || (data.open ? 'We are OPEN now.' : 'We are CLOSED now.'), data.open);
  } catch (e) {
    clientOpenStatus();
  }
}
fetchAvailability();

// Review carousel
// No fake review carousel; Yelp iframe shows live profile

// Service quiz
const quizCopy = {
  rodents: 'Rodents: traps + exclusion + sanitizing. Great for mice/rats in attic or garage.',
  insects: 'Insects: flush-out plus perimeter barrier for ants, roaches, spiders, mosquitoes, bed bugs.',
  specialty: 'Specialty: termites, bees/wasps, wildlife exclusion with photo proof of work.',
};
function setActive(group, target) {
  if (!group || !target) return;
  group.querySelectorAll('.quiz-option').forEach(btn => btn.classList.remove('active'));
  target.classList.add('active');
}
quizIssue?.addEventListener('click', (e) => {
  const btn = e.target.closest('.quiz-option');
  if (!btn) return;
  setActive(quizIssue, btn);
  const key = btn.dataset.issue;
  if (serviceInput) serviceInput.value = key || 'Service Needed';
  if (quizCopy[key?.includes('Rodent') ? 'rodents' : key?.includes('Insect') ? 'insects' : 'specialty'] && serviceBlurb) {
    const mapKey = key?.includes('Rodent') ? 'rodents' : key?.includes('Insect') ? 'insects' : 'specialty';
    serviceBlurb.textContent = quizCopy[mapKey];
  }
});
quizUrgency?.addEventListener('click', (e) => {
  const btn = e.target.closest('.quiz-option');
  if (!btn) return;
  setActive(quizUrgency, btn);
});
quizApply?.addEventListener('click', () => {
  const issueBtn = quizIssue?.querySelector('.quiz-option.active');
  const urgencyBtn = quizUrgency?.querySelector('.quiz-option.active');
  const issue = issueBtn?.dataset.issue || '';
  const urgency = urgencyBtn?.dataset.urgency || '';
  if (serviceInput && issue) serviceInput.value = issue;
  if (detailsInput) {
    const existing = (detailsInput.value || '').trim();
    const line = [issue, urgency].filter(Boolean).join(' - ');
    detailsInput.value = existing ? `${existing}\n${line}` : line;
  }
  showToast('Quiz applied to form');
});

function buildMessageEncoded() {
  const name = (nameInput?.value || '').trim();
  const phone = (phoneInput?.value || '').trim();
  const service = serviceInput?.value === 'Service Needed' ? '' : (serviceInput?.value || '').trim();
  const details = (detailsInput?.value || '').trim();
  const lines = [
    name ? `Name: ${name}` : '',
    phone ? `Phone: ${phone}` : '',
    service ? `Service: ${service}` : '',
    details ? `Details: ${details}` : ''
  ].filter(Boolean);
  return lines.join('%0A');
}
function ensureFormFields() {
  const phone = (phoneInput?.value || '').trim();
  const service = (serviceInput?.value || '').trim();
  if (!phone) { showToast('Add a phone number so we can reach you.'); phoneInput?.focus(); return false; }
  if (!service || service === 'Service Needed') { showToast('Pick a service so we route you correctly.'); serviceInput?.focus(); return false; }
  return true;
}
const showToast = (msg) => {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
};

btnText?.addEventListener('click', () => {
  if (!ensureFormFields()) return;
  const msg = buildMessageEncoded() || 'Service request';
  window.location.href = `sms:+15622775497?body=${msg}`;
});
btnEmail?.addEventListener('click', () => {
  if (!ensureFormFields()) return;
  const msg = buildMessageEncoded() || 'Service request';
  const subject = encodeURIComponent('Service Request - Snap Trap');
  const body = msg.replace(/%0A/g, '%0D%0A');
  window.location.href = `mailto:snaprodentandpest@gmail.com?subject=${subject}&body=${body}`;
});
btnSubmit?.addEventListener('click', async () => {
  if (!ensureFormFields()) return;
  const msg = buildMessageEncoded() || 'Service request';
  const subject = encodeURIComponent('Service Request - Snap Trap');
  const body = msg.replace(/%0A/g, '%0D%0A');
  showToast('Opening your email app...');
  window.location.href = `mailto:snaprodentandpest@gmail.com?subject=${subject}&body=${body}`;
});

// Repair hero accents if ever corrupted
const tagEl = document.querySelector('.tag');
if (tagEl && tagEl.textContent && tagEl.textContent.includes('’')) {
  tagEl.textContent = "Pests gone in 24 hours - re-service is free if they're not.";
}


