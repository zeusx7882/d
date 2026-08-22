# PULSO GIFS

Editor de avatar em React + Vite com fluxo **static-first** e fronteira clara para backend opcional. O app agora suporta **camadas múltiplas** (avatar, decoração, texto, emoji e upload), exportação PNG, exportação GIF com limitação explícita, favoritos, projetos locais e compartilhamento por URL.

## Principais recursos

- Editor por camadas com painel lateral, reorder por drag-and-drop, visibilidade, opacidade, rotação, escala, posição e efeitos (brilho, contraste, saturação).
- Múltiplas decorações por projeto.
- Camadas de texto e emoji com controles próprios.
- Undo/redo com histórico de 30 snapshots e atalhos `Ctrl/Cmd+Z` e `Ctrl/Cmd+Y`.
- Catálogo enriquecido com **669** itens, categorias, tags, destaque e paginação em lotes de 48.
- Favoritos em `localStorage`, com chave prefixada por usuário quando houver login.
- Projetos salvos localmente, modal “Meus Projetos” e compartilhamento em modo somente leitura via hash na URL.
- Backend Express documentado para Discord OAuth, admin, storage assinado, favoritos e compartilhamento público.

## Rodando localmente

```bash
npm install
npm run dev
```

### Build de produção

```bash
npm run build
npm run preview
```

### Backend opcional

```bash
npm run server
```

> O frontend continua funcional sem backend. Quando `VITE_AUTH_ENABLED=false`, a UI mostra **“Login próximamente”** e recursos dependentes de servidor entram em fallback honesto.

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste conforme seu ambiente.

- `VITE_AUTH_ENABLED=false`: desabilita login e painel admin no frontend.
- `VITE_API_BASE_URL=http://localhost:3001`: endpoint do backend no desenvolvimento.
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`: OAuth2 do Discord.
- `SESSION_SECRET`: segredo da sessão HTTP-only.
- `ADMIN_DISCORD_IDS`: IDs autorizados no painel admin.

## Arquitetura

### Frontend

- `src/components/Editor/LayerEditor.tsx`: canvas, exportações, projetos, compartilhamento.
- `src/components/Editor/LayerPanel.tsx`: lista e reorder das camadas.
- `src/components/Editor/LayerControls.tsx`: controles por camada e ações globais.
- `src/components/Catalog/CatalogView.tsx`: busca, filtros, favoritos e paginação.
- `src/components/Admin/AdminPanel.tsx`: edição administrativa do manifesto.
- `src/lib/auth.ts`, `src/hooks/useAuth.ts`: estado de login com fallback gracioso.
- `src/lib/storage.ts`: abstração para assets com URLs assinadas.

### Backend

Rotas Express disponíveis em `server/`:

- `GET /api/auth/discord`
- `GET /api/auth/discord/callback`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/admin/decorations`
- `PUT /api/admin/decorations/:id`
- `POST /api/admin/manifest/refresh`
- `GET /api/storage/sign?path=...`
- `GET /api/favorites`
- `POST /api/favorites`
- `POST /api/projects/share`
- `GET /api/share/:id`

## GIF: limitação honesta

A exportação GIF usa `gifshot`, mas gera **1 frame estático** a partir do canvas. A interface deixa isso explícito. Para avatares animados, envie um GIF como base; o preview permanece animado no navegador, mas o export via canvas continua limitado ao frame estático.

## Catálogo

`data/decorations.json` foi expandido com:

- `category`
- `tags`
- `featured`
- `visible`

As categorias são distribuídas deterministicamente ao longo do índice do catálogo.

## Segurança

- `public/_headers` traz cabeçalhos recomendados para hosts compatíveis.
- `src/security-config.ts` mantém as medidas de dissuasão no cliente.
- `SECURITY.md` detalha limites do frontend e a trilha de upgrade com backend.

## Documentação adicional

- `docs/DISCORD_OAUTH.md`
- `docs/ADMIN_SETUP.md`
- `docs/DEPLOYMENT.md`
- `SECURITY.md`

## Aviso

PULSO GIFS é uma ferramenta independente. Não é afiliada oficialmente ao Discord e não solicita senha, token ou cookie do usuário.
