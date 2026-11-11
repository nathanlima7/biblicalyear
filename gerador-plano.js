const fs = require('fs');

const livros = [
  { nome: "Gênesis", caps: 50 }, { nome: "Êxodo", caps: 40 }, { nome: "Levítico", caps: 27 },
  { nome: "Números", caps: 36 }, { nome: "Deuteronômio", caps: 34 }, { nome: "Josué", caps: 24 },
  { nome: "Juízes", caps: 21 }, { nome: "Rute", caps: 4 }, { nome: "1 Samuel", caps: 31 },
  { nome: "2 Samuel", caps: 24 }, { nome: "1 Reis", caps: 22 }, { nome: "2 Reis", caps: 25 },
  { nome: "1 Crônicas", caps: 29 }, { nome: "2 Crônicas", caps: 36 }, { nome: "Esdras", caps: 10 },
  { nome: "Neemias", caps: 13 }, { nome: "Ester", caps: 10 }, { nome: "Jó", caps: 42 },
  { nome: "Salmos", caps: 150 }, { nome: "Provérbios", caps: 31 }, { nome: "Eclesiastes", caps: 12 },
  { nome: "Cantares", caps: 8 }, { nome: "Isaías", caps: 66 }, { nome: "Jeremias", caps: 52 },
  { nome: "Lamentações", caps: 5 }, { nome: "Ezequiel", caps: 48 }, { nome: "Daniel", caps: 12 },
  { nome: "Oséias", caps: 14 }, { nome: "Joel", caps: 3 }, { nome: "Amós", caps: 9 },
  { nome: "Obadias", caps: 1 }, { nome: "Jonas", caps: 4 }, { nome: "Miquéias", caps: 7 },
  { nome: "Naum", caps: 3 }, { nome: "Habacuque", caps: 3 }, { nome: "Sofonias", caps: 3 },
  { nome: "Ageu", caps: 2 }, { nome: "Zacarias", caps: 14 }, { nome: "Malaquias", caps: 4 },
  { nome: "Mateus", caps: 28 }, { nome: "Marcos", caps: 16 }, { nome: "Lucas", caps: 24 },
  { nome: "João", caps: 21 }, { nome: "Atos", caps: 28 }, { nome: "Romanos", caps: 16 },
  { nome: "1 Coríntios", caps: 16 }, { nome: "2 Coríntios", caps: 13 }, { nome: "Gálatas", caps: 6 },
  { nome: "Efésios", caps: 6 }, { nome: "Filipenses", caps: 4 }, { nome: "Colossenses", caps: 4 },
  { nome: "1 Tessalonicenses", caps: 5 }, { nome: "2 Tessalonicenses", caps: 3 }, { nome: "1 Timóteo", caps: 6 },
  { nome: "2 Timóteo", caps: 4 }, { nome: "Tito", caps: 3 }, { nome: "Filemom", caps: 1 },
  { nome: "Hebreus", caps: 13 }, { nome: "Tiago", caps: 5 }, { nome: "1 Pedro", caps: 5 },
  { nome: "2 Pedro", caps: 3 }, { nome: "1 João", caps: 5 }, { nome: "2 João", caps: 1 },
  { nome: "3 João", caps: 1 }, { nome: "Judas", caps: 1 }, { nome: "Apocalipse", caps: 22 }
];

const todosCapitulos = [];
livros.forEach(livro => {
  for (let c = 1; c <= livro.caps; c++) {
    todosCapitulos.push({ livro: livro.nome, capitulo: c });
  }
});

const totalCaps = todosCapitulos.length;
const diasNoAno = 365;
const base = Math.floor(totalCaps / diasNoAno);
const resto = totalCaps % diasNoAno;

const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const plano = [];
let capIndex = 0;
let diaGlobal = 1;

for (let mes = 1; mes <= 12; mes++) {
  for (let diaMes = 1; diaMes <= diasPorMes[mes - 1]; diaMes++) {
    const qtdCap = base + (diaGlobal <= resto ? 1 : 0);
    const capitulosDoDia = todosCapitulos.slice(capIndex, capIndex + qtdCap);
    
    plano.push({
      dia: diaGlobal,
      mes: mes,
      diaMes: diaMes,
      capitulos: capitulosDoDia
    });
    
    capIndex += qtdCap;
    diaGlobal++;
  }
}

// Garante que a pasta existe antes de tentar salvar
const dir = './frontend/data';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(`${dir}/plano-2027.json`, JSON.stringify(plano, null, 2));
console.log('Plano de leitura gerado com sucesso em frontend/data/plano-2027.json');