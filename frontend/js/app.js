import { carregarDados, plano2027, getTextoDia } from './data.js';

const API_BASE = 'https://biblicalyear.onrender.com/api';
let token = localStorage.getItem('token');
let isCadastro = false;

let estado = {
  diasLidos: new Set(),
  mesesVerificados: new Set(),
  marcacoes: new Map(), // Chave: "Livro-Capítulo-Versículo", Valor: "cor"
  mesAtual: null,
  diaAtual: null
};

// Variável para guardar o versículo que está sendo marcado
let selecaoAtual = null; 

const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ==========================================
// LÓGICA DE SELEÇÃO E MARCAÇÃO
// ==========================================

document.addEventListener('mouseup', (e) => {
  // Se o mouse foi solto dentro do conteúdo de leitura
  const menu = document.getElementById('menu-marcacao');
  if (e.target.closest('#leitura-conteudo')) {
    setTimeout(() => {
      const selecao = window.getSelection();
      if (selecao.toString().trim().length > 0) {
        // Pega o versículo onde o texto foi selecionado
        const versiculoElement = selecao.anchorNode.parentElement.closest('.versiculo');
        if (versiculoElement) {
          selecaoAtual = {
            livro: versiculoElement.dataset.livro,
            capitulo: versiculoElement.dataset.capitulo,
            versiculo: versiculoElement.dataset.versiculo
          };

          // Posiciona o menu flutuante perto do mouse
          menu.style.display = 'flex';
          menu.style.top = `${e.pageY + 10}px`;
          menu.style.left = `${e.pageX - 50}px`;
        }
      } else {
        menu.style.display = 'none';
      }
    }, 10);
  } else {
    menu.style.display = 'none'; // Esconde se clicar fora
  }
});

window.aplicarMarcacao = async (cor) => {
  if (!selecaoAtual) return;
  const { livro, capitulo, versiculo } = selecaoAtual;
  const chave = `${livro}-${capitulo}-${versiculo}`;

  // Atualiza localmente
  if (cor) estado.marcacoes.set(chave, cor);
  else estado.marcacoes.delete(chave);

  // Esconde o menu e limpa a seleção
  document.getElementById('menu-marcacao').style.display = 'none';
  window.getSelection().removeAllRanges();

  // Re-renderiza o dia para aplicar a cor
  abrirLeitura(estado.diaAtual);

  // Salva no backend
  try {
    await fetch(`${API_BASE}/update-marcacao`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ livro, capitulo, versiculo, cor })
    });
  } catch (e) { 
    console.error("Erro ao salvar marcação", e);
    showToast("Erro ao salvar a marcação.", "erro");
  }
};

// ==========================================
// SISTEMA DE NOTIFICAÇÃO (TOAST)
// ==========================================
function showToast(mensagem, tipo = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.innerText = mensagem;
  
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// MODO ESCURO E FONTE
// ==========================================
window.toggleTema = () => {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.body.removeAttribute('data-theme');
    document.getElementById('btn-tema').innerText = '🌙';
    localStorage.setItem('tema', 'light');
  } else {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById('btn-tema').innerText = '☀️';
    localStorage.setItem('tema', 'dark');
  }
};

if (localStorage.getItem('tema') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  document.getElementById('btn-tema').innerText = '☀️';
}

let tamanhoFonte = parseInt(localStorage.getItem('fonteTamanho')) || 18;
function aplicarFonte() {
  document.getElementById('leitura-conteudo').style.fontSize = `${tamanhoFonte}px`;
  localStorage.setItem('fonteTamanho', tamanhoFonte);
}
window.mudarFonte = (delta) => {
  tamanhoFonte += (delta * 2);
  if (tamanhoFonte < 12) tamanhoFonte = 12;
  if (tamanhoFonte > 32) tamanhoFonte = 32;
  aplicarFonte();
};

// ==========================================
// AUTENTICAÇÃO
// ==========================================
window.toggleAuthMode = (e) => {
  if(e) e.preventDefault();
  isCadastro = !isCadastro;
  document.getElementById('auth-titulo').innerText = isCadastro ? 'Criar Conta' : 'Entrar';
  document.getElementById('campo-nome').style.display = isCadastro ? 'block' : 'none';
  document.getElementById('input-nome').required = isCadastro;
  document.getElementById('btn-auth-submit').innerText = isCadastro ? 'Cadastrar' : 'Entrar';
  document.getElementById('auth-toggle-text').innerText = isCadastro ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se';
};

window.handleAuth = async (e) => {
  e.preventDefault();
  const nome = document.getElementById('input-nome').value;
  const email = document.getElementById('input-email').value;
  const senha = document.getElementById('input-senha').value;
  const btnSubmit = document.getElementById('btn-auth-submit');
  const textoOriginal = btnSubmit.innerText;

  const endpoint = isCadastro ? `${API_BASE}/registrar` : `${API_BASE}/login`;
  const body = isCadastro ? { nome, email, senha } : { email, senha };

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<span class="spinner"></span> Aguarde...`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const textData = await res.text();
    let data;
    try { data = JSON.parse(textData); } catch (parseError) { throw new Error("O servidor demorou para responder. Tente novamente."); }
    if (!res.ok) throw new Error(data.error || "Erro desconhecido");

    localStorage.setItem('token', data.token);
    token = data.token;
    
    document.getElementById('input-nome').value = '';
    document.getElementById('input-email').value = '';
    document.getElementById('input-senha').value = '';
    
    showToast(`Bem-vindo, ${data.user.nome}!`, 'sucesso');
    iniciarApp();
  } catch (err) {
    showToast(err.message, 'erro');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerText = textoOriginal;
  }
};

window.fazerLogout = () => {
  if (!confirm("Tem certeza que deseja sair?")) return;
  logoutSilencioso();
  showToast("Você saiu da sua conta.", "info");
};

function logoutSilencioso() {
  localStorage.removeItem('token');
  token = null;
  estado.diasLidos.clear();
  estado.mesesVerificados.clear();
  estado.marcacoes.clear();
  document.getElementById('btn-sair').style.display = 'none';
  mudarTela('tela-auth');
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function iniciarApp() {
  document.getElementById('btn-sair').style.display = 'block';
  await carregarDados();
  await fetchProgresso();
  await fetchMarcacoes(); // Nova função
  renderizarMeses();
  atualizarBotaoContinuar();
  mudarTela('tela-meses');
}

window.voltarParaMeses = () => { atualizarBotaoContinuar(); mudarTela('tela-meses'); };
window.voltarParaDias = () => mudarTela('tela-dias');
window.toggleLido = () => { marcarDia(estado.diaAtual, document.getElementById('check-lido').checked); };
function mudarTela(id) { document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa')); document.getElementById(id).classList.add('ativa'); }

// ==========================================
// API DE PROGRESSO E MARCAÇÕES
// ==========================================

async function fetchProgresso() {
  try {
    const res = await fetch(`${API_BASE}/get-progress`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401) { logoutSilencioso(); showToast("Sessão expirada.", "erro"); return; }
    const data = await res.json();
    if (data.dias) data.dias.forEach(d => estado.diasLidos.add(d.dia));
    if (data.meses) data.meses.forEach(m => estado.mesesVerificados.add(m.mes));
  } catch (e) { console.error(e); }
}

async function fetchMarcacoes() {
  try {
    const res = await fetch(`${API_BASE}/get-marcacoes`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      data.forEach(m => {
        estado.marcacoes.set(`${m.livro}-${m.capitulo}-${m.versiculo}`, m.cor);
      });
    }
  } catch (e) { console.error("Erro ao buscar marcações", e); }
}

async function marcarDia(dia, lido) {
  if (lido) estado.diasLidos.add(dia); else estado.diasLidos.delete(dia);
  atualizarUIDias(); atualizarUIMeses();
  const diaObj = plano2027.find(d => d.dia === dia);
  verificarConclusaoMes(diaObj.mes);
  try {
    await fetch(`${API_BASE}/update-dia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ dia, lido })
    });
  } catch (e) { showToast("Erro ao salvar no servidor.", "erro"); }
}

async function verificarConclusaoMes(mes) {
  const diasDoMes = plano2027.filter(d => d.mes === mes);
  if (diasDoMes.every(d => estado.diasLidos.has(d.dia)) && !estado.mesesVerificados.has(mes)) {
    estado.mesesVerificados.add(mes);
    atualizarUIMeses();
    showToast(`Parabéns! Você concluiu o mês de ${mesesNomes[mes-1]}!`, "sucesso");
    try {
      await fetch(`${API_BASE}/update-mes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mes })
      });
    } catch (e) { console.error(e); }
  }
}

// ==========================================
// LÓGICA DE CONTINUAR LEITURA
// ==========================================

function atualizarBotaoContinuar() {
  const container = document.getElementById('continuar-leitura-container');
  const btn = document.getElementById('btn-continuar');
  if (!plano2027) return;
  const proximoDia = plano2027.find(d => !estado.diasLidos.has(d.dia));
  if (proximoDia) {
    container.style.display = 'block';
    btn.innerText = `Continuar Leitura (Dia ${proximoDia.dia}: ${proximoDia.capitulos[0].livro} ${proximoDia.capitulos[0].capitulo}) →`;
  } else {
    container.style.display = 'none';
  }
}

window.irParaProximoDia = () => {
  const proximoDia = plano2027.find(d => !estado.diasLidos.has(d.dia));
  if (proximoDia) {
    estado.mesAtual = proximoDia.mes;
    document.getElementById('titulo-mes').innerText = mesesNomes[proximoDia.mes - 1];
    atualizarUIDias();
    abrirLeitura(proximoDia.dia);
  }
};

// ==========================================
// RENDERIZAÇÃO
// ==========================================

function renderizarMeses() {
  const grid = document.getElementById('grid-meses');
  grid.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const diasDoMes = plano2027.filter(d => d.mes === i);
    const lidosNoMes = diasDoMes.filter(d => estado.diasLidos.has(d.dia)).length;
    const isVerificado = estado.mesesVerificados.has(i);
    const card = document.createElement('div');
    card.className = `card-mes ${isVerificado ? 'verificado' : ''}`;
    card.innerHTML = `<h3>${mesesNomes[i-1]}</h3><div class="progresso">${lidosNoMes} de ${diasDoMes.length} dias</div>`;
    card.onclick = () => abrirMes(i);
    grid.appendChild(card);
  }
}
function atualizarUIMeses() { renderizarMeses(); }

function abrirMes(mes) {
  estado.mesAtual = mes;
  document.getElementById('titulo-mes').innerText = mesesNomes[mes-1];
  atualizarUIDias();
  mudarTela('tela-dias');
}

function atualizarUIDias() {
  if (!estado.mesAtual) return;
  const lista = document.getElementById('lista-dias');
  lista.innerHTML = '';
  const diasDoMes = plano2027.filter(d => d.mes === estado.mesAtual);
  diasDoMes.forEach(diaObj => {
    const lido = estado.diasLidos.has(diaObj.dia);
    const refs = diaObj.capitulos.map(c => `${c.livro} ${c.capitulo}`).join(', ');
    const item = document.createElement('div');
    item.className = 'item-dia';
    item.innerHTML = `<div><strong>Dia ${diaObj.diaMes}</strong><div class="refs">${refs}</div></div><input type="checkbox" ${lido ? 'checked' : ''} style="pointer-events:none">`;
    item.onclick = () => abrirLeitura(diaObj.dia);
    lista.appendChild(item);
  });
}

function abrirLeitura(diaGlobal) {
  estado.diaAtual = diaGlobal;
  const conteudo = getTextoDia(diaGlobal);
  const container = document.getElementById('leitura-conteudo');
  container.innerHTML = '';
  
  conteudo.forEach(cap => {
    const divCap = document.createElement('div');
    divCap.className = 'capitulo';
    divCap.innerHTML = `<h2>${cap.livro} ${cap.capitulo}</h2>`;
    
    cap.versiculos.forEach((texto, index) => {
      const vNum = index + 1;
      const v = document.createElement('div');
      v.className = 'versiculo';
      // AQUI: Adicionamos os data-attributes para sabermos qual versículo é
      v.dataset.livro = cap.livro;
      v.dataset.capitulo = cap.capitulo;
      v.dataset.versiculo = vNum;

      // Verifica se este versículo tem marcação
      const chave = `${cap.livro}-${cap.capitulo}-${vNum}`;
      const corSalva = estado.marcacoes.get(chave);
      const classeCor = corSalva ? `marcacao-${corSalva}` : '';

      // AQUI: Envolvemos o texto num span para podermos colorir
      v.innerHTML = `<sup>${vNum}</sup> <span class="${classeCor}">${texto}</span>`;
      divCap.appendChild(v);
    });
    container.appendChild(divCap);
  });
  
  document.getElementById('check-lido').checked = estado.diasLidos.has(diaGlobal);
  aplicarFonte();
  mudarTela('tela-leitura');
  window.scrollTo(0, 0);
}

// ==========================================
// BOOT
// ==========================================

async function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/js/sw.js');
  if (token) await iniciarApp(); else mudarTela('tela-auth');
}

init();