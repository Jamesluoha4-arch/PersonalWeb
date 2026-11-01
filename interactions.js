/* Modal focus and keyboard behavior shared by both dialogs. */
let activeDialog = null;
let returnFocus = null;
let savedOverflow = '';
function showDialog(id) {
    const modal = document.getElementById(id);
    if (!activeDialog) {
        returnFocus = document.activeElement;
        savedOverflow = document.body.style.overflow;
    } else if (activeDialog !== modal) {
        activeDialog.style.display = 'none';
        activeDialog.classList.remove('active');
    }
    activeDialog = modal;
    modal.style.display = 'block';
    modal.classList.add('active');
    modal.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    Array.from(document.body.children).forEach(element => {
        if (!element.matches('script, style, #language-toggle') && element !== modal) element.inert = true;
    });
    modal.inert = false;
    modal.querySelector('.modal-close').focus({ preventScroll: true });
}
function hideDialog(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('active');
    modal.style.display = 'none';
    activeDialog = null;
    document.body.style.overflow = savedOverflow;
    Array.from(document.body.children).forEach(element => { element.inert = false; });
    returnFocus?.focus({ preventScroll: true });
}
document.querySelectorAll('#project-modal, #resume-modal').forEach(modal => {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    const heading = modal.querySelector('h1');
    heading.id ||= 'resume-title';
    modal.setAttribute('aria-labelledby', heading.id);
});
document.querySelectorAll('.project-card, .uni-card').forEach(card => {
    card.setAttribute('role', 'button');
    if (!card.hasAttribute('tabindex')) card.tabIndex = 0;
    card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); card.click(); }
    });
});
document.addEventListener('keydown', event => {
    if (!activeDialog) return;
    if (event.key === 'Escape') { hideDialog(activeDialog.id); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...activeDialog.querySelectorAll('a[href], button, [tabindex="0"]'), document.getElementById('language-toggle')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
document.addEventListener('error', event => {
    if (!(event.target instanceof HTMLImageElement)) return;
    const fallback = document.createElement('span');
    fallback.className = 'image-error';
    fallback.textContent = 'Image unavailable';
    event.target.replaceWith(fallback);
    translatePage(fallback.parentElement || document.body);
}, true);

// Progressive enhancement: content stays visible if observers are unsupported.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const revealAnimations = new Set();
if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            revealObserver.unobserve(entry.target);
            if (motionPreference.matches) return;
            const animation = entry.target.animate([
                { opacity: .35, translate: '0 20px' },
                { opacity: 1, translate: '0 0' }
            ], { duration: 550, easing: 'cubic-bezier(.2,.7,.3,1)' });
            revealAnimations.add(animation);
            animation.finished.then(() => revealAnimations.delete(animation)).catch(() => {});
        });
    }, { threshold: .08 });
    document.querySelectorAll('.section-title, .timeline-item, .project-card, .uni-card, .contact-box').forEach(el => revealObserver.observe(el));
}
motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
        revealAnimations.forEach(animation => animation.cancel());
        revealAnimations.clear();
    }
    resetTypewriter();
});
