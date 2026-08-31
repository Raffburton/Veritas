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

- Liturgia diária com leitura e acompanhamento da celebração do dia;
- Leitura da Bíblia Sagrada;
- Registro de notas e estudos pessoais;
- Lista de orações e devoções;
- Acesso a conteúdos com foco em simplicidade e legibilidade;
- Funcionamento com suporte offline para leitura de materiais já salvos;
- Notificações de lembrete para leitura e oração.

## Tecnologias utilizadas

- React Native
- Expo
- TypeScript
- React Navigation
- AsyncStorage
- Expo Notifications
- Expo Clipboard

## Estrutura do projeto

```bash
.
├── App.tsx
├── app.json
├── index.ts
├── package.json
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── storage/
│   └── types/
├── scripts/
├── assets/
└── README.md
```

## Como executar

### Pré-requisitos

- Node.js
- npm ou yarn
- Expo CLI

### Instalação

```bash
npm install
```

### Rodando o projeto

```bash
npm start
```

Ou para abrir em plataformas específicas:

```bash
npm run android
npm run ios
npm run web
```

## Scripts disponíveis

```bash
npm start           # inicia o projeto Expo
npm run android     # inicia no Android
npm run ios         # inicia no iOS
npm run web         # inicia no navegador
npm run sync:calendar # sincroniza calendário litúrgico
```

## Ideia central do projeto

O Veritas não é apenas um aplicativo de leitura, mas uma ferramenta de apoio para a fé e para o estudo bíblico. Sua proposta é facilitar o contato com a Palavra de Deus e com a vida litúrgica, ajudando pessoas a viverem a fé de forma mais consciente, organizada e transformadora.

## Contribuição

Contribuições são bem-vindas. O projeto pode ser melhorado com:

- melhorias na interface;
- novos recursos de estudo e meditação;
- organização de conteúdos bíblicos;
- refinamento de acessibilidade e usabilidade;
- suporte para mais formas de leitura e oração.

## Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo LICENSE para mais informações.

## Observação

Este projeto foi pensado como uma ferramenta de estudo, oração e apoio espiritual. Ele deve ser usado com responsabilidade, como complemento ao estudo pessoal, à formação na fé e à vida comunitária da Igreja.
