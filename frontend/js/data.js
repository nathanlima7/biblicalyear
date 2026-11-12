export let plano2027 = null;
export let biblia = null;

export async function carregarDados() {
  if (plano2027 && biblia) return;
  
  const [resPlano, resBiblia] = await Promise.all([
    fetch('/data/plano-2027.json'),
    fetch('/data/biblia.json')
  ]);
  
  plano2027 = await resPlano.json();
  const rawBiblia = await resBiblia.json();
  
  // Normaliza o JSON da Bíblia (formato do thiagobodrik/bible)
  biblia = rawBiblia.map(livro => ({
    ...livro,
    nome: livro.name
  }));
}

export function getTextoDia(diaGlobal) {
  const diaData = plano2027.find(d => d.dia === diaGlobal);
  if (!diaData) return [];

  return diaData.capitulos.map(capInfo => {
    const livroData = biblia.find(l => l.name === capInfo.livro);
    if (!livroData) return null;
    
    const versiculos = livroData.chapters[capInfo.capitulo - 1];
    return {
      livro: capInfo.livro,
      capitulo: capInfo.capitulo,
      versiculos: versiculos
    };
  }).filter(Boolean);
}