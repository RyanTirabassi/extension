import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export type RunResult = { ok: boolean; stdout: string; stderr: string };

export function runCommand(cmd: string, cwd: string, onData?: (d: string) => void): Promise<RunResult> {
  return new Promise(resolve => {
    const env = Object.assign({}, process.env, { 
      GIT_TERMINAL_PROMPT: '0', 
      GCM_INTERACTIVE: 'never',
      GIT_TRACE: '0'
    });

    const p = exec(cmd, { 
      cwd, 
      maxBuffer: 1024 * 1024 * 10, 
      env, 
      windowsHide: true,
      timeout: 60000
    }, (err, stdout, stderr) => {
      if (err) {
        resolve({ 
          ok: false, 
          stdout: stdout ?? '', 
          stderr: stderr ?? (err.message ?? '') 
        });
      } else {
        resolve({ 
          ok: true, 
          stdout: stdout ?? '', 
          stderr: stderr ?? '' 
        });
      }
    });

    if (p.stdout) {
      p.stdout.on('data', d => {
        const data = String(d).trim();
        if (data && onData) onData(data);
      });
    }

    if (p.stderr) {
      p.stderr.on('data', d => {
        const data = String(d).trim();
        if (data && onData) onData(data);
      });
    }
  });
}

export function getRepoPathFromUrl(url?: string): string {
  if (!url) return '';
  try {
    const u = String(url).trim();
    
    const httpsMatch = u.match(/github\.com[:/]([^\/:]+\/[^\/]+?)(?:\.git)?(?:\/)?$/i);
    if (httpsMatch && httpsMatch[1]) {
      return httpsMatch[1].replace(/\.git$/, '');
    }
    
    const sshMatch = u.match(/git@github\.com:([^\/:]+\/[^\/]+?)(?:\.git)?(?:\/)?$/i);
    if (sshMatch && sshMatch[1]) {
      return sshMatch[1].replace(/\.git$/, '');
    }
    
    const genericMatch = u.match(/(?:[:\/])([^\/:]+\/[^\/]+?)(?:\.git)?$/);
    if (genericMatch && genericMatch[1]) {
      return genericMatch[1].replace(/\.git$/, '');
    }
    
    return '';
  } catch {
    return '';
  }
}

export function base64Encode(input: string): string {
  try {
    return Buffer.from(String(input || ''), 'utf8').toString('base64');
  } catch {
    return '';
  }
}

export function validateGithubUrl(url: string): { valid: boolean; message: string } {
  const trimmedUrl = String(url).trim();
  
  if (!trimmedUrl) {
    return { valid: false, message: 'URL vazia' };
  }

  if (trimmedUrl.includes('github.com') && (trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('http://'))) {
    const repoPath = getRepoPathFromUrl(trimmedUrl);
    if (!repoPath || !repoPath.includes('/')) {
      return { valid: false, message: 'Formato HTTPS inválido' };
    }
    return { valid: true, message: 'URL HTTPS válida' };
  }

  if (trimmedUrl.includes('git@github.com:')) {
    const repoPath = getRepoPathFromUrl(trimmedUrl);
    if (!repoPath || !repoPath.includes('/')) {
      return { valid: false, message: 'Formato SSH inválido' };
    }
    return { valid: true, message: 'URL SSH válida' };
  }

  return { valid: false, message: 'URL não parece ser um repositório GitHub válido' };
}

export function validateToken(token: string, type: 'github' | 'vercel'): { valid: boolean; message: string } {
  const trimmedToken = String(token).trim();
  
  if (!trimmedToken) {
    return { valid: false, message: `Token ${type} vazio` };
  }

  if (type === 'github') {
    if (trimmedToken.startsWith('ghp_') || trimmedToken.startsWith('github_pat_')) {
      if (trimmedToken.length < 20) {
        return { valid: false, message: 'Token GitHub muito curto' };
      }
      return { valid: true, message: 'Token GitHub parece válido' };
    }
    return { valid: false, message: 'Token GitHub deve começar com ghp_ ou github_pat_' };
  }

  if (type === 'vercel') {
    if (/^[a-zA-Z0-9_-]+$/.test(trimmedToken)) {
      if (trimmedToken.length < 10) {
        return { valid: false, message: 'Token Vercel muito curto' };
      }
      return { valid: true, message: 'Token Vercel parece válido' };
    }
    return { valid: false, message: 'Token Vercel contém caracteres inválidos' };
  }

  return { valid: false, message: 'Tipo de token desconhecido' };
}

export function getSshKeyPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.ssh', 'id_rsa');
}

export function checkSshKeyExists(): boolean {
  try {
    const keyPath = getSshKeyPath();
    return fs.existsSync(keyPath);
  } catch {
    return false;
  }
}