import * as vscode from 'vscode';

export function getTimestamp(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour12: false });
}

export function createLogFunction(panel: vscode.WebviewPanel) {
  return function sendLog(text: string): void {
    try {
      const timestamp = getTimestamp();
      const logLine = `[${timestamp}] ${text}`;
      panel.webview.postMessage({ 
        type: 'log', 
        text: logLine
      });
    } catch (e) {
      console.error('Erro ao enviar log:', e);
    }
  };
}

export function maskToken(str: string, token?: string): string {
  if (!str || !token) return str;
  try {
    return String(str).split(token).join('***');
  } catch {
    return str;
  }
}

export function stripUserInfoFromUrl(url: string): string {
  try {
    if (!url) return url;
    return String(url).replace(/^(https?:\/\/)[^@\/]+@/i, '$1');
  } catch {
    return url;
  }
}