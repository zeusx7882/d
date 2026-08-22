# Deploy

## Frontend estático

O frontend Vite pode ser publicado em GitHub Pages, Netlify ou Vercel.

```bash
npm run build
```

Saída: `dist/`

## Backend opcional

Para habilitar OAuth, admin, storage assinado e compartilhamento persistente, publique o Express separadamente (Render, Fly.io, Railway, VPS etc.).

## Desenvolvimento local

- Frontend: `npm run dev`
- Backend: `npm run server`
- O Vite usa proxy de `/api` para `VITE_API_BASE_URL`.

## Cabeçalhos

`public/_headers` atende hosts compatíveis. GitHub Pages não injeta cabeçalhos customizados sozinho; use proxy/CDN se precisar deles.

## Produção recomendada

- Frontend estático em CDN.
- Backend HTTPS com cookie seguro.
- Storage privado + URLs assinadas.
- `ADMIN_DISCORD_IDS` fora do código.
