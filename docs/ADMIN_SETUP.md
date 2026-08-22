# Painel Admin

## Requisitos

- Backend Express ativo.
- `VITE_AUTH_ENABLED=true`.
- Usuário autenticado via Discord.
- ID do usuário presente em `ADMIN_DISCORD_IDS`.

## Recursos

- Visualizar catálogo completo.
- Detectar thumbs quebradas no navegador.
- Editar nome, categoria e tags.
- Marcar como destaque.
- Esconder ou mostrar itens.
- Recalcular manifesto via botão “Atualizar manifesto”.

## Rotas

- `GET /api/admin/decorations`
- `PUT /api/admin/decorations/:id`
- `POST /api/admin/manifest/refresh`

Todas as rotas passam por autenticação e validação de admin no servidor.
