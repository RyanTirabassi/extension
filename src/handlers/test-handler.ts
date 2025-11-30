import * as vscode from 'vscode';
import { HandlerContext, TestResult } from '../core/types';
import { runCommand, getRepoPathFromUrl, base64Encode } from '../utils';
import { getSecret } from '../secrets';

const GITHUB_SECRET_KEY = 'githubToken';
const VERCEL_SECRET_KEY = 'vercelToken';

export async function handleExecuteTests(message: any, ctx: HandlerContext): Promise<void> {
  ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ctx.sendLog('⚡ INICIANDO TESTES DE DIAGNÓSTICO');
  ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  ctx.panel.webview.postMessage({ type: 'status', text: 'Executando testes...' });
  
  const tests: TestResult[] = [
    { name: 'Git Instalado', icon: '📄', status: 'pending', message: 'Aguardando...', time: '' },
    { name: 'GitHub Acessível', icon: '🐙', status: 'pending', message: 'Aguardando...', time: '' },
    { name: 'Vercel Token', icon: '⚡', status: 'pending', message: 'Aguardando...', time: '' },
    { name: 'Autenticação SSH', icon: '🔐', status: 'pending', message: 'Aguardando...', time: '' }
  ];

  ctx.sendTestUpdate([...tests]);

  // TESTE 1: GIT INSTALADO
  await testGitInstalled(tests, ctx);
  ctx.sendTestUpdate([...tests]);

  // TESTE 2: GITHUB ACESSÍVEL
  await testGithubAccess(tests, ctx);
  ctx.sendTestUpdate([...tests]);

  // TESTE 3: VERCEL TOKEN
  await testVercelToken(tests, ctx);
  ctx.sendTestUpdate([...tests]);

  // TESTE 4: AUTENTICAÇÃO SSH
  await testSSHAuth(tests, ctx);
  ctx.sendTestUpdate([...tests]);

  ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ctx.sendLog('✓ DIAGNÓSTICO CONCLUÍDO');
  ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ctx.panel.webview.postMessage({ type: 'status', text: 'Pronto' });
}

async function testGitInstalled(tests: TestResult[], ctx: HandlerContext): Promise<void> {
  ctx.sendLog('🔍 Testando Git...');
  const startGit = Date.now();
  
  try {
    const gitRes = await runCommand('git --version', ctx.projectRoot);
    const timeGit = ((Date.now() - startGit) / 1000).toFixed(2);
    
    if (gitRes.ok && gitRes.stdout) {
      const version = gitRes.stdout.trim();
      tests[0] = { 
        ...tests[0], 
        status: 'success', 
        message: version, 
        time: `${timeGit}s` 
      };
      ctx.sendLog(`✓ Git: ${version}`);
    } else {
      tests[0] = { 
        ...tests[0], 
        status: 'error', 
        message: 'Git não detectado', 
        time: `${timeGit}s` 
      };
      ctx.sendLog(`✗ Git: Não detectado`);
    }
  } catch (err) {
    const timeGit = ((Date.now() - startGit) / 1000).toFixed(2);
    tests[0] = { 
      ...tests[0], 
      status: 'error', 
      message: 'Erro ao testar Git', 
      time: `${timeGit}s` 
    };
    ctx.sendLog(`✗ Git: Erro ao executar teste`);
  }
}

async function testGithubAccess(tests: TestResult[], ctx: HandlerContext): Promise<void> {
  ctx.sendLog('🔍 Testando GitHub...');
  const startGh = Date.now();
  
  try {
    const repoUrl = ctx.context.workspaceState.get('repoUrl') as string | undefined;
    const ghToken = await getSecret(ctx.context, GITHUB_SECRET_KEY);
    
    if (!repoUrl) {
      const timeGh = ((Date.now() - startGh) / 1000).toFixed(2);
      tests[1] = { 
        ...tests[1], 
        status: 'error', 
        message: 'Repo URL não configurada', 
        time: `${timeGh}s` 
      };
      ctx.sendLog(`✗ GitHub: Repo URL não configurada`);
    } else if (!ghToken) {
      const timeGh = ((Date.now() - startGh) / 1000).toFixed(2);
      tests[1] = { 
        ...tests[1], 
        status: 'error', 
        message: 'Token não configurado', 
        time: `${timeGh}s` 
      };
      ctx.sendLog(`✗ GitHub: Token não configurado`);
    } else {
      const repoPath = getRepoPathFromUrl(repoUrl);
      if (repoPath) {
        const headerVal = base64Encode(`x-access-token:${ghToken}`);
        const testUrl = `https://github.com/${repoPath}.git`;
        const cmd = `git -c http.extraHeader="Authorization: Basic ${headerVal}" ls-remote --exit-code "${testUrl}"`;
        const ghRes = await runCommand(cmd, ctx.projectRoot);
        const timeGh = ((Date.now() - startGh) / 1000).toFixed(2);
        
        if (ghRes.ok) {
          tests[1] = { 
            ...tests[1], 
            status: 'success', 
            message: 'Repositório acesso OK', 
            time: `${timeGh}s` 
          };
          ctx.sendLog(`✓ GitHub: Repositório acessível`);
        } else {
          tests[1] = { 
            ...tests[1], 
            status: 'error', 
            message: 'Acesso negado ou repositório inválido', 
            time: `${timeGh}s` 
          };
          ctx.sendLog(`✗ GitHub: Acesso negado`);
        }
      } else {
        const timeGh = ((Date.now() - startGh) / 1000).toFixed(2);
        tests[1] = { 
          ...tests[1], 
          status: 'error', 
          message: 'URL inválida', 
          time: `${timeGh}s` 
        };
        ctx.sendLog(`✗ GitHub: URL inválida`);
      }
    }
  } catch (err) {
    const timeGh = ((Date.now() - startGh) / 1000).toFixed(2);
    tests[1] = { 
      ...tests[1], 
      status: 'error', 
      message: 'Erro ao testar GitHub', 
      time: `${timeGh}s` 
    };
    ctx.sendLog(`✗ GitHub: Erro ao executar teste`);
  }
}

async function testVercelToken(tests: TestResult[], ctx: HandlerContext): Promise<void> {
  ctx.sendLog('🔍 Testando Vercel...');
  const startVercel = Date.now();
  
  try {
    const vercelToken = await getSecret(ctx.context, VERCEL_SECRET_KEY);
    
    if (!vercelToken) {
      const timeVercel = ((Date.now() - startVercel) / 1000).toFixed(2);
      tests[2] = { 
        ...tests[2], 
        status: 'error', 
        message: 'Token não configurado', 
        time: `${timeVercel}s` 
      };
      ctx.sendLog(`✗ Vercel: Token não configurado`);
    } else {
      const vercelRes = await runCommand(
        `npx vercel whoami --token="${vercelToken}"`,
        ctx.projectRoot
      );
      const timeVercel = ((Date.now() - startVercel) / 1000).toFixed(2);
      
      if (vercelRes.ok && vercelRes.stdout) {
        const user = vercelRes.stdout.trim().split('\n').pop() || 'Usuário';
        tests[2] = { 
          ...tests[2], 
          status: 'success', 
          message: `Vercel: ${user}`, 
          time: `${timeVercel}s` 
        };
        ctx.sendLog(`✓ Vercel: Autenticado como ${user}`);
      } else {
        tests[2] = { 
          ...tests[2], 
          status: 'error', 
          message: 'Token inválido ou expirado', 
          time: `${timeVercel}s` 
        };
        ctx.sendLog(`✗ Vercel: Token inválido`);
      }
    }
  } catch (err) {
    const timeVercel = ((Date.now() - startVercel) / 1000).toFixed(2);
    tests[2] = { 
      ...tests[2], 
      status: 'error', 
      message: 'Erro ao testar Vercel', 
      time: `${timeVercel}s` 
    };
    ctx.sendLog(`✗ Vercel: Erro ao executar teste`);
  }
}

async function testSSHAuth(tests: TestResult[], ctx: HandlerContext): Promise<void> {
  ctx.sendLog('🔍 Testando SSH...');
  const startSSH = Date.now();
  
  try {
    const sshRes = await runCommand(
      'ssh -o BatchMode=yes -o ConnectTimeout=5 -T git@github.com',
      ctx.projectRoot
    );
    const timeSSH = ((Date.now() - startSSH) / 1000).toFixed(2);
    const sshOutput = (sshRes.stdout || '') + (sshRes.stderr || '');
    
    if (sshOutput.includes('successfully authenticated')) {
      tests[3] = { 
        ...tests[3], 
        status: 'success', 
        message: 'SSH autenticado com sucesso', 
        time: `${timeSSH}s` 
      };
      ctx.sendLog(`✓ SSH: Autenticado com sucesso`);
    } else if (sshOutput.toLowerCase().includes('permission denied')) {
      tests[3] = { 
        ...tests[3], 
        status: 'error', 
        message: 'SSH não configurado', 
        time: `${timeSSH}s` 
      };
      ctx.sendLog(`✗ SSH: Permissão negada`);
    } else {
      tests[3] = { 
        ...tests[3], 
        status: 'success', 
        message: 'SSH configurado', 
        time: `${timeSSH}s` 
      };
      ctx.sendLog(`✓ SSH: Configurado`);
    }
  } catch (err) {
    const timeSSH = ((Date.now() - startSSH) / 1000).toFixed(2);
    tests[3] = { 
      ...tests[3], 
      status: 'error', 
      message: 'Erro ao testar SSH', 
      time: `${timeSSH}s` 
    };
    ctx.sendLog(`✗ SSH: Erro ao executar teste`);
  }
}