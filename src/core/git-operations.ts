import * as path from 'path';
import * as fs from 'fs';
import { runCommand } from '../utils';
import { stripUserInfoFromUrl } from './logging';

export async function initializeRepo(
  projectRoot: string,
  sendLog: (text: string) => void
): Promise<void> {
  const gitDir = path.join(projectRoot, '.git');
  
  if (!fs.existsSync(gitDir)) {
    sendLog('📂 Inicializando repositório Git...');
    await runCommand('git init', projectRoot, d => sendLog(d));
    await runCommand('git config user.email "deploy@automatico.local"', projectRoot, d => sendLog(d));
    await runCommand('git config user.name "Deploy Automático"', projectRoot, d => sendLog(d));
    await runCommand('git add .', projectRoot, d => sendLog(d));
    await runCommand('git commit -m "Initial commit"', projectRoot, d => sendLog(d));
    sendLog('✓ Repositório inicializado');
  } else {
    sendLog('ℹ️ Repositório Git já existe');
  }
}

export async function getOrCreateRemote(
  projectRoot: string,
  repoUrl: string,
  sendLog: (text: string) => void
): Promise<string> {
  const remoteUrl = stripUserInfoFromUrl(repoUrl).replace(/\/+$/, '');
  const checkRemote = await runCommand('git remote get-url origin', projectRoot);
  
  if (!checkRemote.ok) {
    sendLog('🔗 Adicionando remote origin...');
    await runCommand(`git remote add origin "${remoteUrl}"`, projectRoot, d => sendLog(d));
    sendLog('✓ Remote origin adicionado');
  } else {
    const currentRemote = stripUserInfoFromUrl((checkRemote.stdout || '').trim());
    if (currentRemote !== remoteUrl) {
      sendLog('🔄 Atualizando remote origin...');
      await runCommand(`git remote set-url origin "${remoteUrl}"`, projectRoot, d => sendLog(d));
      sendLog('✓ Remote origin atualizado');
    } else {
      sendLog('ℹ️ Remote origin já está configurado');
    }
  }
  
  return remoteUrl;
}

export async function getCurrentBranch(projectRoot: string): Promise<string> {
  const branchRes = await runCommand('git rev-parse --abbrev-ref HEAD', projectRoot);
  return (branchRes.stdout || '').trim() || 'main';
}