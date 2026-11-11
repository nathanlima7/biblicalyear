import { carregarDados, plano2027, getTextoDia } from './data.js';

const API_BASE = '/api'; 
let token = localStorage.getItem('token');
let isCadastro = false;

let estado = {
  diasLidos: new Set(),
  mesesVerificados: new Set(),
  mesAtual: null,
  diaAtual: null
};

const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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

  const endpoint = isCadastro ? '/api/registrar' : '/api/login';
  const body = isCadastro ? { nome, email, senha } : { email, senha };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || "Erro desconhecido");

    localStorage.setItem('token', data.token);
    token = data.token;
    
    // Limpa os campos
    document.getElementById('input-nome').value = '';
    document.getElementById('input-email').value = '';
    document.getElementById('input-senha').value = '';
    
    iniciarApp();
  } catch (err) {
    alert(err.message);
  }
};

window.fazerLogout = () => {
  localStorage.removeItem('token');
  token = null;
  estado.diasLidos.clear();
  estado.mesesVerificados.clear();
  document.getElementById('btn-sair').style.display = 'none';
  mudarTela('tela-auth');
};

// ==========================================
// INICIALIZAÇÃO E NAVEGAÇÃO
// ==========================================

async function iniciarApp() {
  document.getElementById('btn-sair').style.display = 'block';
  await carregarDados();
  await fetchProgresso();
  renderizarMeses();
  mudarTela('tela-meses');
}

window.voltarParaMeses = () => mudarTela('tela-meses');
window.voltarParaDias = () => mudarTela('tela-dias');
window.toggleLido = () => {
  const check = document.getElementById('check-lido').checked;
  marcarDia(estado.diaAtual, check);
};

function mudarTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  document.getElementById(id).classList.add('ativa');
}

// ==========================================
// API DE PROGRESSO
// ==========================================

async function fetchProgresso() {
  try {
    const res = await fetch(`${API_BASE}/get-progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) return fazerLogout(); 
    
    const data = await res.json();
    if (data.dias) data.dias.forEach(d => estado.diasLidos.add(d.dia));
    if (data.meses) data.meses.forEach(m => estado.mesesVerificados.add(m.mes));
  } catch (e) { console.error("Erro ao buscar progresso", e); }
}

async function marcarDia(dia, lido) {
  if (lido) estado.diasLidos.add(dia);
  else estado.diasLidos.delete(dia);

  atualizarUIDias();
  atualizarUIMeses();
  
  const diaObj = plano2027.find(d => d.dia === dia);
  verificarConclusaoMes(diaObj.mes);

  try {
    await fetch(`${API_BASE}/update-dia`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ dia, lido })
    });
  } catch (e) { console.error("Erro ao salvar dia", e); }
}

async function verificarConclusaoMes(mes) {
  const diasDoMes = plano2027.filter(d => d.mes === mes);
  const todosLidos = diasDoMes.every(d => estado.diasLidos.has(d.dia));
  
  if (todosLidos && !estado.mesesVerificados.has(mes)) {
    estado.mesesVerificados.add(mes);
    atualizarUIMeses();
    try {
      await fetch(`${API_BASE}/update-mes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mes })
      });
    } catch (e) { console.error("Erro ao verificar mês", e); }
  }
}

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
    card.innerHTML = `
      <h3>${mesesNomes[i-1]}</h3>
      <div class="progresso">${lidosNoMes} de ${diasDoMes.length} dias</div>
    `;
    card.onclick = () => abrirMes(i);
    grid.appendChild(card);
  }
}

function atualizarUIMeses() {
  renderizarMeses();
}

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
    item.innerHTML = `
      <div>
        <strong>Dia ${diaObj.diaMes}</strong>
        <div class="refs">${refs}</div>
      </div>
      <input type="checkbox" ${lido ? 'checked' : ''} style="pointer-events:none">
    `;
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
      const v = document.createElement('div');
      v.className = 'versiculo';
      v.innerHTML = `<sup>${index + 1}</sup> ${texto}`;
      divCap.appendChild(v);
    });
    container.appendChild(divCap);
  });
  
  document.getElementById('check-lido').checked = estado.diasLidos.has(diaGlobal);
  mudarTela('tela-leitura');
  window.scrollTo(0, 0);
}

// ==========================================
// BOOT
// ==========================================

async function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/js/sw.js');
  }
  
  if (token) {
    await iniciarApp();
  } else {
    mudarTela('tela-auth');
  }
}

init();