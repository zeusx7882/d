# Configuração do Discord OAuth

## Variáveis necessárias

```env
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://yoursite.com/api/auth/discord/callback
SESSION_SECRET=random_32_char_secret
ADMIN_DISCORD_IDS=123,456
VITE_AUTH_ENABLED=true
VITE_API_BASE_URL=http://localhost:3001
```

## Fluxo

1. O frontend redireciona para `GET /api/auth/discord`.
2. O backend gera `state` anti-CSRF e redireciona para o Discord.
3. O callback troca `code` por token em `https://discord.com/api/oauth2/token`.
4. O backend busca `/users/@me`, salva o usuário na sessão e redireciona ao app.
5. O frontend consulta `GET /api/auth/me` para montar a UI.

## Observações

- Em produção, use HTTPS e cookie `secure`.
- Configure no portal do Discord exatamente o mesmo redirect URI.
- Sem backend configurado, o app mostra fallback “Login próximamente”.
