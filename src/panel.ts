import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { runCommand, makeSafeName, normalizeFsPath, getRepoPathFromUrl } from './utils';
import { getWebviewContent } from './webview';
import { RunResult } from './types';
import { storeSecret, getSecret, deleteSecret } from './secrets';

const VERCEL_SECRET_KEY = 'vercelToken';
const GITHUB_SECRET_KEY = 'githubToken';
const GLOBAL_REPO_KEY = 'repoUrl';

// registra comando e cria painel (conteúdo e handlers preservados)
export function registerPanelCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('deploy-extension.deploy', async () => {
    // exigir pasta de workspace para evitar ler arquivos fora do projeto
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('Abra uma pasta de projeto no VS Code para usar o Deploy Automático (nenhuma pasta aberta).');
      return;
    }
    const projectRoot = workspaceFolder.uri.fsPath;

    const panel = vscode.window.createWebviewPanel('deployPanel', 'Deploy Automático', vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, 'media'),
        vscode.Uri.joinPath(context.extensionUri, 'webview')
      ]
    });

    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'main.js'));
    const styleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'style.css'));
    const githubIcon = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'github.png')).toString();
    const vercelIcon = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'vercel.png')).toString();

    panel.webview.html = getWebviewContent(panel.webview, scriptUri.toString(), styleUri.toString(), githubIcon, vercelIcon);
    vscode.window.showInformationMessage('Painel de Deploy aberto!');

    // defina sendLog UMA VEZ
    function sendLog(t: string) {
      try {
        panel.webview.postMessage({ type: 'log', text: String(t) });
      } catch {
        /* noop */
      }
    }

    // helper: commit sem usar operadores shell "|| true" (cross-platform)
    async function tryCommit(message: string) {
      const res = await runCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`, projectRoot, d => sendLog(d));
      // commit pode falhar (nothing to commit) — logamos e prosseguimos
      if (!res.ok) {
        sendLog('git commit retornou não-zero (possível: nothing to commit) — prosseguindo.');
      }
      return res;
    }

    // report which project root is being used (workspace)
    sendLog(`Usando projectRoot: "${projectRoot}" - fonte: workspace`);

    // sendStatus: envia apenas arquivos abertos dentro do projectRoot; fallback para git status (também filtrado)
    async function sendStatus() {
      const projectRootNorm = normalizeFsPath(projectRoot);

      // 1) preferir arquivos abertos dentro do projectRoot
      const openDocsFiltered = vscode.workspace.textDocuments
        .filter(doc => {
          if (doc.isUntitled) return false;
          if (doc.uri.scheme !== 'file') return false;
          try {
            const docNorm = normalizeFsPath(doc.uri.fsPath);
            return docNorm.startsWith(projectRootNorm);
          } catch {
            return false;
          }
        })
        .map(doc => path.relative(projectRoot, doc.uri.fsPath).replace(/\\/g, '/') || doc.uri.fsPath);

      sendLog(`sendStatus: projectRoot="${projectRoot}" - openDocsFiltered=${openDocsFiltered.length}`);

      let files: string[] = openDocsFiltered;

      // 2) se não houver arquivos abertos relevantes, usar `git status` mas garantir que os caminhos pertençam ao projectRoot
      if (!files || files.length === 0) {
        const res = await runCommand('git status --porcelain', projectRoot, d => sendLog(d));
        files = (res.stdout || '')
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .map(l => (l.length > 3 ? l.slice(3).trim() : l.trim()));

        // transformar em caminhos absolutos, filtrar por projectRoot e retornar caminhos relativos para a UI
        files = files
          .map(f => path.resolve(projectRoot, f))
          .filter(abs => normalizeFsPath(abs).startsWith(projectRootNorm))
          .map(abs => path.relative(projectRoot, abs).replace(/\\/g, '/'));
      }

      // dedupe e envie
      files = Array.from(new Set((files || []).filter(Boolean)));
      panel.webview.postMessage({ type: 'status', files });
    }

    // helpers used by handlers below (save tokens/repo, tests and deploy)
    async function saveSecretIfNew(secretKey: string, token: string, label: string) {
      const normalized = String(token || '').trim();
      if (!normalized) {
        vscode.window.showWarningMessage(`${label} vazio. Informe um token válido.`);
        sendLog(`${label} vazio. Nada salvo.`);
        panel.webview.postMessage({ type: 'tokenSaved', key: secretKey, ok: false, text: 'vazio' });
        return;
      }
      const existing = await getSecret(context, secretKey);
      if (existing === normalized) {
        const msg = `${label} já salvo.`;
        vscode.window.showWarningMessage(msg);
        sendLog(msg);
        panel.webview.postMessage({ type: 'tokenSaved', key: secretKey, ok: false, text: 'duplicado' });
        return;
      }
      await storeSecret(context, secretKey, normalized);
      const msg = `${label} salvo com segurança.`;
      vscode.window.showInformationMessage(msg);
      sendLog(msg);
      panel.webview.postMessage({ type: 'tokenSaved', key: secretKey, ok: true, text: 'salvo' });
    }

    async function saveRepoUrlIfNew(url: string) {
      const normalized = String(url || '').trim();
      if (!normalized) {
        vscode.window.showWarningMessage('Repo URL vazio. Informe uma URL válida.');
        sendLog('Repo URL vazio. Nada salvo.');
        panel.webview.postMessage({ type: 'repoSaveResult', ok: false, text: 'vazio' });
        return;
      }
      const existing = context.globalState.get<string>(GLOBAL_REPO_KEY, '');
      if (existing === normalized) {
        const msg = 'Repo URL já salvo.';
        vscode.window.showWarningMessage(msg);
        sendLog(msg);
        panel.webview.postMessage({ type: 'repoSaveResult', ok: false, text: 'duplicado' });
        return;
      }
      await context.globalState.update(GLOBAL_REPO_KEY, normalized);
      const msg = 'Repo URL salvo com segurança.';
      vscode.window.showInformationMessage(msg);
      sendLog(msg);
      panel.webview.postMessage({ type: 'repoSaveResult', ok: true, text: 'salvo' });
    }

    async function testGithubAccess(repoUrl: string | undefined, ghToken: string | undefined) {
      try {
        const repoPath = getRepoPathFromUrl(repoUrl);
        if (!repoPath) return { ok: false, text: 'Repo URL inválida ou não informada.' };
        let testUrl = repoUrl || `https://github.com/${repoPath}.git`;
        if (ghToken && testUrl.startsWith('https://')) testUrl = testUrl.replace('https://', `https://${ghToken}@`);
        const res = await runCommand(`git ls-remote --exit-code "${testUrl}"`, projectRoot, d => sendLog(d));
        if (res.ok) return { ok: true, text: 'Acesso ao GitHub OK (ls-remote funcionou).' };
        return { ok: false, text: 'Falha ao acessar repositório remoto: ' + (res.stderr || res.stdout) };
      } catch (err: any) {
        return { ok: false, text: 'Erro testando GitHub: ' + (err?.message ?? String(err)) };
      }
    }

    async function testVercelAccess(vercelToken: string | undefined) {
      try {
        if (!vercelToken) return { ok: false, text: 'Token Vercel não informado.' };
        const cmd = `npx vercel whoami --token="${vercelToken}"`;
        const res = await runCommand(cmd, projectRoot, d => sendLog(d));
        if (res.ok && (res.stdout || '').trim()) {
          return { ok: true, text: 'Vercel: ' + res.stdout.trim().split('\n')[0] };
        }
        return { ok: false, text: 'Falha autenticar Vercel: ' + (res.stderr || res.stdout) };
      } catch (err: any) {
        return { ok: false, text: 'Erro testando Vercel: ' + (err?.message ?? String(err)) };
      }
    }

    // message handler
    panel.webview.onDidReceiveMessage(async (msg: any) => {
      try {
        if (msg.type === 'requestStatus') {
          await sendStatus();
        } else if (msg.type === 'saveGithubToken') {
          await saveSecretIfNew(GITHUB_SECRET_KEY, String(msg.token || ''), 'GitHub token');
        } else if (msg.type === 'saveVercelToken') {
          await saveSecretIfNew(VERCEL_SECRET_KEY, String(msg.token || ''), 'Token do Vercel');
        } else if (msg.type === 'saveRepoUrl') {
          await saveRepoUrlIfNew(String(msg.url || ''));
        } else if (msg.type === 'clearGithubToken') {
          await deleteSecret(context, GITHUB_SECRET_KEY);
          const msgText = 'GitHub token removido do armazenamento seguro.';
          vscode.window.showInformationMessage(msgText);
          sendLog(msgText);
          panel.webview.postMessage({ type: 'tokenCleared', key: GITHUB_SECRET_KEY });
        } else if (msg.type === 'clearVercelToken') {
          await deleteSecret(context, VERCEL_SECRET_KEY);
          const msgText = 'Token do Vercel removido do armazenamento seguro.';
          vscode.window.showInformationMessage(msgText);
          sendLog(msgText);
          panel.webview.postMessage({ type: 'tokenCleared', key: VERCEL_SECRET_KEY });
        } else if (msg.type === 'clearRepoUrl') {
          await context.globalState.update(GLOBAL_REPO_KEY, '');
          const msgText = 'Repo URL removida.';
          vscode.window.showInformationMessage(msgText);
          sendLog(msgText);
        } else if (msg.type === 'preview') {
          const file = String(msg.file || '');
          if (!file) {
            panel.webview.postMessage({ type: 'preview', file, text: 'No file' });
            return;
          }
          const r = await runCommand(`git diff -- "${file.replace(/"/g, '\\"')}"`, projectRoot, d => sendLog(d));
          panel.webview.postMessage({ type: 'preview', file, text: r.stdout || r.stderr });
        } else if (msg.type === 'testDeploy') {
          panel.webview.postMessage({ type: 'log', text: '🔎 Iniciando checagem (Testar Deploy)...' });
          const repoUrlFromField = String(msg.repoUrl || '').trim();
          const repoUrlSaved = context.globalState.get<string>(GLOBAL_REPO_KEY, '').trim();
          const repoUrlToUse = repoUrlFromField || repoUrlSaved || '';
          const ghTokenFromField = String(msg.ghToken || '').trim();
          const ghTokenSaved = await getSecret(context, GITHUB_SECRET_KEY);
          const ghTokenToUse = ghTokenFromField || ghTokenSaved || '';
          sendLog(`Fonte do GitHub token: ${ghTokenFromField ? 'campo' : ghTokenSaved ? 'secrets' : 'nenhum'}`);
          const vercelTokenFromField = String(msg.vercelToken || '').trim();
          const vercelTokenSaved = await getSecret(context, VERCEL_SECRET_KEY);
          const vercelTokenToUse = vercelTokenFromField || vercelTokenSaved || '';
          sendLog(`Fonte do Vercel token: ${vercelTokenFromField ? 'campo' : vercelTokenSaved ? 'secrets' : 'nenhum'}`);

          const gitVersion = await runCommand('git --version', projectRoot, d => sendLog(d));
          const hasGit = gitVersion.ok;
          panel.webview.postMessage({ type: 'log', text: `git --version: ${gitVersion.stdout || gitVersion.stderr}` });

          let localRepo = false;
          if (hasGit) {
            const st = await runCommand('git rev-parse --is-inside-work-tree', projectRoot);
            localRepo = st.ok && (st.stdout || '').toString().trim() === 'true';
          }
          panel.webview.postMessage({ type: 'log', text: `Repositório local: ${localRepo ? 'Sim' : 'Não'}` });

          let ghResult = { ok: false, text: 'Não verificado' };
          if (!repoUrlToUse) ghResult = { ok: false, text: 'Repo URL não informada (salve a Repo URL ou preencha o campo).' };
          else {
            sendLog('🔎 Testando acesso GitHub (ls-remote)...');
            ghResult = await testGithubAccess(repoUrlToUse, ghTokenToUse);
          }
          panel.webview.postMessage({ type: 'log', text: `GitHub: ${ghResult.text}` });

          let vercelResult = { ok: false, text: 'Não verificado' };
          if (!vercelTokenToUse) vercelResult = { ok: false, text: 'Token Vercel não disponível.' };
          else {
            sendLog('🔎 Testando autenticação Vercel (npx vercel whoami)...');
            vercelResult = await testVercelAccess(vercelTokenToUse);
          }
          panel.webview.postMessage({ type: 'log', text: `Vercel: ${vercelResult.text}` });

          const summary = {
            gitInstalled: hasGit,
            localRepo,
            github: ghResult,
            vercel: vercelResult,
            repoUrl: repoUrlToUse,
            ghTokenProvided: !!ghTokenToUse,
            vercelTokenProvided: !!vercelTokenToUse
          };

          panel.webview.postMessage({ type: 'testResult', summary });
          panel.webview.postMessage({ type: 'log', text: '🔎 Teste finalizado.' });
        } else if (msg.type === 'deploy') {
          panel.webview.postMessage({ type: 'log', text: 'Iniciando deploy...' });
          const githubSelected = !!msg.github;
          const vercelSelected = !!msg.vercel;
          const repoUrlFromField = String(msg.repoUrl || '').trim();
          const repoUrlSaved = context.globalState.get<string>(GLOBAL_REPO_KEY, '').trim();
          let repoUrlToUse = repoUrlSaved;
          if (repoUrlFromField) {
            repoUrlToUse = repoUrlFromField;
            await saveRepoUrlIfNew(repoUrlFromField);
          }

          // se não tivermos repoUrl, tente descobrir a partir do remote existente
          if (!repoUrlToUse) {
            const remoteGet = await runCommand('git remote get-url origin', projectRoot);
            if (remoteGet.ok) repoUrlToUse = (remoteGet.stdout || '').trim();
          }

          const gitExists = fs.existsSync(path.join(projectRoot, '.git'));
          if (!gitExists && repoUrlToUse) {
            sendLog('Nenhum repositório Git local encontrado. Inicializando repositório...');
            await runCommand('git init', projectRoot, d => sendLog(d));
            await runCommand('git add .', projectRoot, d => sendLog(d));
            await tryCommit('Initial commit (automatic by Deploy Extension)');
            let remoteUrl = repoUrlToUse;
            if (githubSelected) {
              const ghToken = (await getSecret(context, GITHUB_SECRET_KEY)) || '';
              if (ghToken && remoteUrl && remoteUrl.startsWith('https://')) remoteUrl = remoteUrl.replace(/^https:\/\//, `https://${ghToken}@`);
            }
            if (remoteUrl) {
              await runCommand(`git remote add origin "${remoteUrl}"`, projectRoot, d => sendLog(d));
              await runCommand('git branch -M main', projectRoot, d => sendLog(d));
              const firstPush = await runCommand('git push -u origin main', projectRoot, d => sendLog(d));
              sendLog(firstPush.stdout || firstPush.stderr);
              if (!firstPush.ok && (((firstPush.stderr || '') + (firstPush.stdout || '')).includes('rejected') || ((firstPush.stderr || '') + (firstPush.stdout || '')).includes('fetch'))) {
                sendLog('Push inicial rejeitado — tentando integrar remoto e repetir push...');
                const pullRes = await runCommand('git pull --rebase origin main', projectRoot, d => sendLog(d));
                sendLog(pullRes.stdout || pullRes.stderr);
                const retryPush = await runCommand('git push -u origin main', projectRoot, d => sendLog(d));
                sendLog(retryPush.stdout || retryPush.stderr);
              }
            }
          }

          const branchRes = await runCommand('git rev-parse --abbrev-ref HEAD', projectRoot);
          const branch = (branchRes.stdout || '').trim() || 'main';

          if (githubSelected) {
            sendLog('🚀 Fazendo push para o GitHub...');
            const ghTokenField = String(msg.ghToken || '').trim();
            const ghTokenSaved2 = await getSecret(context, GITHUB_SECRET_KEY);
            const ghToken = ghTokenField || ghTokenSaved2 || '';
            sendLog(`Usando GitHub token: ${ghTokenField ? 'campo' : ghTokenSaved2 ? 'secrets' : 'nenhum'}`);

            if (msg.files && msg.files.length) {
              const quoted = msg.files.map((f: string) => `"${f.replace(/"/g, '\\"')}"`).join(' ');
              await runCommand(`git add ${quoted}`, projectRoot, d => sendLog(d));
            } else {
              await runCommand('git add .', projectRoot, d => sendLog(d));
            }
            await tryCommit((msg.message || 'deploy: automatic'));

            // determine remote URL (prefer saved, field, or existing origin)
            let remoteUrl = (context.globalState.get<string>(GLOBAL_REPO_KEY, '') || '').trim() || repoUrlToUse || '';
            if (!remoteUrl) {
              const rem = await runCommand('git remote get-url origin', projectRoot);
              if (rem.ok) remoteUrl = (rem.stdout || '').trim();
            }

            // prepare push command and possibly set remote with token
            let pushCmd = `git push origin ${branch}`;
            if (ghToken) {
              if (remoteUrl && remoteUrl.startsWith('https://')) {
                const tokenRemote = remoteUrl.replace(/^https:\/\//, `https://${ghToken}@`);
                await runCommand(`git remote set-url origin "${tokenRemote}"`, projectRoot, d => sendLog(d));
                pushCmd = `git push origin ${branch}`;
              } else {
                const repoPath = getRepoPathFromUrl(repoUrlToUse || remoteUrl) || '';
                if (repoPath) pushCmd = `git push https://${ghToken}@github.com/${repoPath} ${branch}`.trim();
              }
            }

            const pushRes = await runCommand(pushCmd, projectRoot, d => sendLog(d));
            sendLog(pushRes.stdout || pushRes.stderr);
            if (!pushRes.ok && (((pushRes.stderr || '') + (pushRes.stdout || '')).includes('rejected') || ((pushRes.stderr || '') + (pushRes.stdout || '')).includes('fetch'))) {
              sendLog('Push rejeitado — tentando integrar remoto (git pull --rebase) e repetir push...');
              const pullRes = await runCommand(`git pull --rebase origin ${branch}`, projectRoot, d => sendLog(d));
              sendLog(pullRes.stdout || pullRes.stderr);
              const push2 = await runCommand(pushCmd, projectRoot, d => sendLog(d));
              sendLog(push2.stdout || push2.stderr);
            }
          }

          if (vercelSelected) {
            sendLog('⚙️ Executando build e deploy no Vercel...');
            const build = await runCommand('npm run build', projectRoot, d => sendLog(d));
            if (!build.ok) {
              vscode.window.showErrorMessage('Erro no build. Verifique o painel.');
              sendLog('Build falhou: ' + (build.stderr || ''));
              return;
            }
            const tokenField = String(msg.token || '').trim();
            const tokenSaved = await getSecret(context, VERCEL_SECRET_KEY);
            const token = tokenField || tokenSaved || '';
            sendLog(`Fonte do Vercel token no deploy: ${tokenField ? 'campo' : tokenSaved ? 'secrets' : 'nenhum'}`);
            if (!token) {
              vscode.window.showErrorMessage('Token do Vercel não configurado.');
              sendLog('Token do Vercel não configurado.');
              return;
            }
            let baseName = path.basename(projectRoot);
            try {
              const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
              if (pkg && pkg.name) baseName = String(pkg.name);
            } catch { }
            const safeName = makeSafeName(baseName) || 'deploy-project';
            const vercelCmd = `npx vercel --prod --token="${token}" --yes --name="${safeName}"`;
            const vercelRes = await runCommand(vercelCmd, projectRoot, d => sendLog(d));
            sendLog(vercelRes.stdout || vercelRes.stderr);
          }

          sendLog('✅ Deploy finalizado.');
          await sendStatus();
        }
      } catch (err: any) {
        sendLog('Erro: ' + (err?.message ?? String(err)));
        vscode.window.showErrorMessage('Erro no processo de deploy: ' + (err?.message ?? String(err)));
      }
    });

    // initial status
    await sendStatus();
  });

  const clearToken = vscode.commands.registerCommand('deploy-extension.clearVercelToken', async () => {
    await deleteSecret(context, VERCEL_SECRET_KEY);
    vscode.window.showInformationMessage('Token do Vercel removido do armazenamento seguro.');
  });

  context.subscriptions.push(disposable, clearToken);
}
