# Veritas

Veritas é um aplicativo mobile para estudo bíblico, acompanhamento da liturgia diária e apoio à vida de oração. O projeto nasceu com a proposta de reunir em um só lugar a Palavra de Deus, a celebração litúrgica, recursos de oração e um espaço para anotações pessoais.

## Proposta

O objetivo principal do Veritas é ajudar pessoas a:

- acompanhar a liturgia do dia;
- ler e refletir sobre textos bíblicos;
- registrar anotações e estudos pessoais;
- acessar orações e devoções;
- manter uma rotina de fé, oração e estudo com praticidade.

A ideia é oferecer uma experiência simples, acessível e útil para quem deseja aprofundar sua caminhada espiritual, seja em momentos de estudo individual, oração pessoal ou compartilhamento em grupos.

## Finalidade

Este projeto tem finalidade educativa, espiritual e pessoal. Ele busca ser uma ferramenta de apoio para:

- estudo da Bíblia e da liturgia católica;
- formação e reflexão espiritual;
- organização de leitura e meditação;
- acompanhamento da vida litúrgica ao longo do tempo;
- incentivo à oração e ao crescimento na fé.

Além disso, o Veritas procura unir tecnologia e espiritualidade de maneira leve e prática, tornando a leitura do evangelho, a oração e a reflexão mais acessíveis no dia a dia.

## Funcionalidades

### ✓ Liturgia Diária
- Acompanhamento completo da celebração do dia
- Calendário litúrgico 2026 integrado
- Leituras e reflexões estruturadas

### ✓ Bíblia Sagrada
- Leitura completa da Bíblia
- Interface otimizada para legibilidade
- Navegação intuitiva entre livros e capítulos

### ✓ Sistema de Orações
- Acesso a devoções e orações estruturadas
- Biblioteca de preces para diferentes momentos

### ✓ Anotações Pessoais
- Registro de notas e estudos pessoais
- Persistência de dados locais
- Organização flexível de conteúdo

### ✓ Recursos Avançados
- Funcionamento offline com dados sincronizados
- Notificações de lembretes para leitura e oração
- Suporte a múltiplos temas (light/dark)
- Sincronização do calendário litúrgico

## Download e Instalação

### 📥 APK Disponível no GitHub

O arquivo APK compilado está disponível nos [releases do GitHub](https://github.com/raffburton/Veritas/releases).

#### Como instalar:

1. Baixe o arquivo `Veritas-v1.1.7.apk` do repositório
2. Ative **"Fontes desconhecidas"** nas configurações de segurança do Android
3. Abra o arquivo baixado e toque em **"Instalar"**
4. Pronto! O aplicativo está pronto para uso

### ⚙️ Requisitos do Sistema

- **Node.js** 18+
- **Expo CLI**
- **iOS** 13+ (para iPhone)
- **Android** 7.0+ (para dispositivos Android)

## Tecnologias utilizadas

- **React Native** 0.81.5 - Framework mobile multiplataforma
- **Expo** ~54.0.0 - Plataforma de desenvolvimento
- **TypeScript** ~5.9.2 - Tipagem estática
- **React Navigation** 7.x - Navegação multi-tela
- **AsyncStorage** 2.2.0 - Armazenamento local persistente
- **Expo Notifications** - Sistema de notificações
- **Expo Clipboard** - Acesso à área de transferência
- **Expo Vector Icons** - Biblioteca de ícones

## Estrutura do Projeto

```
src/
├── screens/              - Telas principais do aplicativo
│   ├── HomeScreen.tsx        - Tela inicial
│   ├── BibleScreen.tsx        - Leitor da Bíblia
│   ├── PrayersScreen.tsx      - Orações e devoções
│   ├── NotesScreen.tsx        - Anotações pessoais
│   └── SettingsScreen.tsx     - Configurações
├── components/           - Componentes reutilizáveis
├── context/              - Contextos React
│   ├── DailyLiturgyContext.tsx
│   ├── LibraryContext.tsx
│   ├── NotificationContext.tsx
│   └── ThemeContext.tsx
├── services/             - Serviços de negócio
│   ├── bibleService.ts
│   ├── liturgyService.ts
│   ├── liturgicalCalendarService.ts
│   └── importantDatesService.ts
├── storage/              - Gerenciamento de dados
│   └── preferences.ts
├── navigation/           - Configuração de navegação
│   └── AppNavigator.tsx
├── types/                - Tipos TypeScript
│   ├── library.ts
│   └── liturgy.ts
└── data/                 - Dados estáticos
    ├── BibleData.json
    ├── LiturgyData.json
    └── LiturgicalCalendar2026.json
```

## Como Executar

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (instale com `npm install -g expo-cli`)

### Instalação de Dependências

```bash
npm install
```

### Executando em Desenvolvimento

```bash
# Iniciar servidor Expo
npm start

# Abrir no Android
npm run android

# Abrir no iOS
npm run ios

# Abrir no navegador
npm run web

# Sincronizar calendário litúrgico
npm run sync:calendar
```

## Ideia Central do Projeto

O Veritas não é apenas um aplicativo de leitura, mas uma ferramenta de apoio para a fé e para o estudo bíblico. Sua proposta é facilitar o contato com a Palavra de Deus e com a vida litúrgica, ajudando pessoas a viverem a fé de forma mais consciente, organizada e transformadora.

## Contribuição

Contribuições são bem-vindas. O projeto pode ser melhorado com:

- melhorias na interface;
- novos recursos de estudo e meditação;
- organização de conteúdos bíblicos;
- refinamento de acessibilidade e usabilidade;
- suporte para mais formas de leitura e oração.

## Informações Adicionais

- **Projeto ID (EAS):** 45e37a48-c091-4f73-abdb-cfe1e03159e7
- **Package Android:** com.raffburton.Veritas
- **Slug:** Veritas
- **Versão Atual:** 1.1.7

## Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo LICENSE para mais informações.

## Observação

Este projeto foi pensado como uma ferramenta de estudo, oração e apoio espiritual. Ele deve ser usado com responsabilidade, como complemento ao estudo pessoal, à formação na fé e à vida comunitária da Igreja.
