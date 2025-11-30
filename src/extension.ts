import * as vscode from 'vscode';
import { registerPanelCommand } from './panel';

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 Deploy Automático v2 ativado');
  registerPanelCommand(context);
}

export function deactivate() {
  console.log('Deploy Automático v2 desativado');
}

























