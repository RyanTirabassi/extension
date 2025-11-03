import * as vscode from 'vscode';

export async function storeSecret(context: vscode.ExtensionContext, key: string, value: string): Promise<void> {
  await context.secrets.store(key, String(value || '').trim());
}

export async function getSecret(context: vscode.ExtensionContext, key: string): Promise<string | undefined> {
  return await context.secrets.get(key);
}

export async function deleteSecret(context: vscode.ExtensionContext, key: string): Promise<void> {
  await context.secrets.delete(key);
}