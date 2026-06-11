const SUPABASE_URL = 'https://gnjqcijxyoqtuszshivk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduanFjaWp4eW9xdHVzenNoaXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDM2MTcsImV4cCI6MjA5Njc3OTYxN30.jBpK8My2mUk30aQNuSH6-19QBKI-3Q4a8YaTvSV_OVI';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const loginPanel = document.getElementById('loginPanel');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const adminMessage = document.getElementById('adminMessage');
const adminUser = document.getElementById('adminUser');
const tableBody = document.getElementById('confirmationsTable');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const costInputs = ['adultCost', 'childCost', 'fixedCost'].map((id) => document.getElementById(id));

let confirmations = [];
let summary = {
  totalPeople: 0,
  adultPeople: 0,
  childPeople: 0,
  confirmedGroups: 0,
  declinedGroups: 0,
  missingDetails: 0
};

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function getQuantity(row) {
  return Math.max(1, Number(row.quantidade) || 1);
}

function isChild(person) {
  return Boolean(person.crianca_menor_8 ?? person.crianca);
}

function normalizeCompanions(row) {
  let companions = row.acompanhantes || [];

  if (typeof companions === 'string') {
    try {
      companions = JSON.parse(companions);
    } catch (_error) {
      companions = [];
    }
  }

  if (!Array.isArray(companions)) return [];

  return companions.map((person, index) => ({
    nome: person.nome || `Acompanhante ${index + 1}`,
    crianca_menor_8: isChild(person)
  }));
}

function getChildCount(row) {
  return normalizeCompanions(row).filter((person) => person.crianca_menor_8).length;
}

function getAdultCount(row) {
  return Math.max(0, getQuantity(row) - getChildCount(row));
}

function calculateSummary(rows) {
  const attending = rows.filter((row) => row.confirmacao_presenca === 'sim');
  const declined = rows.filter((row) => row.confirmacao_presenca === 'nao');

  return attending.reduce((totals, row) => {
    const quantity = getQuantity(row);
    const companions = normalizeCompanions(row);
    const children = companions.filter((person) => person.crianca_menor_8).length;
    const expectedCompanions = Math.max(0, quantity - 1);

    totals.totalPeople += quantity;
    totals.childPeople += children;
    totals.adultPeople += Math.max(0, quantity - children);
    totals.missingDetails += Math.max(0, expectedCompanions - companions.length);

    return totals;
  }, {
    totalPeople: 0,
    adultPeople: 0,
    childPeople: 0,
    confirmedGroups: attending.length,
    declinedGroups: declined.length,
    missingDetails: 0
  });
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function renderSummary() {
  setText('totalPeople', summary.totalPeople);
  setText('adultPeople', summary.adultPeople);
  setText('childPeople', summary.childPeople);
  setText('confirmedGroups', summary.confirmedGroups);
  setText('declinedGroups', summary.declinedGroups);
  setText('missingDetails', summary.missingDetails);
}

function getCostValues() {
  return {
    adultCost: Number(document.getElementById('adultCost').value) || 0,
    childCost: Number(document.getElementById('childCost').value) || 0,
    fixedCost: Number(document.getElementById('fixedCost').value) || 0
  };
}

function saveCostValues() {
  localStorage.setItem('adminCostValues', JSON.stringify(getCostValues()));
}

function loadCostValues() {
  let saved = {};

  try {
    saved = JSON.parse(localStorage.getItem('adminCostValues') || '{}');
  } catch (_error) {
    saved = {};
  }

  document.getElementById('adultCost').value = saved.adultCost || '';
  document.getElementById('childCost').value = saved.childCost || '';
  document.getElementById('fixedCost').value = saved.fixedCost || '';
}

function renderCost() {
  const { adultCost, childCost, fixedCost } = getCostValues();
  const total = (summary.adultPeople * adultCost) + (summary.childPeople * childCost) + fixedCost;

  document.getElementById('estimatedCost').textContent = formatCurrency(total);
  document.getElementById('costBreakdown').textContent = [
    `${summary.adultPeople} adulto(s)/8+ x ${formatCurrency(adultCost)}`,
    `${summary.childPeople} criança(s) < 8 x ${formatCurrency(childCost)}`,
    `fixo ${formatCurrency(fixedCost)}`
  ].join(' + ');
}

function getVisibleRows() {
  const search = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  return confirmations.filter((row) => {
    const companions = normalizeCompanions(row).map((person) => person.nome).join(' ');
    const haystack = [
      row.nome,
      row.telefone,
      row.observacao,
      companions
    ].join(' ').toLowerCase();

    return (status === 'todos' || row.confirmacao_presenca === status) &&
      (!search || haystack.includes(search));
  });
}

function appendCell(row, value, className) {
  const cell = document.createElement('td');
  cell.textContent = value === undefined || value === null || value === '' ? '-' : value;
  if (className) cell.className = className;
  row.appendChild(cell);
  return cell;
}

function renderCompanionCell(row, companions) {
  const cell = document.createElement('td');

  if (!companions.length) {
    cell.textContent = '-';
    row.appendChild(cell);
    return;
  }

  companions.forEach((person) => {
    const item = document.createElement('div');
    item.textContent = `${person.nome} (${person.crianca_menor_8 ? 'criança < 8' : 'adulto/8+'})`;
    cell.appendChild(item);
  });

  row.appendChild(cell);
}

function renderTable() {
  const rows = getVisibleRows();
  tableBody.innerHTML = '';

  if (!rows.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 9;
    cell.textContent = 'Nenhuma confirmação encontrada.';
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  rows.forEach((item) => {
    const row = document.createElement('tr');
    const companions = normalizeCompanions(item);
    const statusText = item.confirmacao_presenca === 'sim' ? 'Confirmado' : 'Não vai';

    appendCell(row, formatDate(item.created_at));
    appendCell(row, item.nome);
    appendCell(row, item.telefone);
    appendCell(row, statusText, item.confirmacao_presenca === 'sim' ? 'status-yes' : 'status-no');
    appendCell(row, getQuantity(item));
    appendCell(row, item.confirmacao_presenca === 'sim' ? getAdultCount(item) : 0);
    appendCell(row, item.confirmacao_presenca === 'sim' ? getChildCount(item) : 0);
    renderCompanionCell(row, companions);
    appendCell(row, item.observacao);

    tableBody.appendChild(row);
  });
}

function renderAll() {
  summary = calculateSummary(confirmations);
  renderSummary();
  renderCost();
  renderTable();
}

async function loadConfirmations() {
  adminMessage.textContent = 'Carregando confirmações...';

  const { data, error } = await client
    .from('confirmacoes')
    .select('id, created_at, nome, telefone, confirmacao_presenca, quantidade, observacao, acompanhantes')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    adminMessage.textContent = 'Não foi possível carregar. Confira se o SQL foi executado e se seu e-mail está em admin_usuarios.';
    return;
  }

  confirmations = data || [];
  adminMessage.textContent = `Atualizado em ${formatDate(new Date().toISOString())}.`;
  renderAll();
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function exportCsv() {
  const rows = getVisibleRows();
  const header = [
    'Data',
    'Nome',
    'Telefone',
    'Status',
    'Quantidade',
    'Adultos ou 8+',
    'Criancas menores de 8',
    'Acompanhantes',
    'Observacao'
  ];

  const lines = rows.map((row) => {
    const companions = normalizeCompanions(row)
      .map((person) => `${person.nome} (${person.crianca_menor_8 ? 'criança < 8' : 'adulto/8+'})`)
      .join('; ');

    return [
      formatDate(row.created_at),
      row.nome,
      row.telefone,
      row.confirmacao_presenca === 'sim' ? 'Confirmado' : 'Não vai',
      getQuantity(row),
      row.confirmacao_presenca === 'sim' ? getAdultCount(row) : 0,
      row.confirmacao_presenca === 'sim' ? getChildCount(row) : 0,
      companions,
      row.observacao
    ].map(csvEscape).join(',');
  });

  const csv = `\uFEFF${[header.map(csvEscape).join(','), ...lines].join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'confirmacoes-alberto-70.csv';
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

async function showSession(session) {
  const signedIn = Boolean(session);
  loginPanel.hidden = signedIn;
  dashboard.hidden = !signedIn;

  if (!signedIn) return;

  adminUser.textContent = `Logado como ${session.user.email}`;
  loadCostValues();
  await loadConfirmations();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = 'Entrando...';

  const { error } = await client.auth.signInWithPassword({
    email: document.getElementById('adminEmail').value.trim(),
    password: document.getElementById('adminPassword').value
  });

  if (error) {
    console.error(error);
    loginMessage.textContent = 'Não foi possível entrar. Confira e-mail, senha e liberação de administrador.';
    return;
  }

  loginMessage.textContent = '';
});

document.getElementById('logoutButton').addEventListener('click', async () => {
  await client.auth.signOut();
  confirmations = [];
  renderAll();
});

document.getElementById('refreshButton').addEventListener('click', loadConfirmations);
document.getElementById('exportButton').addEventListener('click', exportCsv);
searchInput.addEventListener('input', renderTable);
statusFilter.addEventListener('change', renderTable);
costInputs.forEach((input) => {
  input.addEventListener('input', () => {
    saveCostValues();
    renderCost();
  });
});

client.auth.onAuthStateChange((_event, session) => {
  showSession(session);
});

client.auth.getSession().then(({ data }) => {
  showSession(data.session);
});
