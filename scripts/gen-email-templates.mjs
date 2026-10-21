#!/usr/bin/env node
// Generates the branded authentication emails (supabase/templates/*.html) and the
// matching [auth.email.template.*] blocks of supabase/config.toml.
//
// Colours come straight from the design tokens in src/index.css so the emails
// look like the platform. Every email is bilingual (English, then French).
//
// Usage: node scripts/gen-email-templates.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'supabase', 'templates');
mkdirSync(outDir, { recursive: true });

// --- design tokens (HSL triplets copied from src/index.css) -------------------
const hsl = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`.toUpperCase();
};

const light = {
  page: hsl(33, 35, 95), // secondary
  card: '#FFFFFF',
  fg: hsl(29, 100, 12), // primary / foreground
  fgOnDark: hsl(36, 100, 97), // primary-foreground
  muted: hsl(29, 18, 45),
  border: hsl(30, 22, 89),
  accent: hsl(29, 100, 57),
  accentSoft: hsl(33, 100, 94),
};
const dark = {
  page: hsl(29, 40, 8),
  card: hsl(29, 35, 11),
  fg: hsl(36, 60, 97),
  muted: hsl(33, 20, 68),
  border: hsl(29, 25, 20),
  panel: hsl(29, 30, 16),
};

const FONT = "Poppins, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SITE = 'https://express.zanldo.com';
const LOGO = `${SITE}/images/z-express-logo-email.png`;

// --- building blocks ---------------------------------------------------------
const p = (text) =>
  `<p class="t-fg" style="margin:0 0 14px;font-size:15px;line-height:24px;color:${light.fg};">${text}</p>`;
const small = (text) =>
  `<p class="t-muted" style="margin:0 0 10px;font-size:13px;line-height:20px;color:${light.muted};">${text}</p>`;
const h1 = (text) =>
  `<h1 class="t-fg" style="margin:0 0 14px;font-size:24px;line-height:32px;font-weight:700;color:${light.fg};">${text}</h1>`;

const button = (href, label) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 8px;">
  <tr>
    <td class="btn" align="center" bgcolor="${light.fg}" style="border-radius:999px;background:${light.fg};">
      <a href="${href}" target="_blank" class="btn-a" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;color:${light.fgOnDark};text-decoration:none;border-radius:999px;">${label}</a>
    </td>
  </tr>
</table>`;

const code = (token) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 8px;">
  <tr>
    <td class="code-box" align="center" bgcolor="${light.accentSoft}" style="background:${light.accentSoft};border:1px solid ${light.accent};border-radius:999px;padding:18px 12px;">
      <div class="t-fg" style="font-family:'SFMono-Regular',Menlo,Consolas,'Courier New',monospace;font-size:36px;line-height:44px;font-weight:700;letter-spacing:10px;color:${light.fg};padding-left:10px;">${token}</div>
    </td>
  </tr>
</table>`;

const divider = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;"><tr><td class="line" style="border-top:1px solid ${light.border};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;

// --- layout ------------------------------------------------------------------
function layout({ lang = 'en', preheader, en, fr }) {
  return `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Z. Express</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @media (max-width: 620px) {
    .container { width: 100% !important; }
    .pad { padding-left: 22px !important; padding-right: 22px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg-page { background: ${dark.page} !important; }
    .bg-card { background: ${dark.card} !important; border-color: ${dark.border} !important; }
    .t-fg { color: ${dark.fg} !important; }
    .t-muted { color: ${dark.muted} !important; }
    .line { border-top-color: ${dark.border} !important; }
    .code-box { background: ${dark.panel} !important; }
    .logo-chip { background: ${light.fgOnDark} !important; border-color: ${dark.border} !important; }
    .btn { background: ${dark.fg} !important; }
    .btn-a { color: ${light.fg} !important; }
  }
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background:${light.page};font-family:${FONT};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}&#8203;&zwnj;&#8203;&zwnj;&#8203;&zwnj;&#8203;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" style="background:${light.page};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">
        <tr>
          <td align="center" style="padding:0 4px 20px;">
            <a href="${SITE}" target="_blank" style="text-decoration:none;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="logo-chip" bgcolor="${light.fgOnDark}" style="background:${light.fgOnDark};border:1px solid ${light.border};border-radius:999px;padding:12px 30px;">
                    <img src="${LOGO}" alt="Z.express" width="240" style="display:block;width:240px;max-width:100%;height:auto;border:0;outline:none;font-family:${FONT};font-size:18px;font-weight:700;color:${light.fg};">
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
        <tr>
          <td class="bg-card" style="background:${light.card};border:1px solid ${light.border};border-radius:20px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td bgcolor="${light.accent}" style="background:${light.accent};height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>
              <tr>
                <td class="pad" style="padding:34px 36px 30px;font-family:${FONT};">
                  ${en}
                  ${divider}
                  <div lang="fr">${fr}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" align="center" style="padding:22px 20px 0;font-family:${FONT};">
            <p class="t-muted" style="margin:0 0 4px;font-size:12px;line-height:18px;color:${light.muted};">Z.&nbsp;Express is a product of <a href="https://zanldo.com" style="color:${light.accent};font-weight:600;text-decoration:none;">Zanldo</a> (zanldo.com), powered by <a href="https://liafrik.com" style="color:${light.accent};font-weight:600;text-decoration:none;">Liafrik&nbsp;Tech</a> (liafrik.com).</p>
            <p class="t-muted" style="margin:0 0 12px;font-size:12px;line-height:18px;color:${light.muted};">Z.&nbsp;Express est un produit de <a href="https://zanldo.com" style="color:${light.accent};font-weight:600;text-decoration:none;">Zanldo</a> (zanldo.com), propuls&eacute; par <a href="https://liafrik.com" style="color:${light.accent};font-weight:600;text-decoration:none;">Liafrik&nbsp;Tech</a> (liafrik.com).</p>
            <p class="t-muted" style="margin:0;font-size:11px;line-height:17px;color:${light.muted};"><a href="${SITE}" style="color:${light.muted};text-decoration:underline;">express.zanldo.com</a> &middot; This is an automated message, please do not reply. / Ceci est un message automatique, merci de ne pas r&eacute;pondre.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`;
}

// --- the six emails ----------------------------------------------------------
const templates = {
  confirmation: {
    subject: 'Your Z. Express verification code · Votre code de vérification',
    html: layout({
      preheader: 'Your verification code is {{ .Token }}',
      en:
        h1('Confirm your email') +
        p('Welcome to Z.&nbsp;Express. Enter this 6-digit code to finish creating your account:') +
        code('{{ .Token }}') +
        small('The code expires in 1 hour. If you did not create an account, you can safely ignore this email.'),
      fr:
        h1('Confirmez votre e-mail') +
        p('Bienvenue sur Z.&nbsp;Express. Saisissez ce code &agrave; 6 chiffres pour finaliser la cr&eacute;ation de votre compte&nbsp;:') +
        code('{{ .Token }}') +
        small('Le code expire dans 1 heure. Si vous n&rsquo;avez pas cr&eacute;&eacute; de compte, ignorez simplement cet e-mail.'),
    }),
  },
  invite: {
    subject: 'You are invited to Z. Express · Vous êtes invité sur Z. Express',
    html: layout({
      preheader: 'Accept your invitation to join Z. Express',
      en:
        h1('You&rsquo;re invited') +
        p('You have been invited to join a team on Z.&nbsp;Express, the logistics platform for carriers, agencies and merchants.') +
        button('{{ .ConfirmationURL }}', 'Accept the invitation') +
        small('If the button does not work, copy this address into your browser:<br><span style="word-break:break-all;">{{ .ConfirmationURL }}</span>'),
      fr:
        h1('Vous &ecirc;tes invit&eacute;') +
        p('Vous avez &eacute;t&eacute; invit&eacute; &agrave; rejoindre une &eacute;quipe sur Z.&nbsp;Express, la plateforme logistique des transporteurs, agences et marchands.') +
        button('{{ .ConfirmationURL }}', 'Accepter l&rsquo;invitation') +
        small('Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur&nbsp;:<br><span style="word-break:break-all;">{{ .ConfirmationURL }}</span>'),
    }),
  },
  recovery: {
    subject: 'Reset your Z. Express password · Réinitialisez votre mot de passe',
    html: layout({
      preheader: 'Choose a new password for your Z. Express account',
      en:
        h1('Reset your password') +
        p('We received a request to reset the password of your Z.&nbsp;Express account. Click the button below to choose a new one.') +
        button('{{ .ConfirmationURL }}', 'Choose a new password') +
        small('The link expires in 1 hour. If you did not ask for this, nothing changes: your password stays the same.'),
      fr:
        h1('R&eacute;initialisez votre mot de passe') +
        p('Nous avons re&ccedil;u une demande de r&eacute;initialisation du mot de passe de votre compte Z.&nbsp;Express. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.') +
        button('{{ .ConfirmationURL }}', 'Choisir un nouveau mot de passe') +
        small('Le lien expire dans 1 heure. Si vous n&rsquo;&ecirc;tes pas &agrave; l&rsquo;origine de cette demande, rien ne change&nbsp;: votre mot de passe reste le m&ecirc;me.'),
    }),
  },
  magic_link: {
    subject: 'Your Z. Express sign-in link · Votre lien de connexion',
    html: layout({
      preheader: 'Your sign-in code is {{ .Token }}',
      en:
        h1('Sign in to Z.&nbsp;Express') +
        p('Click the button to sign in, or enter this code if you are asked for one:') +
        code('{{ .Token }}') +
        button('{{ .ConfirmationURL }}', 'Sign in') +
        small('The link and the code expire in 1 hour. If you did not try to sign in, ignore this email.'),
      fr:
        h1('Connexion &agrave; Z.&nbsp;Express') +
        p('Cliquez sur le bouton pour vous connecter, ou saisissez ce code s&rsquo;il vous est demand&eacute;&nbsp;:') +
        code('{{ .Token }}') +
        button('{{ .ConfirmationURL }}', 'Me connecter') +
        small('Le lien et le code expirent dans 1 heure. Si vous n&rsquo;avez pas tent&eacute; de vous connecter, ignorez cet e-mail.'),
    }),
  },
  email_change: {
    subject: 'Confirm your new email address · Confirmez votre nouvelle adresse e-mail',
    html: layout({
      preheader: 'Confirm the change of your Z. Express email address',
      en:
        h1('Confirm your new email') +
        p('You asked to change the email address of your Z.&nbsp;Express account from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>.') +
        button('{{ .ConfirmationURL }}', 'Confirm the change') +
        small('If you did not request this, contact us right away and do not click the button.'),
      fr:
        h1('Confirmez votre nouvelle adresse') +
        p('Vous avez demand&eacute; &agrave; remplacer l&rsquo;adresse e-mail de votre compte Z.&nbsp;Express&nbsp;<strong>{{ .Email }}</strong> par <strong>{{ .NewEmail }}</strong>.') +
        button('{{ .ConfirmationURL }}', 'Confirmer le changement') +
        small('Si vous n&rsquo;&ecirc;tes pas &agrave; l&rsquo;origine de cette demande, contactez-nous imm&eacute;diatement et ne cliquez pas sur le bouton.'),
    }),
  },
  reauthentication: {
    subject: 'Your Z. Express security code · Votre code de sécurité',
    html: layout({
      preheader: 'Your security code is {{ .Token }}',
      en:
        h1('Confirm it&rsquo;s you') +
        p('For your security, enter this code to continue with your sensitive action:') +
        code('{{ .Token }}') +
        small('The code expires in 1 hour. Never share it with anyone.'),
      fr:
        h1('Confirmez votre identit&eacute;') +
        p('Pour votre s&eacute;curit&eacute;, saisissez ce code pour poursuivre votre action sensible&nbsp;:') +
        code('{{ .Token }}') +
        small('Le code expire dans 1 heure. Ne le communiquez &agrave; personne.'),
    }),
  },
};

// --- write files and config --------------------------------------------------
for (const [name, { html }] of Object.entries(templates)) {
  writeFileSync(join(outDir, `${name}.html`), html);
}

const configPath = join(root, 'supabase', 'config.toml');
let config = readFileSync(configPath, 'utf8');
config = config.replace(/\n# --- BEGIN generated email templates ---[\s\S]*?# --- END generated email templates ---\n/, '\n');
const blocks = Object.entries(templates)
  .map(
    ([name, { subject }]) =>
      `[auth.email.template.${name}]\nsubject = ${JSON.stringify(subject)}\ncontent_path = "./supabase/templates/${name}.html"\n`
  )
  .join('\n');
config = config.replace(
  /\n(\[functions\.)/,
  `\n# --- BEGIN generated email templates --- (scripts/gen-email-templates.mjs)\n${blocks}# --- END generated email templates ---\n\n$1`
);
writeFileSync(configPath, config);

console.log(`Wrote ${Object.keys(templates).length} templates to ${outDir}`);
console.log('Palette:', JSON.stringify({ ...light, dark }, null, 0));
