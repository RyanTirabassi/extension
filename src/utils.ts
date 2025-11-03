import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { RunResult } from './types';

export function runCommand(cmd: string, cwd: string, onData?: (d: string) => void): Promise<RunResult> {
  return new Promise(resolve => {
    const p = exec(cmd, { cwd, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
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
    let u = String(url).trim();
    if (u.startsWith('https://')) u = u.replace('https://', '');
    if (u.includes('@')) {
      const parts = u.split('@');
      u = parts[parts.length - 1];
    }
    const parts = u.split('/');
    const owner = parts[1] || '';
    const repo = (parts[2] || '').replace(/\.git$/, '');
    return owner && repo ? `${owner}/${repo}` : '';
  } catch {
    return '';
  }
}