import * as vscode from 'vscode';
import { globalStyles } from './styles';
import { createBaseLayout } from './base-layout';
import { tokenPageHTML, tokenPageStyles } from './pages/token-page';
import { sshPageHTML, sshPageStyles } from './pages/ssh-page';
import { credmgrPageHTML, credmgrPageStyles } from './pages/credmgr-page';
import { templatePageHTML, templatePageStyles } from './pages/template-page';
import { testPageHTML, testPageStyles } from './pages/test-page';
import { sharedHandlers } from './scripts/shared-handlers';
import { tokenHandlers } from './scripts/token-handlers';
import { sshHandlers } from './scripts/ssh-handlers';
import { credmgrHandlers } from './scripts/credmgr-handlers';
import { templateHandlers } from './scripts/template-handlers';
import { testHandlers } from './scripts/test-handlers';

export function getWebviewContent(webview: vscode.Webview): string {
  const csp = webview.cspSource;
  
  // Combinar todas as páginas
  const allPages = `
    ${tokenPageHTML}
    ${sshPageHTML}
    ${credmgrPageHTML}
    ${templatePageHTML}
    ${testPageHTML}
  `;

  // Combinar todos os estilos - ORDEM IMPORTA!
  const allStyles = `
    ${globalStyles}
    ${tokenPageStyles}
    ${sshPageStyles}
    ${credmgrPageStyles}
    ${templatePageStyles}
    ${testPageStyles}
  `;

  // Combinar todos os scripts
  const allScripts = `
    ${sharedHandlers}
    ${tokenHandlers}
    ${sshHandlers}
    ${credmgrHandlers}
    ${templateHandlers}
    ${testHandlers}
  `;

  return `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp} https: data:; style-src ${csp} 'unsafe-inline'; script-src ${csp} 'unsafe-inline' 'unsafe-eval';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deploy Automático v2</title>
  <style>${allStyles}</style>
</head>
<body>
  ${createBaseLayout(allPages)}
  <script>${allScripts}</script>
</body>
</html>`;
}