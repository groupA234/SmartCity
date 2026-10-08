/* ============================================================
   CONSTANTS
   ============================================================ */
var SC = {
  // sessionStorage keys
  KEYS: {
    taxType:  'sc_taxType',
    taxLabel: 'sc_taxLabel',
    period:   'sc_period',
    amount:   'sc_amount',
    ref:      'sc_ref',
    method:   'sc_method',
    methodLabel: 'sc_methodLabel',
    prn:      'sc_prn',
    prnExpiry:'sc_prnExpiry'
  },

  // Tax type metadata
  TAX_TYPES: {
    property: { label: 'Property Tax',      balance: 10000 },
    business: { label: 'Business Licence',  balance: 3800  },
    land:     { label: 'Land Rate',         balance: 6500  },
    parking:  { label: 'Parking Levy',      balance: 10000 }
  },

  // Citizen defaults (would come from a real API)
  CITIZEN: {
    name: 'James Mwangi',
    id:   'SC-2024-00482'
  }
};

/* ============================================================
   SESSION STORAGE HELPERS
   ============================================================ */
SC.save = function (key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
};

SC.load = function (key, fallback) {
  try {
    var raw = sessionStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
};

SC.savePaymentData = function (data) {
  for (var k in data) {
    if (Object.prototype.hasOwnProperty.call(data, k)) {
      SC.save(k, data[k]);
    }
  }
};

SC.loadAll = function () {
  var result = {};
  for (var k in SC.KEYS) {
    if (Object.prototype.hasOwnProperty.call(SC.KEYS, k)) {
      result[k] = SC.load(SC.KEYS[k], '');
    }
  }
  return result;
};

/* ============================================================
   PRN GENERATOR
   ============================================================ */
SC.generatePRN = function () {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var prn   = 'PRN-';
  for (var i = 0; i < 4; i++) prn += chars[Math.floor(Math.random() * chars.length)];
  prn += '-';
  for (var j = 0; j < 6; j++) prn += chars[Math.floor(Math.random() * chars.length)];
  return prn;
};

SC.formatCurrency = function (n) {
  var num = parseFloat(n) || 0;
  return 'KSh ' + num.toLocaleString('en-KE');
};

SC.formatDate = function (d) {
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
};

SC.formatDateTime = function (d) {
  var h  = d.getHours();
  var m  = ('0' + d.getMinutes()).slice(-2);
  var ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return SC.formatDate(d) + ' · ' + h + ':' + m + ' ' + ap;
};

/* ============================================================
   ACTIVE NAV HIGHLIGHT
   Sets .active on the sidebar nav-item whose href matches the
   current page filename.
   ============================================================ */
SC.highlightNav = function () {
  var page = window.location.pathname.split('/').pop() || 'dashboard.html';
  var items = document.querySelectorAll('.nav-item[data-page]');
  items.forEach(function (item) {
    var target = item.getAttribute('data-page');
    item.classList.toggle('active', page.indexOf(target) !== -1);
  });
};

/* ============================================================
   PAYMENT METHOD CARDS (payment-method.html)
   Handles selecting a method card and showing the inline form.
   ============================================================ */
SC.initMethodCards = function () {
  var cards = document.querySelectorAll('.method-card');
  if (!cards.length) return;

  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      cards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      var radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      // Show corresponding inline form
      document.querySelectorAll('.method-form').forEach(function (f) {
        f.classList.remove('active');
      });
      var formId = 'form-' + card.dataset.method;
      var form   = document.getElementById(formId);
      if (form) form.classList.add('active');
    });
  });

  // Auto-select first card
  if (cards[0]) cards[0].click();
};

/* ============================================================
   PAYMENTS FORM (payments.html)
   Reads form inputs, validates, saves to sessionStorage, then
   navigates to payment-method.html.
   ============================================================ */
SC.initPaymentsForm = function () {
  var form = document.getElementById('payments-form');
  if (!form) return;

  // Pre-fill balance when tax type changes
  var taxSelect   = document.getElementById('tax-type');
  var amountInput = document.getElementById('custom-amount');
  var balanceNote = document.getElementById('balance-note');
  var periodSel   = document.getElementById('tax-period');
  var refInput    = document.getElementById('bill-ref');

  if (taxSelect) {
    taxSelect.addEventListener('change', function () {
      var key  = taxSelect.value;
      var meta = SC.TAX_TYPES[key];
      if (meta && amountInput) {
        amountInput.value = meta.balance;
        if (balanceNote) {
          balanceNote.textContent = 'Current balance: ' + SC.formatCurrency(meta.balance);
        }
      }
      // Auto-fill ref if empty
      if (refInput && !refInput.value && key) {
        refInput.value = SC.CITIZEN.id + '-' + key.toUpperCase().slice(0,2);
      }
    });
  }

  // Amount quick-select radios
  var radios = form.querySelectorAll('input[name="amount-preset"]');
  radios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.value !== 'custom' && amountInput) {
        amountInput.value = radio.value;
      }
      if (amountInput) amountInput.disabled = (radio.value !== 'custom');
    });
  });

  // Slip preview update
  var slipFields = {
    'slip-taxtype': taxSelect,
    'slip-period':  periodSel,
    'slip-amount':  amountInput,
    'slip-ref':     refInput
  };

  function updateSlip () {
    for (var id in slipFields) {
      var el  = document.getElementById(id);
      var src = slipFields[id];
      if (el && src) {
        if (id === 'slip-amount') {
          el.textContent = SC.formatCurrency(src.value || 0);
        } else if (src.tagName === 'SELECT') {
          el.textContent = src.options[src.selectedIndex] ? src.options[src.selectedIndex].text : '—';
        } else {
          el.textContent = src.value || '—';
        }
      }
    }
  }

  if (taxSelect)  taxSelect.addEventListener('change', updateSlip);
  if (periodSel)  periodSel.addEventListener('change', updateSlip);
  if (amountInput) amountInput.addEventListener('input', updateSlip);
  if (refInput)   refInput.addEventListener('input', updateSlip);
  updateSlip();

  // Submit → navigate to payment-method.html
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var taxKey  = taxSelect   ? taxSelect.value   : '';
    var period  = periodSel   ? periodSel.value   : '';
    var amount  = amountInput ? amountInput.value  : '0';
    var ref     = refInput    ? refInput.value     : '';

    if (!taxKey) { SC.showError('Please select a tax type.'); return; }
    if (!period) { SC.showError('Please select the tax period.'); return; }
    if (!amount || parseFloat(amount) < 100) { SC.showError('Please enter an amount of at least KSh 100.'); return; }
    if (!ref)    { SC.showError('Please enter a reference / bill number.'); return; }

    var meta = SC.TAX_TYPES[taxKey] || {};

    SC.savePaymentData({
      sc_taxType:  taxKey,
      sc_taxLabel: meta.label || taxKey,
      sc_period:   period,
      sc_amount:   amount,
      sc_ref:      ref
    });

    window.location.href = 'payment-method.html';
  });
};

/* ============================================================
   PAYMENT METHOD PAGE (payment-method.html)
   Reads saved data to populate summary; handles method
   selection and submission to confirmation.html.
   ============================================================ */
SC.initMethodPage = function () {
  var data = SC.loadAll();

  // Populate summary sidebar
  SC.setText('sum-taxtype', data.taxLabel || '—');
  SC.setText('sum-period',  data.period   || '—');
  SC.setText('sum-ref',     data.ref      || '—');
  SC.setText('sum-amount',  SC.formatCurrency(data.amount));
  SC.setText('sum-total',   SC.formatCurrency(data.amount));

  SC.initMethodCards();

  var btn = document.getElementById('proceed-confirm-btn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var selected = document.querySelector('.method-card.selected');
    if (!selected) { SC.showError('Please choose a payment method.'); return; }

    var methodKey   = selected.dataset.method;
    var methodLabel = (selected.querySelector('.method-card__name') || {}).textContent || methodKey;

    // Validate method-specific fields
    if (methodKey === 'card') {
      var cn = document.getElementById('card-number');
      var ex = document.getElementById('card-expiry');
      var cv = document.getElementById('card-cvv');
      if (!cn || !cn.value.replace(/\s/g,'') || cn.value.replace(/\s/g,'').length < 15) {
        SC.showError('Please enter a valid card number.'); return;
      }
      if (!ex || !ex.value.match(/^\d{2}\/\d{2}$/)) {
        SC.showError('Please enter a valid expiry date (MM/YY).'); return;
      }
      if (!cv || cv.value.length < 3) {
        SC.showError('Please enter a valid CVV.'); return;
      }
    }

    if (methodKey === 'mpesa') {
      var ph = document.getElementById('mpesa-phone');
      if (!ph || !ph.value.match(/^\+?[0-9]{9,13}$/)) {
        SC.showError('Please enter a valid M-Pesa phone number.'); return;
      }
    }

    if (methodKey === 'bank') {
      var br = document.getElementById('bank-ref');
      if (!br || !br.value.trim()) {
        SC.showError('Please enter your bank transfer reference.'); return;
      }
    }

    SC.savePaymentData({
      sc_method:      methodKey,
      sc_methodLabel: methodLabel
    });

    window.location.href = 'confirmation.html';
  });
};

/* ============================================================
   CONFIRMATION PAGE (confirmation.html)
   Generates PRN, populates all confirm rows, handles confirm.
   ============================================================ */
SC.initConfirmPage = function () {
  var data = SC.loadAll();

  // Generate a PRN if none exists yet
  var prn = data.prn || SC.generatePRN();
  var now  = new Date();
  var exp  = new Date(now.getTime() + 30 * 60 * 1000); // 30 min expiry

  SC.save(SC.KEYS.prn,       prn);
  SC.save(SC.KEYS.prnExpiry, exp.toISOString());

  // Populate confirm details
  SC.setText('conf-taxtype',     data.taxLabel || '—');
  SC.setText('conf-period',      data.period   || '—');
  SC.setText('conf-ref',         data.ref      || '—');
  SC.setText('conf-method',      data.methodLabel || data.method || '—');
  SC.setText('conf-amount',      SC.formatCurrency(data.amount));
  SC.setText('conf-fee',         'KSh 0');
  SC.setText('conf-total',       SC.formatCurrency(data.amount));
  SC.setText('conf-citizen',     SC.CITIZEN.name);
  SC.setText('conf-citizen-id',  SC.CITIZEN.id);
  SC.setText('conf-date',        SC.formatDateTime(now));

  // PRN box
  SC.setText('prn-code',   prn);
  SC.setText('prn-expiry', 'Valid until ' + SC.formatDateTime(exp));

  // PRN countdown
  SC.startPrnCountdown(exp);

  // Summary sidebar
  SC.setText('sum-taxtype',    data.taxLabel || '—');
  SC.setText('sum-period',     data.period   || '—');
  SC.setText('sum-ref',        data.ref      || '—');
  SC.setText('sum-method',     data.methodLabel || data.method || '—');
  SC.setText('sum-amount',     SC.formatCurrency(data.amount));
  SC.setText('sum-total',      SC.formatCurrency(data.amount));

  var btn = document.getElementById('confirm-pay-btn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    btn.disabled = true;
    btn.textContent = 'Processing…';
    // Simulate short processing delay then navigate
    setTimeout(function () {
      window.location.href = 'receipt.html';
    }, 1600);
  });
};

SC.startPrnCountdown = function (expDate) {
  var el = document.getElementById('prn-countdown');
  if (!el) return;

  function tick () {
    var diff = Math.max(0, expDate - Date.now());
    var mins = Math.floor(diff / 60000);
    var secs = Math.floor((diff % 60000) / 1000);
    el.textContent = 'Expires in ' + mins + ':' + ('0' + secs).slice(-2);
    if (diff > 0) requestAnimationFrame(tick);
    else el.textContent = 'PRN Expired';
  }
  tick();
};

/* ============================================================
   RECEIPT PAGE (receipt.html)
   Populates receipt from sessionStorage.
   ============================================================ */
SC.initReceiptPage = function () {
  var data = SC.loadAll();
  var now  = new Date();

  // Receipt number = PRN + date stamp
  var receiptNo = 'RCP-' + now.getFullYear()
    + ('0'+(now.getMonth()+1)).slice(-2)
    + ('0'+now.getDate()).slice(-2)
    + '-' + Math.floor(Math.random() * 900 + 100);

  SC.setText('rcp-no',          receiptNo);
  SC.setText('rcp-date',        SC.formatDateTime(now));
  SC.setText('rcp-citizen',     SC.CITIZEN.name);
  SC.setText('rcp-citizen-id',  SC.CITIZEN.id);
  SC.setText('rcp-taxtype',     data.taxLabel || '—');
  SC.setText('rcp-period',      data.period   || '—');
  SC.setText('rcp-ref',         data.ref      || '—');
  SC.setText('rcp-method',      data.methodLabel || data.method || '—');
  SC.setText('rcp-prn',         data.prn || '—');
  SC.setText('rcp-amount',      SC.formatCurrency(data.amount));
  SC.setText('rcp-fee',         'KSh 0');
  SC.setText('rcp-total',       SC.formatCurrency(data.amount));

  // Also set the receipt number in the header element if present
  SC.setText('rcp-header-no', receiptNo);

  // Print button
  var printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', function () { window.print(); });
  }

  // Download as text (simple fallback – no library needed)
  var dlBtn = document.getElementById('download-btn');
  if (dlBtn) {
    dlBtn.addEventListener('click', function () {
      SC.downloadReceipt(data, receiptNo, now);
    });
  }
};

SC.downloadReceipt = function (data, receiptNo, date) {
  var lines = [
    '========================================',
    '     SMARTCITIES TAX PAYMENT RECEIPT   ',
    '========================================',
    '',
    'Receipt No.   : ' + receiptNo,
    'Date & Time   : ' + SC.formatDateTime(date),
    '',
    '--- TAXPAYER ---',
    'Name          : ' + SC.CITIZEN.name,
    'Citizen ID    : ' + SC.CITIZEN.id,
    '',
    '--- PAYMENT DETAILS ---',
    'Tax Category  : ' + (data.taxLabel || '—'),
    'Tax Period    : ' + (data.period   || '—'),
    'Bill Ref      : ' + (data.ref      || '—'),
    'Payment Method: ' + (data.methodLabel || data.method || '—'),
    'PRN           : ' + (data.prn      || '—'),
    '',
    '--- AMOUNTS ---',
    'Amount        : ' + SC.formatCurrency(data.amount),
    'Processing Fee: KSh 0',
    'TOTAL PAID    : ' + SC.formatCurrency(data.amount),
    '',
    '========================================',
    'Thank you for paying your taxes.',
    'SmartCities – City Revenue Service',
    '========================================'
  ];

  var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = receiptNo + '.txt';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
};

/* ============================================================
   UTILITIES
   ============================================================ */
SC.setText = function (id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
};

SC.showError = function (msg) {
  var existing = document.getElementById('sc-error-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'sc-error-toast';
  toast.style.cssText = [
    'position:fixed', 'bottom:24px', 'right:24px', 'z-index:9999',
    'background:#e53e3e', 'color:#fff', 'padding:12px 20px',
    'border-radius:10px', 'font-size:.9rem', 'font-weight:600',
    'box-shadow:0 4px 20px rgba(0,0,0,.18)', 'max-width:340px',
    'transition:opacity .3s'
  ].join(';');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = '0';
    setTimeout(function () { toast.remove(); }, 300);
  }, 4000);
};

SC.showSuccess = function (msg) {
  var existing = document.getElementById('sc-success-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'sc-success-toast';
  toast.style.cssText = [
    'position:fixed', 'bottom:24px', 'right:24px', 'z-index:9999',
    'background:#1dbf73', 'color:#fff', 'padding:12px 20px',
    'border-radius:10px', 'font-size:.9rem', 'font-weight:600',
    'box-shadow:0 4px 20px rgba(0,0,0,.18)', 'max-width:340px'
  ].join(';');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3500);
};

/* ============================================================
   CARD NUMBER FORMATTING (auto-spaces every 4 digits)
   ============================================================ */
SC.initCardFormatting = function () {
  var cn = document.getElementById('card-number');
  if (!cn) return;
  cn.addEventListener('input', function () {
    var v = cn.value.replace(/\D/g, '').slice(0, 16);
    cn.value = v.match(/.{1,4}/g) ? v.match(/.{1,4}/g).join(' ') : v;
  });

  var ex = document.getElementById('card-expiry');
  if (ex) {
    ex.addEventListener('input', function () {
      var v = ex.value.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
      ex.value = v;
    });
  }
};

/* ============================================================
   BOOT – auto-run page-specific init on DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  SC.highlightNav();

  var page = window.location.pathname.split('/').pop();

  if (page === 'payments.html')        SC.initPaymentsForm();
  if (page === 'payment-method.html')  { SC.initMethodPage(); SC.initCardFormatting(); }
  if (page === 'confirmation.html')    SC.initConfirmPage();
  if (page === 'receipt.html')         SC.initReceiptPage();
});
