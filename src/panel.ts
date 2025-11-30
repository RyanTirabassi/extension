import * as vscode from 'vscode';
import { getWebviewContent } from './webview/index';
import { createLogFunction } from './core/logging';
import { HandlerContext, TestResult } from './core/types';

// Importar handlers
import * as tokenHandler from './handlers/token-handler';
import * as sshHandler from './handlers/ssh-handler';
import * as credmgrHandler from './handlers/credmgr-handler';
import * as templateHandler from './handlers/template-handler';
import * as testHandler from './handlers/test-handler';

export function registerPanelCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('deploy-extension.deploy', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('Abra uma pasta de projeto no VS Code para usar o Deploy Automático.');
      return;
    }
    
    const projectRoot = workspaceFolder.uri.fsPath;

    const panel = vscode.window.createWebviewPanel(
      'deployPanel',
      'Deploy Automático v2',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      }
    );

    panel.webview.html = getWebviewContent(panel.webview);

    // Funções auxiliares
    const sendLog = createLogFunction(panel);

    function sendTestUpdate(tests: TestResult[]): void {
      try {
        panel.webview.postMessage({ 
          type: 'testResults', 
          tests 
        });
      } catch (e) {
        console.error('Erro ao enviar teste:', e);
      }
    }

    // Contexto compartilhado
    const ctx: HandlerContext = {
      panel,
      context,
      projectRoot,
      sendLog,
      sendTestUpdate
    };

    // Roteador de mensagens
    panel.webview.onDidReceiveMessage(async (message: any) => {
      const msgType = message.type as string;
      
      try {
        // Roteamento por página
        switch(msgType) {
          // ====================================
          // PÁGINA TOKEN
          // ====================================
          case 'saveGithubToken':
            await tokenHandler.handleSaveGithubToken(message, ctx);
            break;

          case 'saveVercelToken':
            await tokenHandler.handleSaveVercelToken(message, ctx);
            break;

          case 'clearGithubToken':
            await tokenHandler.handleClearGithubToken(message, ctx);
            break;

          case 'clearVercelToken':
            await tokenHandler.handleClearVercelToken(message, ctx);
            break;

          case 'saveRepoUrl':
            await tokenHandler.handleSaveRepoUrl(message, ctx);
            break;

          case 'deploy':
            await tokenHandler.handleDeploy(message, ctx);
            break;

          // ====================================
          // PÁGINA SSH
          // ====================================
          case 'scanSSHKeys':
            await sshHandler.handleScanSSHKeys(message, ctx);
            break;

          case 'testSSHKey':
            await sshHandler.handleTestSSHKey(message, ctx);
            break;

          case 'generateSSHKey':
            await sshHandler.handleGenerateSSHKey(message, ctx);
            break;

          case 'copySSHPublicKey':
            await sshHandler.handleCopySSHPublicKey(message, ctx);
            break;

          case 'testSSHConnection':
            await sshHandler.handleTestSSHConnection(message, ctx);
            break;

          case 'testSSH':
            await sshHandler.handleTestSSH(message, ctx);
            break;

          case 'deploySsh':
            await sshHandler.handleDeploySSH(message, ctx);
            break;

          case 'copyToClipboard':
            await sshHandler.handleCopyToClipboard(message, ctx);
            break;

          case 'openURL':
            await sshHandler.handleOpenURL(message, ctx);
            break;

          // ====================================
          // PÁGINA CREDMGR
          // ====================================
          case 'saveCredmgrUrl':
            await credmgrHandler.handleSaveCredmgrUrl(message, ctx);
            break;

          case 'testCredmgrConnection':
            await credmgrHandler.handleTestCredmgrConnection(message, ctx);
            break;

          case 'loadFileStructure':
            await credmgrHandler.handleLoadFileStructure(message, ctx);
            break;

          case 'deployCredmgr':
            await credmgrHandler.handleDeployCredmgr(message, ctx);
            break;

          case 'savePreset':
            await credmgrHandler.handleSavePreset(message, ctx);
            break;

          // ====================================
          // PÁGINA TEMPLATE
          // ====================================
          case 'applyTemplate':
            await templateHandler.handleApplyTemplate(message, ctx);
            break;

          // ====================================
          // PÁGINA TESTE
          // ====================================
          case 'executeTests':
            await testHandler.handleExecuteTests(message, ctx);
            break;

          default:
            sendLog(`⚠️ Tipo de mensagem desconhecido: ${msgType}`);
        }

      } catch (err: any) {
        const errMsg = err?.message || String(err);
        sendLog(`✖ ERRO GERAL: ${errMsg}`);
        vscode.window.showErrorMessage(`✖ Erro: ${errMsg}`);
      }
    });

    // Mensagem inicial
    sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sendLog('✓ Deploy Automático v2 Iniciado');
    sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sendLog(`📂 Projeto: ${projectRoot}`);
    sendLog('Pronto para usar! 🎯\n');
    vscode.window.showInformationMessage('🚀 Deploy Automático aberto!');
  });

  context.subscriptions.push(disposable);
}

