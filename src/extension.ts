// src/extension.ts
import * as vscode from 'vscode';
import { registerPanelCommand } from './panel';

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 Deploy extension activated');
  registerPanelCommand(context);
}

export function deactivate() {
  console.log('Deploy extension deactivated');
}

























