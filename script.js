// ====== CONFIGURACIÓN ======
// Número de WhatsApp de TurnoCerca (con código de país, sin + ni espacios).
const WHATSAPP_NEGOCIO = '573336498017';
// URL del webhook (Make, n8n o tu propio servidor) que envía el WhatsApp automático.
// Mientras esté vacío, la página funciona en modo demostración.
const WEBHOOK_URL = 'https://hook.us2.make.com/ohpotab5ptim6buzexejqrzstrxrlkhh';
// ===========================

const form = document.querySelector('#booking-form');
const timeInput = document.querySelector('#time');
const dateInput = document.querySelector('#date');
const dialog = document.querySelector('#confirmation-dialog');
const confirmationText = document.querySelector('#confirmation-text');
const whatsappLink = document.querySelector('#whatsapp-link');
const submitButton = form.querySelector('.booking-button');
 
const pad = (n) => String(n).padStart(2, '0');
const toLocalISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
 
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
dateInput.min = toLocalISO(tomorrow);
dateInput.value = toLocalISO(tomorrow);
 
// Número colombiano: 10 dígitos que empiezan por 3 -> se le agrega 57.
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`;
  if (digits.length === 12 && digits.startsWith('57')) return digits;
  return null;
}
 
document.querySelectorAll('.time-slot').forEach((slot) => {
  slot.addEventListener('click', () => {
    document.querySelectorAll('.time-slot').forEach((button) => {
      button.classList.remove('selected');
      button.setAttribute('aria-pressed', 'false');
    });
    slot.classList.add('selected');
    slot.setAttribute('aria-pressed', 'true');
    timeInput.value = slot.dataset.time;
  });
});
 
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
 
  const phone = normalizePhone(document.querySelector('#phone').value);
  if (!phone) {
    document.querySelector('#phone').setCustomValidity('Escribe un celular colombiano de 10 dígitos.');
    document.querySelector('#phone').reportValidity();
    document.querySelector('#phone').setCustomValidity('');
    return;
  }
 
  const name = document.querySelector('#name').value.trim();
  const business = document.querySelector('#business').value;
  const service = document.querySelector('#service').value;
  const friendlyDate = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date(`${dateInput.value}T12:00:00`));
  const time = timeInput.value;
  const [hh, mm] = time.split(':').map(Number);
  const timeLabel = `${hh % 12 || 12}:${pad(mm)} ${hh < 12 ? 'a. m.' : 'p. m.'}`;
 
  const message = `Hola ${name}, tu reserva de ${service} en ${business} para el ${friendlyDate} a las ${timeLabel} quedó registrada. Gracias por usar TurnoCerca.`;
 
  submitButton.disabled = true;
  whatsappLink.hidden = true;
 
  if (WEBHOOK_URL) {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, business, service, date: dateInput.value, friendlyDate, time, timeLabel, message }),
      });
      if (!response.ok) throw new Error(response.status);
      confirmationText.textContent = `${service} en ${business}, el ${friendlyDate} a las ${time}. Enviamos la confirmación al WhatsApp +${phone}.`;
    } catch {
      confirmationText.textContent = 'Tu reserva quedó guardada, pero no pudimos enviar el WhatsApp. Escríbenos y la confirmamos contigo.';
    }
  } else {
    // Modo demostración: sin servidor no se puede enviar solo, así que
    // se ofrece abrir WhatsApp con la reserva ya escrita.
    const summary = `Hola TurnoCerca, soy ${name}. Quiero reservar ${service} en ${business} para el ${friendlyDate} a las ${time}. Mi WhatsApp: +${phone}.`;
    whatsappLink.href = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(summary)}`;
    whatsappLink.hidden = false;
    confirmationText.textContent = `${service} en ${business}, el ${friendlyDate} a las ${time}. Toca el botón para enviarnos la reserva por WhatsApp.`;
  }
 
  submitButton.disabled = false;
  dialog.showModal();
  if (navigator.vibrate) navigator.vibrate(12);
});
 
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#done-button').addEventListener('click', () => dialog.close());
 
// Enlace de contacto con el mismo número configurado arriba.
document.querySelector('#contact-whatsapp').href =
  `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent('Hola TurnoCerca, quiero más información')}`;
 