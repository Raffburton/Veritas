export type ReleaseNoteSection = {
  title: string;
  description: string;
};

export const releaseNoteSections: ReleaseNoteSection[] = [
  {
    title: 'Leitura & Liturgia',
    description: 'Aprimoramento visual da liturgia: otimização na leitura de telas e componentes dos versículos, incluindo o destaque visual em negrito na aba Liturgia para uma visualização mais clara.',
  },
  {
    title: 'Visual & Desempenho (UI/UX)',
    description: 'Suporte a telas OLED, melhorias de escala e resolução em diferentes dispositivos e navegação por deslize lateral entre telas.',
  },
  {
    title: 'Acessibilidade',
    description: 'Modo negrito para melhorar a acessibilidade e o conforto visual durante a leitura.',
  },
];
