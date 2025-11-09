import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { RunResult } from './types';

export function runCommand(cmd: string, cwd: string, onData?: (d: string) => void): Promise<RunResult> {
  return new Promise(resolve => {
    // evita prompts interativos e instruí o Git Credential Manager a não abrir UI
    const env = Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' });

    const p = exec(cmd, { cwd, maxBuffer: 1024 * 1024 * 10, env, windowsHide: true }, (err, stdout, stderr) => {
      if (err) resolve({ ok: false, stdout: stdout ?? '', stderr: stderr ?? (err.message ?? '') });
      else resolve({ ok: true, stdout: stdout ?? '', stderr: stderr ?? '' });
    });
    if (p.stdout) p.stdout.on('data', d => onData?.(String(d)));
    if (p.stderr) p.stderr.on('data', d => onData?.(String(d)));
  });
}

export function makeSafeName(name: string) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export function normalizeFsPath(p: string) {
  return path.resolve(p).replace(/\\/g, '/').toLowerCase();
}

export function getRepoPathFromUrl(url?: string) {
  if (!url) return '';
  try {
    const u = String(url).trim();
    // Match end-of-string owner/repo (handles https and ssh forms)
    const m = u.match(/(?:[:\/])([^\/:]+\/[^\/]+?)(?:\.git)?$/);
    if (m && m[1]) return m[1].replace(/\.git$/, '');
    return '';
  } catch {
    return '';
  }
}

export function base64Encode(input: string) {
  return Buffer.from(String(input || ''), 'utf8').toString('base64');
}