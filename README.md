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

- Upload local de PNG, JPG/JPEG, WebP e GIF, com limite de 8 MB e 6000×6000 px.
- Catálogo baseado em dados, com busca, categorias e favoritos persistidos em `localStorage`.
- Catálogo com as decorações SVG locais de demonstração e PNGs em `public/decorations/catalogo/`.
- Canvas com arrastar, escala, rotação, posição X/Y, zoom, undo/redo e exportação PNG e GIF.
- Aba "Todas as decorações" com lista completa e busca.
- Interface responsiva em preto e cinza, sem login e sem dependências de backend.

## Privacidade – uploads locais

Todo o processamento de imagens ocorre **inteiramente no navegador**. Os arquivos de avatar enviados pelo usuário **nunca são transmitidos a um servidor**. O PNG/GIF exportado é gerado localmente via Canvas API. Fechar a aba descarta todos os dados enviados.

## Proteção de assets

### O que está implementado (dissuasão client-side)

- Menu de contexto desabilitado nas thumbnails do catálogo e no canvas de preview.
- Arrastar imagens para fora do catálogo desabilitado.
- `user-select: none` nas áreas de card.
- Aviso de direitos autorais na UI (biblioteca e rodapé).
- Cabeçalhos HTTP de segurança via `public/_headers` (Netlify) – ver seção abaixo.

### Limitação fundamental

> **Imagens entregues ao navegador não podem ser protegidas tecnicamente contra cópia.**

Capturas de tela, DevTools, cache do navegador, gravação de tela e ferramentas de rede (curl, wget, Puppeteer) não podem ser bloqueados pelo frontend. As medidas acima dificultam a cópia casual e comunicam a política de uso, mas **não constituem DRM**.

### Upgrade path (backend/CDN)

Para proteção real contra download em massa:

1. Mover assets para storage privado (AWS S3, Cloudflare R2, Supabase Storage).
2. Servir apenas via URLs assinadas com expiração (ex.: TTL de 60 segundos).
3. Adicionar autenticação (Discord OAuth) antes de acessar assets em alta resolução.
4. Implementar rate limiting por IP/conta e bloqueio de bots no WAF.
5. Adicionar CAPTCHA no fluxo de exportação.
6. Usar Cloudflare com proteção contra hotlink.

Veja o arquivo [SECURITY.md](./SECURITY.md) para documentação completa.

## Cabeçalhos de segurança

O arquivo `public/_headers` configura os seguintes cabeçalhos para **Netlify**:

| Cabeçalho | Valor |
|---|---|
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Câmera, microfone, geolocalização e pagamento desabilitados |
| `Content-Security-Policy` | Scripts e estilos do próprio domínio + Google Fonts |

Para outros hosts (Vercel, GitHub Pages, Apache), veja [SECURITY.md](./SECURITY.md).

**GitHub Pages não suporta cabeçalhos HTTP customizados**. Use um proxy reverso (Cloudflare) ou migre para Netlify/Vercel.

## Adicionar uma decoração

1. Coloque o asset em `public/decorations/catalogo/` com o nome `decoracao_ID.png`.
2. Rode `npm run build` para verificar os caminhos.

Use somente assets próprios ou com licença/autorização adequada. O projeto não inclui assets oficiais do Discord.

## Deploy

O projeto é uma SPA estática e pode ser publicado na Vercel, Netlify, GitHub Pages ou qualquer hospedagem que suporte Vite. O comando de build é `npm run build` e a pasta de saída é `dist`.

Na Vercel/Netlify, configure o framework como Vite e o comando de build como `npm run build`. Para GitHub Pages, configure o workflow de deploy e ajuste `base` em `vite.config.ts` se o site for publicado em um subcaminho.

Atualize `public/robots.txt` e `public/sitemap.xml` quando tiver o domínio definitivo.

## Copyright

Decorações protegidas por direitos autorais © 2026 PULSO GIFS. Uso pessoal permitido apenas na plataforma. Redistribuição, venda ou uso comercial é proibido.

Para denúncias de violação ou solicitações de remoção: **contato@pulsogifs.com** *(placeholder – atualizar com endereço real)*

## Aviso

PULSO GIFS é uma ferramenta independente de criação de imagens. Não é afiliada oficialmente ao Discord, não modifica contas do Discord e nunca solicita senha, token ou cookie.

Comunidade: https://discord.gg/52vcE7dpnQ

