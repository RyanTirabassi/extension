import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { HandlerContext, SSHKey } from '../core/types';
import { runCommand } from '../utils';
import { initializeRepo, getOrCreateRemote } from '../core/git-operations';

export async function handleScanSSHKeys(message: any, ctx: HandlerContext): Promise<void> {
  const sshDir = path.join(os.homedir(), '.ssh');
  const keys: SSHKey[] = [];
  
  try {
    if (!fs.existsSync(sshDir)) {
      ctx.sendLog('⚠️ Diretório ~/.ssh não encontrado');
      ctx.panel.webview.postMessage({ type: 'sshKeysScanned', keys: [] });
      return;
    }

    const files = fs.readdirSync(sshDir);
    const keyPatterns = ['id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa'];
    
    keyPatterns.forEach(pattern => {
      if (files.includes(pattern)) {
        const keyPath = path.join(sshDir, pattern);
        const publicKeyPath = `${keyPath}.pub`;
        
        if (fs.existsSync(publicKeyPath)) {
          let type = 'Unknown';
          
          if (pattern.includes('rsa')) type = 'RSA 4096';
          else if (pattern.includes('ed25519')) type = 'Ed25519';
          else if (pattern.includes('ecdsa')) type = 'ECDSA';
          else if (pattern.includes('dsa')) type = 'DSA';
          
          keys.push({
            id: pattern,
            name: pattern,
            path: keyPath,
            type: type,
            recommended: pattern.includes('ed25519')
          });
        }
      }
    });
    
    ctx.sendLog(`✓ ${keys.length} chave(s) SSH encontrada(s)`);
    ctx.panel.webview.postMessage({ type: 'sshKeysScanned', keys });
  } catch (error: any) {
    ctx.sendLog(`✗ Erro ao escanear chaves SSH: ${error.message}`);
    ctx.panel.webview.postMessage({ type: 'sshKeysScanned', keys: [] });
  }
}

export async function handleTestSSHKey(message: any, ctx: HandlerContext): Promise<void> {
  const keyPath = message.keyPath;
  ctx.sendLog(`⚡ Testando chave SSH: ${keyPath}`);
  
  const testResult = await runCommand(
    'ssh -T git@github.com -o StrictHostKeyChecking=no -o ConnectTimeout=10',
    ctx.projectRoot,
    d => ctx.sendLog(d)
  );
  
  const output = testResult.stdout + testResult.stderr;
  const success = output.includes('successfully authenticated') || 
                  testResult.stderr.includes('successfully authenticated');
  
  ctx.panel.webview.postMessage({
    type: 'sshKeyTestResult',
    keyId: message.keyId,
    success,
    output: success ? 'Autenticado com GitHub' : testResult.stderr
  });
}

export async function handleGenerateSSHKey(message: any, ctx: HandlerContext): Promise<void> {
  const { algo, keyName, email } = message;
  const sshDir = path.join(os.homedir(), '.ssh');
  const keyPath = path.join(sshDir, keyName);
  
  ctx.sendLog(`✨ Gerando chave SSH ${algo.toUpperCase()}...`);
  
  // Cria diretório .ssh se não existir
  if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir, { recursive: true, mode: 0o700 });
  }
  
  let cmd = '';
  if (algo === 'ed25519') {
    cmd = `ssh-keygen -t ed25519 ${email ? `-C "${email}"` : ''} -f "${keyPath}" -N ""`;
  } else {
    cmd = `ssh-keygen -t rsa -b 4096 ${email ? `-C "${email}"` : ''} -f "${keyPath}" -N ""`;
  }
  
  const result = await runCommand(cmd, ctx.projectRoot, d => ctx.sendLog(d));
  
  if (result.ok && fs.existsSync(`${keyPath}.pub`)) {
    const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8');
    
    ctx.panel.webview.postMessage({
      type: 'sshKeyGenerated',
      success: true,
      privatePath: keyPath,
      publicPath: `${keyPath}.pub`,
      publicKey
    });
    
    ctx.sendLog('✓ Chave SSH gerada com sucesso!');
  } else {
    ctx.panel.webview.postMessage({
      type: 'sshKeyGenerated',
      success: false,
      error: result.stderr || 'Erro ao gerar chave'
    });
    
    ctx.sendLog('✗ Erro ao gerar chave SSH');
  }
}

export async function handleCopySSHPublicKey(message: any, ctx: HandlerContext): Promise<void> {
  const keyPath = message.keyPath;
  const publicKeyPath = `${keyPath}.pub`;
  
  try {
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    
    ctx.panel.webview.postMessage({
      type: 'publicKeyCopied',
      success: true,
      publicKey
    });
    
    await vscode.env.clipboard.writeText(publicKey);
    ctx.sendLog('✓ Chave pública copiada para clipboard');
  } catch (error: any) {
    ctx.panel.webview.postMessage({
      type: 'publicKeyCopied',
      success: false,
      error: error.message
    });
    ctx.sendLog('✗ Erro ao copiar chave pública');
  }
}

export async function handleTestSSHConnection(message: any, ctx: HandlerContext): Promise<void> {
  ctx.sendLog('⚡ Testando conexão SSH com GitHub...');
  
  const result = await runCommand(
    'ssh -T git@github.com -o StrictHostKeyChecking=no -o ConnectTimeout=10',
    ctx.projectRoot,
    d => ctx.sendLog(d)
  );
  
  const output = result.stdout + result.stderr;
  const success = output.includes('successfully authenticated') || 
                  result.stderr.includes('successfully authenticated');
  
  ctx.panel.webview.postMessage({
    type: 'sshConnectionTestResult',
    success,
    output: success ? 'Autenticado com GitHub' : result.stderr
  });
}

export async function handleTestSSH(message: any, ctx: HandlerContext): Promise<void> {
  const sshUrl = message.sshUrl;
  ctx.sendLog(`⚡ Testando acesso SSH: ${sshUrl}`);
  
  const result = await runCommand(
    `git ls-remote "${sshUrl}"`,
    ctx.projectRoot,
    d => ctx.sendLog(d)
  );
  
  ctx.panel.webview.postMessage({
    type: 'sshTestResult',
    success: result.ok,
    output: result.stdout || result.stderr
  });
}

export async function handleDeploySSH(message: any, ctx: HandlerContext): Promise<void> {
  const { sshUrl, commitMsg, branch } = message;
  
  ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ctx.sendLog('🚀 INICIANDO DEPLOY VIA SSH');
  ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    await initializeRepo(ctx.projectRoot, ctx.sendLog);
    await getOrCreateRemote(ctx.projectRoot, sshUrl, ctx.sendLog);
    
    await runCommand('git add .', ctx.projectRoot, d => ctx.sendLog(d));
    await runCommand(`git commit -m "${commitMsg}"`, ctx.projectRoot, d => ctx.sendLog(d));
    
    const pushResult = await runCommand(
      `git push -u origin ${branch}`,
      ctx.projectRoot,
      d => ctx.sendLog(d)
    );
    
    if (pushResult.ok) {
      ctx.sendLog('✓ Deploy SSH concluído com sucesso!');
      ctx.panel.webview.postMessage({
        type: 'sshDeployResult',
        success: true,
        output: 'Deploy finalizado'
      });
    } else {
      throw new Error(pushResult.stderr);
    }
  } catch (error: any) {
    ctx.sendLog(`✗ Erro no deploy: ${error.message}`);
    ctx.panel.webview.postMessage({
      type: 'sshDeployResult',
      success: false,
      error: error.message
    });
  }
}

export async function handleCopyToClipboard(message: any, ctx: HandlerContext): Promise<void> {
  await vscode.env.clipboard.writeText(message.text);
  ctx.sendLog('📋 Texto copiado para clipboard');
}

export async function handleOpenURL(message: any, ctx: HandlerContext): Promise<void> {
  await vscode.env.openExternal(vscode.Uri.parse(message.url));
  ctx.sendLog(`🔗 Abrindo URL: ${message.url}`);
}