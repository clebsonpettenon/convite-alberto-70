// 1) Crie um projeto gratuito no Supabase.
// 2) Cole abaixo a URL e a anon public key do seu projeto.
const SUPABASE_URL = 'https://gnjqcijxyoqtuszshivk.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduanFjaWp4eW9xdHVzenNoaXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDM2MTcsImV4cCI6MjA5Njc3OTYxN30.jBpK8My2mUk30aQNuSH6-19QBKI-3Q4a8YaTvSV_OVI';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const form = document.getElementById('rsvpForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = 'Enviando...';

  const data = {
    nome: document.getElementById('nome').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    confirmacao_presenca: document.getElementById('confirmacao_presenca').value,
    quantidade: Number(document.getElementById('quantidade').value),
    observacao: document.getElementById('observacao').value.trim()
  };

  const { error } = await client.from('confirmacoes').insert([data]);

  if (error) {
    console.error(error);
    message.textContent = 'Não foi possível enviar. Confira a configuração do Supabase.';
    return;
  }

  form.reset();
  document.getElementById('quantidade').value = 1;
  message.textContent = 'Presença registrada com sucesso. Obrigado!';
});
