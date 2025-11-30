import * as vscode from 'vscode';
import { HandlerContext } from '../core/types';
import { storeSecret, getSecret, deleteSecret } from '../secrets';
import { runCommand, base64Encode, getRepoPathFromUrl } from '../utils';
import { initializeRepo, getOrCreateRemote, getCurrentBranch } from '../core/git-operations';
import { maskToken, stripUserInfoFromUrl } from '../core/logging';

const GITHUB_SECRET_KEY = 'githubToken';
const VERCEL_SECRET_KEY = 'vercelToken';

export async function handleSaveGithubToken(message: any, ctx: HandlerContext): Promise<void> {
  const token = String(message.token || '').trim();
  if (!token) return;
  
  await storeSecret(ctx.context, GITHUB_SECRET_KEY, token);
  ctx.sendLog('✓ GitHub token salvo');
  ctx.panel.webview.postMessage({ type: 'tokenStatus', tokenType: 'github', isSaved: true });
  vscode.window.showInformationMessage('✓ GitHub token salvo');
}

export async function handleSaveVercelToken(message: any, ctx: HandlerContext): Promise<void> {
  const token = String(message.token || '').trim();
  if (!token) return;
  
  await storeSecret(ctx.context, VERCEL_SECRET_KEY, token);
  ctx.sendLog('✓ Vercel token salvo');
  ctx.panel.webview.postMessage({ type: 'tokenStatus', tokenType: 'vercel', isSaved: true });
  vscode.window.showInformationMessage('✓ Vercel token salvo');
}

export async function handleClearGithubToken(message: any, ctx: HandlerContext): Promise<void> {
  await deleteSecret(ctx.context, GITHUB_SECRET_KEY);
  ctx.sendLog('✓ GitHub token removido');
  ctx.panel.webview.postMessage({ type: 'tokenStatus', tokenType: 'github', isSaved: false });
  vscode.window.showInformationMessage('✓ GitHub token removido');
}

export async function handleClearVercelToken(message: any, ctx: HandlerContext): Promise<void> {
  await deleteSecret(ctx.context, VERCEL_SECRET_KEY);
  ctx.sendLog('✓ Vercel token removido');
  ctx.panel.webview.postMessage({ type: 'tokenStatus', tokenType: 'vercel', isSaved: false });
  vscode.window.showInformationMessage('✓ Vercel token removido');
}

export async function handleSaveRepoUrl(message: any, ctx: HandlerContext): Promise<void> {
  const url = String(message.url || '').trim();
  if (!url) return;
  
  await ctx.context.workspaceState.update('repoUrl', url);
  ctx.sendLog(`✓ Repo URL salva: ${url}`);
  vscode.window.showInformationMessage('✓ Repo URL salva');
}

export async function handleDeploy(message: any, ctx: HandlerContext): Promise<void> {
  ctx.sendLog('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ctx.sendLog('🚀 INICIANDO DEPLOY');
  ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const repoUrl = String(message.repoUrl || '').trim();
  const ghToken = String(message.ghToken || '').trim();
  const commitMsg = String(message.commitMessage || 'deploy: automated').trim();

  if (!repoUrl) {
    ctx.sendLog('✖ ERRO: Repo URL não fornecida');
    vscode.window.showErrorMessage('✖ Repo URL não fornecida');
    return;
  }

  try {
    ctx.sendLog('📋 Passo 1/5: Inicializando repositório...');
    await initializeRepo(ctx.projectRoot, ctx.sendLog);

    ctx.sendLog('📋 Passo 2/5: Configurando remote...');
    await getOrCreateRemote(ctx.projectRoot, repoUrl, ctx.sendLog);

    ctx.sendLog('📋 Passo 3/5: Preparando arquivos...');
    await runCommand('git add .', ctx.projectRoot, d => ctx.sendLog(d));
    ctx.sendLog('✓ Arquivos preparados');

    ctx.sendLog('📋 Passo 4/5: Fazendo commit...');
    const commitRes = await runCommand(`git commit -m "${commitMsg}"`, ctx.projectRoot, d => ctx.sendLog(d));
    if (!commitRes.ok) {
      ctx.sendLog('ℹ️ Nenhuma alteração para fazer commit');
    } else {
      ctx.sendLog('✓ Commit realizado');
    }

    const branch = await getCurrentBranch(ctx.projectRoot);
    ctx.sendLog(`📌 Branch atual: ${branch}`);

    ctx.sendLog('📋 Passo 5/5: Fazendo push...');
    const pushResult = await pushWithToken(repoUrl, ghToken, branch, ctx);

    if (!pushResult.ok) {
      throw new Error(pushResult.stderr || pushResult.stdout || 'Push falhou');
    }

    ctx.sendLog('✓ Push completado com sucesso');
    ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    ctx.sendLog('✓ DEPLOY CONCLUÍDO COM SUCESSO ✓');
    ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    vscode.window.showInformationMessage('✓ Deploy realizado com sucesso!');
    ctx.panel.webview.postMessage({ type: 'deployComplete' });

  } catch (err: any) {
    const errMsg = err.message || String(err);
    ctx.sendLog(`✖ ERRO: ${errMsg}`);
    ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    ctx.sendLog('✖ DEPLOY FALHOU');
    ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    vscode.window.showErrorMessage(`✖ Deploy falhou: ${errMsg}`);
  }
}

async function pushWithToken(
  repoUrl: string, 
  token: string, 
  branch: string,
  ctx: HandlerContext
) {
  const cleanUrl = stripUserInfoFromUrl(repoUrl).replace(/\/+$/, '');
  const headerVal = base64Encode(`x-access-token:${token}`);
  const cmd = `git -c http.extraHeader="Authorization: Basic ${headerVal}" push -u origin ${branch}`;

  ctx.sendLog(`📤 Fazendo push para ${cleanUrl} (branch: ${branch})...`);
  const res = await runCommand(cmd, ctx.projectRoot, d => ctx.sendLog(maskToken(d, token)));

  if (!res.ok) {
    const output = ((res.stderr || '') + (res.stdout || '')).toLowerCase();
    if (output.includes('rejected')) {
      ctx.sendLog('⚠️ Push rejeitado - tentando rebase...');
      const rebaseCmd = `git -c http.extraHeader="Authorization: Basic ${headerVal}" pull --rebase origin ${branch}`;
      await runCommand(rebaseCmd, ctx.projectRoot, d => ctx.sendLog(maskToken(d, token)));
      const retry = await runCommand(cmd, ctx.projectRoot, d => ctx.sendLog(maskToken(d, token)));
      return retry;
    }
  }
  
  return res;
}