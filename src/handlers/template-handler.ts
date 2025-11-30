import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { HandlerContext } from '../core/types';

export async function handleApplyTemplate(message: any, ctx: HandlerContext): Promise<void> {
  const content = String(message.content || '').trim();
  const openFile = message.openFile !== false;
  const workflowDir = path.join(ctx.projectRoot, '.github', 'workflows');

  try {
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
      ctx.sendLog('✓ Diretório .github/workflows criado');
    }

    const deployYamlPath = path.join(workflowDir, 'deploy.yml');
    fs.writeFileSync(deployYamlPath, content, 'utf-8');
    ctx.sendLog('✓ Arquivo .github/workflows/deploy.yml criado');

    if (openFile) {
      const deployYamlUri = vscode.Uri.file(deployYamlPath);
      const document = await vscode.workspace.openTextDocument(deployYamlUri);
      await vscode.window.showTextDocument(document);
      ctx.sendLog('📄 Arquivo aberto no editor');
    }

    vscode.window.showInformationMessage('✓ Template aplicado com sucesso!');
  } catch (err: any) {
    const errMsg = `✖ Erro ao aplicar template: ${err?.message}`;
    ctx.sendLog(errMsg);
    vscode.window.showErrorMessage(errMsg);
  }
}