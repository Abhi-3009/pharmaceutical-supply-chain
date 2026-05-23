/**
 * Pharma Supply Chain — Frontend Application Logic
 * Connects to the Express API and drives the dashboard UI.
 */

const API = '';  // Same origin

// ======================== TOAST NOTIFICATIONS ========================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ======================== TAB NAVIGATION ========================
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    // Load data for the activated tab
    const tabName = tab.dataset.tab;
    if (tabName === 'drugs') loadDrugs();
    else if (tabName === 'shipments') loadShipments();
    else if (tabName === 'ledger') loadLedger();
  });
});

// ======================== STATS ========================
async function refreshStats() {
  try {
    const [drugsRes, shipmentsRes, ledgerRes, verifyRes] = await Promise.all([
      fetch(`${API}/drugs`).then(r => r.json()),
      fetch(`${API}/shipments`).then(r => r.json()),
      fetch(`${API}/ledger`).then(r => r.json()),
      fetch(`${API}/verify`).then(r => r.json()),
    ]);
    document.getElementById('statDrugs').textContent = drugsRes.count || 0;
    document.getElementById('statShipments').textContent = shipmentsRes.count || 0;
    document.getElementById('statBlocks').textContent = ledgerRes.totalBlocks || 0;
    const chainEl = document.getElementById('statChain');
    if (verifyRes.verification && verifyRes.verification.valid) {
      chainEl.textContent = '✅';
      chainEl.title = 'Chain integrity verified';
    } else {
      chainEl.textContent = '❌';
      chainEl.title = 'Tampering detected!';
    }
  } catch (e) {
    console.error('Failed to refresh stats:', e);
  }
}

// ======================== DRUG MANAGEMENT ========================
document.getElementById('drugForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById('drugName').value.trim(),
    manufacturer: document.getElementById('drugMfg').value.trim(),
    batchId: document.getElementById('drugBatch').value.trim(),
    expiryDate: document.getElementById('drugExpiry').value,
    description: document.getElementById('drugDesc').value.trim(),
  };
  try {
    const res = await fetch(`${API}/drugs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Drug "${body.name}" registered (Block #${data.ledgerBlock.index})`, 'success');
      e.target.reset();
      loadDrugs();
      refreshStats();
    } else {
      showToast(data.error || 'Failed to register drug', 'error');
    }
  } catch (err) {
    showToast('Network error — is the server running?', 'error');
  }
});

async function loadDrugs() {
  try {
    const res = await fetch(`${API}/drugs`);
    const data = await res.json();
    const container = document.getElementById('drugList');
    if (!data.drugs || data.drugs.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icon">💊</div><p>No drugs registered yet</p></div>';
      return;
    }
    container.innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr><th>Name</th><th>Manufacturer</th><th>Batch</th><th>Expiry</th><th>Status</th></tr></thead>
          <tbody>${data.drugs.map(d => `
            <tr>
              <td style="color:var(--text-primary);font-weight:500">
                ${esc(d.name)}
                <div style="font-size:.7rem;color:var(--text-muted);font-family:monospace;margin-top:2px">${d.id}</div>
              </td>
              <td>${esc(d.manufacturer)}</td>
              <td><code style="color:var(--accent-indigo-light);font-size:.8rem">${esc(d.batchId)}</code></td>
              <td>${d.expiryDate}</td>
              <td><span class="badge badge-${d.status}">${d.status}</span></td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>`;
  } catch (e) {
    showToast('Failed to load drugs', 'error');
  }
}

// ======================== SHIPMENT MANAGEMENT ========================
let currentShipment = null;

document.getElementById('shipmentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    drugId: document.getElementById('shipDrugId').value.trim(),
    drugName: document.getElementById('shipDrugName').value.trim(),
    origin: document.getElementById('shipOrigin').value.trim(),
    destination: document.getElementById('shipDest').value.trim(),
    quantity: parseInt(document.getElementById('shipQty').value) || 1,
  };
  try {
    const res = await fetch(`${API}/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Shipment created (Block #${data.ledgerBlock.index})`, 'success');
      e.target.reset();
      loadShipments();
      refreshStats();
      document.getElementById('statusUpdateCard').style.display = 'block';
    } else {
      showToast(data.error || 'Failed to create shipment', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
});

async function loadShipments() {
  try {
    const res = await fetch(`${API}/shipments`);
    const data = await res.json();
    const container = document.getElementById('shipmentList');
    document.getElementById('statusUpdateCard').style.display =
      (data.shipments && data.shipments.length > 0) ? 'block' : 'none';
    if (!data.shipments || data.shipments.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icon">📦</div><p>No shipments created yet</p></div>';
      return;
    }
    container.innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr><th>Drug</th><th>Origin</th><th>Destination</th><th>Qty</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${data.shipments.map(s => `
            <tr>
              <td style="color:var(--text-primary);font-weight:500">${esc(s.drugName)}</td>
              <td>${esc(s.origin)}</td>
              <td>${esc(s.destination)}</td>
              <td>${s.quantity}</td>
              <td><span class="badge badge-${s.status}">${s.status}</span></td>
              <td><button class="btn btn-sm btn-primary" onclick="viewShipment('${s.id}')">View</button></td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>`;
  } catch (e) {
    showToast('Failed to load shipments', 'error');
  }
}

async function viewShipment(id) {
  try {
    const res = await fetch(`${API}/shipments/${id}`);
    const data = await res.json();
    if (!res.ok) { showToast('Shipment not found', 'error'); return; }
    currentShipment = data.shipment;
    const s = data.shipment;
    document.getElementById('shipmentModalBody').innerHTML = `
      <div style="margin-bottom:16px">
        <p style="font-size:.8rem;color:var(--text-muted);margin-bottom:4px">ID</p>
        <code style="font-size:.75rem;color:var(--accent-indigo-light)">${s.id}</code>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div><p style="font-size:.8rem;color:var(--text-muted)">Drug</p><p style="font-weight:600">${esc(s.drugName)}</p></div>
        <div><p style="font-size:.8rem;color:var(--text-muted)">Status</p><p><span class="badge badge-${s.status}">${s.status}</span></p></div>
        <div><p style="font-size:.8rem;color:var(--text-muted)">Origin</p><p>${esc(s.origin)}</p></div>
        <div><p style="font-size:.8rem;color:var(--text-muted)">Destination</p><p>${esc(s.destination)}</p></div>
      </div>
      <p style="font-size:.85rem;font-weight:600;margin-bottom:8px">Status History</p>
      <div class="timeline">${s.statusHistory.map(h => `
        <div class="timeline-item">
          <div class="timeline-status">${h.status}</div>
          <div class="timeline-meta">📍 ${esc(h.location)} · ${new Date(h.timestamp).toLocaleString()}</div>
        </div>
      `).join('')}</div>`;
    document.getElementById('shipmentModal').style.display = 'flex';
  } catch (e) {
    showToast('Failed to load shipment', 'error');
  }
}

function selectShipmentForUpdate() {
  if (currentShipment) {
    document.getElementById('statusShipId').value = currentShipment.id;
    closeModal();
    document.getElementById('statusUpdateCard').scrollIntoView({ behavior: 'smooth' });
  }
}

function closeModal() {
  document.getElementById('shipmentModal').style.display = 'none';
}

document.getElementById('statusForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('statusShipId').value.trim();
  const body = {
    status: document.getElementById('statusValue').value,
    location: document.getElementById('statusLocation').value.trim(),
  };
  try {
    const res = await fetch(`${API}/shipments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Status → ${body.status} (Block #${data.ledgerBlock.index})`, 'success');
      e.target.reset();
      loadShipments();
      refreshStats();
    } else {
      showToast(data.error || 'Failed to update status', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
});

// ======================== VERIFICATION ========================
async function verifyChain() {
  const btn = document.getElementById('verifyBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Verifying...';
  try {
    const res = await fetch(`${API}/verify`);
    const data = await res.json();
    const v = data.verification;
    const container = document.getElementById('verifyResult');
    if (v.valid) {
      container.innerHTML = `
        <div class="verify-result verify-valid">
          <div class="verify-icon">✅</div>
          <div class="verify-title">Supply Chain Integrity Verified</div>
          <div class="verify-detail">All ${v.totalBlocks} blocks are valid — no tampering detected</div>
        </div>`;
    } else {
      container.innerHTML = `
        <div class="verify-result verify-invalid">
          <div class="verify-icon">🚨</div>
          <div class="verify-title">ALERT: Tampering Detected!</div>
          <div class="verify-detail">Invalid blocks: ${v.invalidBlocks.join(', ')} out of ${v.totalBlocks} total blocks</div>
        </div>`;
    }
    refreshStats();
  } catch (e) {
    showToast('Verification failed — server error', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔍 Verify Chain Integrity';
  }
}

// ======================== LEDGER ========================
async function loadLedger() {
  try {
    const res = await fetch(`${API}/ledger`);
    const data = await res.json();
    const container = document.getElementById('ledgerView');
    if (!data.chain || data.chain.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icon">🔗</div><p>Ledger is empty</p></div>';
      return;
    }
    container.innerHTML = `<div class="chain-container">${data.chain.map(b => `
      <div class="chain-block">
        <div class="chain-block-index">Block #${b.index}</div>
        <div class="chain-block-type">${esc(b.data.type || 'DATA')}</div>
        <div style="font-size:.75rem;color:var(--text-muted)">${new Date(b.timestamp).toLocaleString()}</div>
        <div class="chain-block-hash"><span>Hash:</span> ${b.hash.substring(0, 32)}...</div>
        <div class="chain-block-hash"><span>Prev:</span> ${b.previousHash.substring(0, 32)}${b.previousHash.length > 32 ? '...' : ''}</div>
      </div>
    `).join('')}</div>`;
  } catch (e) {
    showToast('Failed to load ledger', 'error');
  }
}

// ======================== UTILITIES ========================
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Close modal on overlay click
document.getElementById('shipmentModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// ======================== INIT ========================
document.addEventListener('DOMContentLoaded', () => {
  refreshStats();
  loadDrugs();
});
