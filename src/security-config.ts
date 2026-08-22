/**
 * PULSO GIFS – Security & Anti-Abuse Configuration
 *
 * The catalog assets are public in the static build, so every measure here is
 * deterrence-only. Use the backend routes in /server together with signed URLs,
 * auth and rate limiting for stronger protection in production.
 */

export const PROTECTION_CONFIG = {
  disableContextMenu: true,
  preventImageDrag: true,
  noSelectOnCards: true,
  showCopyrightNotice: true,
  enableWatermarkOverlay: true,
  watermarkText: '© PULSO GIFS',
} as const

export const COPYRIGHT = {
  owner: 'PULSO GIFS',
  year: 2026,
  notice:
    'Decorações protegidas por direitos autorais © 2026 PULSO GIFS. ' +
    'Uso pessoal permitido apenas na plataforma. ' +
    'Redistribuição, venda ou uso comercial é proibido.',
  noticeShort: '© 2026 PULSO GIFS – uso pessoal apenas',
  reportEmail: 'contato@pulsogifs.com',
  dmcaContact: 'Para denúncias de violação de direitos autorais, envie e-mail para: contato@pulsogifs.com',
} as const
