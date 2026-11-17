import { CATEGORIAS, ORDEM_STATUS } from '../constants/categorias';
import type { CategoriaId, EventoHistorico, Ocorrencia, StatusOcorrencia } from '../types';
import { retriar } from './triagem';

const DIA_MS = 86_400_000;

interface Semente {
  categoria: CategoriaId;
  descricao: string;
  endereco: string;
  lat: number;
  lon: number;
  status: StatusOcorrencia;
  diasAtras: number;
  apoios: number;
  acess: boolean;
  diasParaResolver?: number;
  avaliacao?: number;
}

/** Dados de demonstração na região da Av. Paulista / Bela Vista (São Paulo). */
const SEMENTES: Semente[] = [
  { categoria: 'ILUMINACAO', descricao: 'Três postes apagados na rua, trecho muito escuro e com relatos de assalto à noite.', endereco: 'R. Frei Caneca, 820 - Consolação', lat: -23.5552, lon: -46.6539, status: 'EM_ANALISE', diasAtras: 4, apoios: 12, acess: false },
  { categoria: 'CALCADA', descricao: 'Calçada quebrada e com degrau alto, cadeirante não consegue passar. Perto da UBS.', endereco: 'R. Treze de Maio, 1200 - Bela Vista', lat: -23.5638, lon: -46.6463, status: 'ABERTA', diasAtras: 12, apoios: 8, acess: true },
  { categoria: 'BURACO', descricao: 'Buraco grande na faixa da direita, motos desviando bruscamente.', endereco: 'Al. Santos, 455 - Cerqueira César', lat: -23.5679, lon: -46.6489, status: 'EM_EXECUCAO', diasAtras: 6, apoios: 5, acess: false },
  { categoria: 'AGUA', descricao: 'Vazamento de água limpa há dois dias, desperdício enorme.', endereco: 'R. Augusta, 1508 - Consolação', lat: -23.5585, lon: -46.6581, status: 'RESOLVIDA', diasAtras: 9, apoios: 3, acess: false, diasParaResolver: 1, avaliacao: 5 },
  { categoria: 'LIXO', descricao: 'Entulho de obra descartado na calçada bloqueando a passagem.', endereco: 'R. Pamplona, 300 - Jardim Paulista', lat: -23.5661, lon: -46.6551, status: 'RESOLVIDA', diasAtras: 15, apoios: 2, acess: true, diasParaResolver: 4, avaliacao: 3 },
  { categoria: 'ALAGAMENTO', descricao: 'Bueiro entupido, a rua alaga sempre que chove e a água entra nas casas.', endereco: 'R. Santo Antônio, 90 - Bixiga', lat: -23.5569, lon: -46.6430, status: 'ABERTA', diasAtras: 3, apoios: 15, acess: false },
  { categoria: 'SINALIZACAO', descricao: 'Semáforo de pedestres quebrado em frente à escola, crianças atravessando sem sinal.', endereco: 'Av. Brigadeiro Luís Antônio, 2000', lat: -23.5682, lon: -46.6487, status: 'EM_ANALISE', diasAtras: 1, apoios: 9, acess: true },
  { categoria: 'ARVORE', descricao: 'Galho grande pendurado sobre a fiação elétrica.', endereco: 'R. Haddock Lobo, 595 - Cerqueira César', lat: -23.5612, lon: -46.6648, status: 'RESOLVIDA', diasAtras: 25, apoios: 4, acess: false, diasParaResolver: 18, avaliacao: 2 },
  { categoria: 'CALCADA', descricao: 'Rampa de acessibilidade obstruída por poste, idosos precisam descer na rua.', endereco: 'Av. Paulista, 1578 - Bela Vista', lat: -23.5614, lon: -46.6559, status: 'EM_EXECUCAO', diasAtras: 8, apoios: 6, acess: true },
  { categoria: 'ILUMINACAO', descricao: 'Lâmpada piscando na praça.', endereco: 'Pça. Oswaldo Cruz - Paraíso', lat: -23.5710, lon: -46.6463, status: 'RESOLVIDA', diasAtras: 7, apoios: 1, acess: false, diasParaResolver: 2, avaliacao: 4 },
];

const OBS: Record<StatusOcorrencia, string> = {
  ABERTA: 'Ocorrência registrada e encaminhada ao órgão responsável.',
  EM_ANALISE: 'Equipe técnica analisando a solicitação.',
  EM_EXECUCAO: 'Equipe de campo designada. Serviço em andamento.',
  RESOLVIDA: 'Serviço concluído.',
};

/** Gera a lista de demonstração com datas relativas ao momento atual. */
export function gerarOcorrenciasDemo(agora = Date.now()): Ocorrencia[] {
  return SEMENTES.map((s, i) => {
    const criada = agora - s.diasAtras * DIA_MS;
    const cat = CATEGORIAS[s.categoria];
    const etapas = ORDEM_STATUS.slice(0, ORDEM_STATUS.indexOf(s.status) + 1);
    const duracao = (s.diasParaResolver ?? s.diasAtras * 0.8) * DIA_MS;
    const historico: EventoHistorico[] = etapas.map((st, k) => ({
      status: st,
      data: new Date(criada + (k === 0 ? 0 : (duracao * k) / Math.max(1, etapas.length - 1))).toISOString(),
      observacao: OBS[st],
    }));
    const base: Ocorrencia = {
      id: `BA-2026-${String(100231 + i * 137)}`,
      categoria: s.categoria,
      titulo: cat.nome,
      descricao: s.descricao,
      endereco: s.endereco,
      coordenada: { latitude: s.lat, longitude: s.lon },
      status: s.status,
      prioridade: 'BAIXA',
      pontuacao: 0,
      afetaAcessibilidade: s.acess,
      apoios: s.apoios,
      apoiadoPorMim: false,
      criadaPorMim: false,
      criadaEm: new Date(criada).toISOString(),
      prazoEm: new Date(criada + cat.slaDias * DIA_MS).toISOString(),
      resolvidaEm: s.status === 'RESOLVIDA' ? historico[historico.length - 1].data : undefined,
      avaliacao: s.avaliacao,
      historico,
    };
    const t = retriar(base, agora);
    return { ...base, pontuacao: t.pontuacao, prioridade: t.prioridade };
  });
}
