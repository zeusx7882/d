# PULSO GIFS

Avatar Decoration Studio independente, feito com React, Vite e TypeScript. O editor processa as imagens localmente no navegador e exporta uma composição PNG com avatar + decoração.

## Executar localmente

```bash
npm install
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## Funcionalidades

- Upload local de PNG, JPG/JPEG e WebP, com limite de 8 MB e 6000×6000 px.
- Catálogo baseado em dados, com busca, categorias e favoritos persistidos em `localStorage`.
- Catálogo com as decorações SVG locais de demonstração e PNGs em `public/decorations/catalogo/`.
- Canvas com arrastar, escala, rotação, posição X/Y, zoom, undo/redo e exportação PNG.
- Interface responsiva em preto e cinza, sem login e sem dependências de backend.

## Adicionar uma decoração

1. Coloque o asset em `public/decorations/`.
2. Adicione um objeto em `data/decorations.json` com `id`, `name`, `category`, `thumbnail`, `asset` e `tags`.
3. Rode `npm run build` para verificar os caminhos.

Use somente assets próprios ou com licença/autorização adequada. O projeto não inclui assets oficiais do Discord.

## Deploy

O projeto é uma SPA estática e pode ser publicado na Vercel, Netlify, GitHub Pages ou qualquer hospedagem que suporte Vite. O comando de build é `npm run build` e a pasta de saída é `dist`.

Na Vercel/Netlify, configure o framework como Vite e o comando de build como `npm run build`. Para GitHub Pages, configure o workflow de deploy e ajuste `base` em `vite.config.ts` se o site for publicado em um subcaminho.

Atualize `public/robots.txt` e `public/sitemap.xml` quando tiver o domínio definitivo. O domínio de exemplo usado nesses arquivos é temporário.

## Roadmap

- API própria para catálogo (`/api/decorations`, `/api/categories` e `/api/search`).
- Painel administrativo e métricas sem coleta desnecessária.
- Suporte a GIF/WebP animado e exportação de frames.
- Sistema opcional de contas.

## Aviso

PULSO GIFS é uma ferramenta independente de criação de imagens. Não é afiliada oficialmente ao Discord, não modifica contas do Discord e nunca solicita senha, token ou cookie. As imagens enviadas permanecem no navegador durante a edição e não são enviadas para um servidor por esta versão.

Comunidade: https://discord.gg/52vcE7dpnQ
