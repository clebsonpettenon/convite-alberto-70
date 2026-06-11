// 1) Crie um projeto gratuito no Supabase.
// 2) Cole abaixo a URL e a anon public key do seu projeto.
const SUPABASE_URL = 'https://gnjqcijxyoqtuszshivk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduanFjaWp4eW9xdHVzenNoaXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDM2MTcsImV4cCI6MjA5Njc3OTYxN30.jBpK8My2mUk30aQNuSH6-19QBKI-3Q4a8YaTvSV_OVI';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const form = document.getElementById('rsvpForm');
const message = document.getElementById('message');
const phoneInput = document.getElementById('telefone');
const quantidadeInput = document.getElementById('quantidade');
const companionsSection = document.getElementById('acompanhantes');
const companionsFields = document.getElementById('acompanhantesFields');

function maskPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : '';
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getAdditionalGuestCount() {
  const quantity = Math.max(1, Math.floor(Number(quantidadeInput.value) || 1));
  return quantity - 1;
}

function readCompanions() {
  return [...companionsFields.querySelectorAll('.companion-card')].map((card) => ({
    nome: card.querySelector('.companion-name').value.trim(),
    crianca: card.querySelector('.companion-child').checked
  }));
}

function renderCompanionFields() {
  const additionalCount = getAdditionalGuestCount();
  const previousValues = readCompanions();

  companionsSection.hidden = additionalCount === 0;
  companionsFields.innerHTML = '';

  for (let index = 0; index < additionalCount; index += 1) {
    const previous = previousValues[index] || {};
    const card = document.createElement('div');
    card.className = 'companion-card';

    const nameLabel = document.createElement('label');
    nameLabel.textContent = `Nome do acompanhante ${index + 1}`;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'companion-name';
    nameInput.required = true;
    nameInput.placeholder = 'Nome completo';
    nameInput.value = previous.nome || '';

    nameLabel.appendChild(nameInput);

    const childLabel = document.createElement('label');
    childLabel.className = 'checkbox-label';

    const childInput = document.createElement('input');
    childInput.type = 'checkbox';
    childInput.className = 'companion-child';
    childInput.checked = Boolean(previous.crianca);

    childLabel.appendChild(childInput);
    childLabel.append('Criança menor de 8 anos');

    card.append(nameLabel, childLabel);
    companionsFields.appendChild(card);
  }
}

phoneInput.addEventListener('input', () => {
  phoneInput.value = maskPhone(phoneInput.value);
});

quantidadeInput.addEventListener('input', renderCompanionFields);
quantidadeInput.addEventListener('change', () => {
  quantidadeInput.value = Math.max(1, Math.floor(Number(quantidadeInput.value) || 1));
  renderCompanionFields();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = 'Enviando...';

  const companions = readCompanions().slice(0, getAdditionalGuestCount());

  const data = {
    nome: document.getElementById('nome').value.trim(),
    telefone: phoneInput.value.trim(),
    confirmacao_presenca: document.getElementById('confirmacao_presenca').value,
    quantidade: Number(quantidadeInput.value),
    observacao: document.getElementById('observacao').value.trim(),
    acompanhantes: companions.map((person) => ({
      nome: person.nome,
      crianca_menor_8: person.crianca
    }))
  };

  const { error } = await client.from('confirmacoes').insert([data]);

  if (error) {
    console.error(error);
    message.textContent = 'Não foi possível enviar. Confira a configuração do Supabase.';
    return;
  }

  form.reset();
  quantidadeInput.value = 1;
  renderCompanionFields();
  message.textContent = 'Presença registrada com sucesso. Obrigado!';
});

renderCompanionFields();
