export type ReleaseNoteSection = {
  title: string;
  description: string;
};

export const releaseNoteSections: ReleaseNoteSection[] = [
  {
    title: 'Novo recurso: compartilhamento visual',
    description: 'Adicionado o componente ShareCard no ReaderScreen, permitindo gerar e compartilhar trechos e versículos formatados diretamente como imagem.',
  },
  {
    title: 'Visual & Experiência (OLED)',
    description: 'Modo escuro aperfeiçoado para telas OLED com preto absoluto e suporte a cores de seleção personalizadas integradas à BibleScreen.',
  },
  {
    title: 'Notificações & Sistema',
    description: 'Correção e adição de suporte ao ícone grande de notificação no Android, garantindo exibição correta em múltiplos dispositivos.',
  },
  {
    title: 'Homenagem & Rodapé',
    description: 'Adicionado texto em homenagem a São Carlo Acutis, padroeiro da internet e da tecnologia.',
  },
];
