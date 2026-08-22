# Segurança do PULSO GIFS

## Resumo

O frontend continua **static-first**. Isso significa que thumbnails e decorações servidas diretamente pelo navegador **não podem ser protegidas de forma absoluta**. As medidas no cliente são de dissuasão, não DRM.

## O que existe no frontend

- Bloqueio de menu de contexto nas superfícies sensíveis.
- Prevenção de drag nativo em thumbs.
- Watermark sutil em thumbnails quando `enableWatermarkOverlay=true`.
- Avisos visuais de copyright.
- Cabeçalhos recomendados em `public/_headers`.

## Limitação fundamental

Qualquer asset entregue ao navegador pode ser obtido por DevTools, cache local, capturas de tela ou automação. Não descreva o build estático como solução anti-cópia total.

## Fronteira segura proposta

Para endurecer a arquitetura em produção:

1. Mover assets para storage privado (S3/R2/Supabase).
2. Assinar URLs via `GET /api/storage/sign`.
3. Exigir autenticação Discord antes de liberar assets privados.
4. Aplicar `helmet`, cookies `httpOnly`, `sameSite: 'lax'` e `secure` em produção.
5. Adicionar rate limiting por IP/usuário.
6. Proteger exportações e acessos abusivos com WAF/CAPTCHA, se necessário.

## Admin e autenticação

- `GET /api/auth/me` retorna o usuário autenticado e a flag `isAdmin`.
- Toda mutação de admin passa por validação server-side em `server/routes/admin.ts`.
- `ADMIN_DISCORD_IDS` controla o allowlist.

## Storage assinado

`src/lib/storage.ts` faz fallback para path público quando `VITE_USE_SIGNED_URLS` não estiver habilitado. Com backend ativo, o app consulta `/api/storage/sign?path=...`.

## Compartilhamento

O compartilhamento atual usa hash base64 na URL para leitura pública local. O backend já inclui `GET /api/share/:id` e `POST /api/projects/share` para evoluir para links persistentes.
