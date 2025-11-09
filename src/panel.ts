import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { runCommand, makeSafeName, normalizeFsPath, getRepoPathFromUrl, base64Encode } from './utils';
import { getWebviewContent } from './webview';
import { RunResult } from './types';
import { storeSecret, getSecret, deleteSecret } from './secrets';

const VERCEL_SECRET_KEY = 'vercelToken';
const GITHUB_SECRET_KEY = 'githubToken';
const GLOBAL_REPO_KEY = 'repoUrl';

// helper: chave por workspace (garante que cada pasta armazene sua própria Repo URL)
function workspaceRepoKey(root: string) {
  try { return `${GLOBAL_REPO_KEY}:${normalizeFsPath(root)}`; }
  catch { return GLOBAL_REPO_KEY; }
}

// registra comando e cria painel (conteúdo e handlers preservados)
export function registerPanelCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('deploy-extension.deploy', async () => {
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

    function sendLog(t: string) {
      try {
        panel.webview.postMessage({ type: 'log', text: String(t) });
      } catch { /* noop */ }
    }

    function maskToken(s: string, token?: string) {
      if (!s) return s;
      if (!token) return s;
      try {
        return String(s).split(token).join('***');
      } catch {
        return s;
      }
    }

    // Remove userinfo (user[:pass]@) de URLs https:// para evitar "Bad hostname"
    function stripUserInfoFromUrl(url: string) {
      try {
        if (!url) return url;
        return String(url).replace(/^(https?:\/\/)[^@\/]+@/i, '$1');
      } catch {
        return url;
      }
    }

    // Extrai token/userinfo de uma URL (se existir) sem salvar; retorna token (parte user antes de ':') ou ''
    function extractTokenFromUrl(url: string) {
      try {
        if (!url) return '';
        const m = String(url).match(/^(https?:\/\/)([^@\/]+)@/i);
        if (!m) return '';
        const userinfo = m[2]; // ex: github_pat_xxx[:password]
        const tokenPart = userinfo.split(':')[0] || '';
        try { return decodeURIComponent(tokenPart); } catch { return tokenPart; }
      } catch { return ''; }
    }

    async function tryCommit(message: string) {
      const res = await runCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`, projectRoot, d => sendLog(maskToken(d)));
      // commit pode falhar (nothing to commit) — logamos e prosseguimos
      if (!res.ok) {
        sendLog('git commit retornou não-zero (possível: nothing to commit) — prosseguindo.');
      }
      return res;
    }

    // push usando header Authorization Basic (evita prompts do credential manager)
    async function pushWithToken(repoUrl: string, token: string, branch: string) {
  if (!repoUrl || !token) {
    return { ok: false, stdout: '', stderr: 'repoUrl ou token ausente' } as RunResult;
  }

  // remove userinfo e normaliza
  const cleanUrl = stripUserInfoFromUrl(repoUrl).replace(/\/+$/, '');
  const headerVal = base64Encode(`x-access-token:${token}`);

  // usa exatamente a URL fornecida, sem recriar a partir de repoPath
  const cmd = `git -c http.extraHeader="Authorization: Basic ${headerVal}" push "${cleanUrl}" ${branch}`;

  const res = await runCommand(cmd, projectRoot, d => sendLog(maskToken(d, token)));

  if (!res.ok && (((res.stderr || '') + (res.stdout || '')).toLowerCase().includes('rejected') ||
    ((res.stderr || '') + (res.stdout || '')).toLowerCase().includes('fetch'))) {
    sendLog('Push rejeitado — tentando rebase e repetir push...');
    await runCommand(`git -c http.extraHeader="Authorization: Basic ${headerVal}" pull --rebase "${cleanUrl}" ${branch}`, projectRoot, d => sendLog(maskToken(d, token)));
    const retry = await runCommand(cmd, projectRoot, d => sendLog(maskToken(d, token)));
    return retry;
  }

  return res;
}


    sendLog(`Usando projectRoot: "${projectRoot}" - fonte: workspace`);

    async function sendStatus() {
      const projectRootNorm = normalizeFsPath(projectRoot);
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

      if (!files || files.length === 0) {
        const res = await runCommand('git status --porcelain', projectRoot, d => sendLog(d));
        files = (res.stdout || '')
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .map(l => (l.length > 3 ? l.slice(3).trim() : l.trim()));

        files = files
          .map(f => path.resolve(projectRoot, f))
          .filter(abs => normalizeFsPath(abs).startsWith(projectRootNorm))
          .map(abs => path.relative(projectRoot, abs).replace(/\\/g, '/'));
      }

      files = Array.from(new Set((files || []).filter(Boolean)));
      panel.webview.postMessage({ type: 'status', files });
    }

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
      // remove userinfo e barra final antes de salvar
      const sanitized = stripUserInfoFromUrl(normalized).replace(/\/+$/, '');
      if (!sanitized) {
        vscode.window.showWarningMessage('Repo URL vazio. Informe uma URL válida.');
        sendLog('Repo URL vazio. Nada salvo.');
        panel.webview.postMessage({ type: 'repoSaveResult', ok: false, text: 'vazio' });
        return;
      }
      const key = workspaceRepoKey(projectRoot);
      const existing = context.workspaceState.get<string>(key, '');
      if (existing === sanitized) {
        const msg = 'Repo URL já salvo.';
        vscode.window.showWarningMessage(msg);
        sendLog(msg);
        panel.webview.postMessage({ type: 'repoSaveResult', ok: false, text: 'duplicado' });
        return;
      }
      await context.workspaceState.update(key, sanitized);
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
        if (ghToken && testUrl.startsWith('https://')) {
          // use header approach for test too
          const headerVal = base64Encode(`x-access-token:${ghToken}`);
          const cmd = `git -c http.extraHeader="Authorization: Basic ${headerVal}" ls-remote --exit-code https://github.com/${repoPath}.git`;
          const res = await runCommand(cmd, projectRoot, d => sendLog(maskToken(d, ghToken)));
          if (res.ok) return { ok: true, text: 'Acesso ao GitHub OK (ls-remote funcionou).' };
          return { ok: false, text: 'Falha ao acessar repositório remoto: ' + (res.stderr || res.stdout) };
        } else {
          const res = await runCommand(`git ls-remote --exit-code "${testUrl}"`, projectRoot, d => sendLog(d));
          if (res.ok) return { ok: true, text: 'Acesso ao GitHub OK (ls-remote funcionou).' };
          return { ok: false, text: 'Falha ao acessar repositório remoto: ' + (res.stderr || res.stdout) };
        }
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
          await context.workspaceState.update(workspaceRepoKey(projectRoot), '');
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
          const repoUrlSaved = context.workspaceState.get<string>(workspaceRepoKey(projectRoot), '').trim();
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
          const repoUrlSaved = String(context.workspaceState.get<string>(workspaceRepoKey(projectRoot), '') || '').trim();
          // prefer campo; sempre sanitize (remove userinfo e barra final) antes de usar
          let repoUrlToUse = '';
          if (repoUrlFromField) {
            const s = stripUserInfoFromUrl(repoUrlFromField).replace(/\/+$/, '');
            repoUrlToUse = s;
            // salva a versão sanitizada (saveRepoUrlIfNew sanitiza também, mas manter consistência)
            await saveRepoUrlIfNew(repoUrlFromField);
          } else if (repoUrlSaved) {
            // ⚠️ Verifica se repo salvo ainda é válido e corresponde ao repositório atual
            const sanitized = stripUserInfoFromUrl(repoUrlSaved).replace(/\/+$/, '');
             if (sanitized.includes('Primeira-aplica-o.git')) {
             sendLog('Repo salvo antigo detectado — ignorando cache.');
             repoUrlToUse = '';
           } else {
          repoUrlToUse = sanitized;
         }
          }

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

            // sanitize remote URL (remove eventual token/userinfo)
            const rawRemoteUrl = repoUrlToUse;
            const sanitizedRemoteUrl = stripUserInfoFromUrl(rawRemoteUrl);
            if (githubSelected) {
              const ghToken = (await getSecret(context, GITHUB_SECRET_KEY)) || '';
              const repoPath = getRepoPathFromUrl(sanitizedRemoteUrl);
              // add sanitized origin (never add tokenized URL)

              await runCommand('git remote remove origin || true', projectRoot);
              await runCommand(`git remote add origin "${sanitizedRemoteUrl}"`, projectRoot);

              await runCommand(`git remote add origin "${sanitizedRemoteUrl}"`, projectRoot, d => sendLog(d));
              await runCommand('git branch -M main', projectRoot, d => sendLog(d));
              if (ghToken && repoPath) {
                const firstPush = await pushWithToken(repoPath, ghToken, 'main');
                sendLog(maskToken(firstPush.stdout || firstPush.stderr, ghToken));
              } else {
                const firstPush = await runCommand('git push -u origin main', projectRoot, d => sendLog(d));
                sendLog(firstPush.stdout || firstPush.stderr);
              }
            } else {
              await runCommand(`git remote add origin "${sanitizedRemoteUrl}"`, projectRoot, d => sendLog(d));
              await runCommand('git branch -M main', projectRoot, d => sendLog(d));
              const firstPush = await runCommand('git push -u origin main', projectRoot, d => sendLog(d));
              sendLog(firstPush.stdout || firstPush.stderr);
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

            // 🔧 Corrige leitura incorreta do repositório salvo
let remoteUrl = '';
const storedUrl = context.workspaceState.get<string>(workspaceRepoKey(projectRoot));
if (storedUrl && storedUrl.trim() && !storedUrl.includes('Primeira-aplica-o.git')) {
  remoteUrl = storedUrl.trim();
} else {
  remoteUrl = repoUrlToUse;
  // força regravar o valor correto e eliminar cache antigo
  await context.workspaceState.update(workspaceRepoKey(projectRoot), repoUrlToUse);
}

// Se ainda não há remote, tenta obter do Git
if (!remoteUrl) {
  const rem = await runCommand('git remote get-url origin', projectRoot);
  if (rem.ok) remoteUrl = (rem.stdout || '').trim();
}


            // sanitize remote URL (remove userinfo if user saved tokenized URL)
            const rawRemote = remoteUrl || '';
            const sanitizedRemote = stripUserInfoFromUrl(rawRemote);

            // ensure origin exists and points to sanitized URL (avoid token-in-url causing "Bad hostname")
            const originCheck = await runCommand('git remote get-url origin', projectRoot);
            // se origin existir e contiver credenciais embutidas — capture token (não salvo) e sanitize origin
            let tokenFromOrigin = '';
            if (originCheck.ok) {
              const currentOrigin = (originCheck.stdout || '').trim();
              const currentHasCreds = currentOrigin && currentOrigin !== sanitizedRemote;
              if (currentHasCreds) {
                sendLog('Origin contém credenciais na URL. Extraindo token (não salvo) e substituindo por URL sanitizada.');
                tokenFromOrigin = extractTokenFromUrl(currentOrigin) || '';
                await runCommand(`git remote set-url origin "${sanitizedRemote}"`, projectRoot, d => sendLog(maskToken(d, tokenFromOrigin)));
              }
            } else if (!originCheck.ok && sanitizedRemote) {
              await runCommand(`git remote add origin "${sanitizedRemote}"`, projectRoot, d => sendLog(d));
            }

            // escolha de token: campo > secret salvo > token extraído da origin
            const effectiveToken = ghToken || tokenFromOrigin || '';
            const repoPath = getRepoPathFromUrl(sanitizedRemote || remoteUrl || '') || '';

            if (effectiveToken && repoPath) {
              const pushRes = await pushWithToken(sanitizedRemote, effectiveToken, branch);
              sendLog(maskToken(pushRes.stdout || pushRes.stderr, effectiveToken));
            } else {
              // Sem token: tentar fallback SSH (se houver chave SSH configurada para github.com)
              sendLog('Sem token — tentando fallback SSH (se chave SSH configurada)...');
              const possibleRepoPath = repoPath || getRepoPathFromUrl(sanitizedRemote || remoteUrl || '');
              if (!possibleRepoPath) {
                sendLog('Repo path não detectado — impossível tentar SSH. Forneça token ou configure remote SSH.');
                vscode.window.showWarningMessage('Deploy GitHub cancelado: repo inválido. Forneça token ou configure SSH.');
              } else {
                // testar autenticação SSH sem prompts
                const sshTest = await runCommand('ssh -o BatchMode=yes -T git@github.com', projectRoot, d => sendLog(d));
                const sshOk = sshTest.ok || /successfully authenticated/i.test((sshTest.stdout || '') + (sshTest.stderr || ''));
                if (!sshOk) {
                  sendLog('Fallback SSH falhou (sem chave autenticada). Push cancelado.');
                  vscode.window.showWarningMessage('Deploy GitHub cancelado: sem token e SSH não autenticado. Configure token ou SSH.');
                } else {
                  const sshUrl = `git@github.com:${possibleRepoPath}.git`;
                  sendLog(`SSH autenticado — usando URL SSH temporária: ${sshUrl}`);
                  // salvar origin atual para restaurar
                  const originCheck2 = await runCommand('git remote get-url origin', projectRoot);
                  const oldOrigin = originCheck2.ok ? (originCheck2.stdout || '').trim() : '';
                  // set origin para ssh e push
                  await runCommand(`git remote set-url origin "${sshUrl}"`, projectRoot, d => sendLog(d));
                  const pushRes = await runCommand(`git push origin ${branch}`, projectRoot, d => sendLog(d));
                  sendLog(pushRes.stdout || pushRes.stderr);
                  // restaurar origin anterior (ou remover se não havia)
                  if (oldOrigin) {
                    await runCommand(`git remote set-url origin "${oldOrigin}"`, projectRoot, d => sendLog(d));
                  } else {
                    await runCommand('git remote remove origin', projectRoot, d => sendLog(d));
                  }
                }
              }
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

    await sendStatus();
  });

  const clearToken = vscode.commands.registerCommand('deploy-extension.clearVercelToken', async () => {
    await deleteSecret(context, VERCEL_SECRET_KEY);
    vscode.window.showInformationMessage('Token do Vercel removido do armazenamento seguro.');
  });

  context.subscriptions.push(disposable, clearToken);
}
