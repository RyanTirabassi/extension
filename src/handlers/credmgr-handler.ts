import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { HandlerContext, DeployOptions } from '../core/types';
import { runCommand, getRepoPathFromUrl } from '../utils';
import { initializeRepo, getOrCreateRemote } from '../core/git-operations';

export async function handleSaveCredmgrUrl(message: any, ctx: HandlerContext): Promise<void> {
  const url = String(message.url || '').trim();
  if (!url) return;
  
  await ctx.context.workspaceState.update('credmgrRepoUrl', url);
  ctx.sendLog(`✓ Repo URL salva: ${url}`);
  vscode.window.showInformationMessage('✓ Repo URL salva');
}

export async function handleTestCredmgrConnection(message: any, ctx: HandlerContext): Promise<void> {
  const url = String(message.url || '').trim();
  
  ctx.sendLog('🔍 Testando conexão via Git Credential Manager...');
  
  const repoPath = getRepoPathFromUrl(url);
  if (!repoPath) {
    ctx.panel.webview.postMessage({
      type: 'credmgrConnectionResult',
      success: false,
      error: 'URL inválida'
    });
    return;
  }
  
  const testUrl = `https://github.com/${repoPath}.git`;
  const result = await runCommand(
    `git ls-remote --exit-code "${testUrl}"`,
    ctx.projectRoot,
    d => ctx.sendLog(d)
  );
  
  if (result.ok) {
    ctx.sendLog('✓ Conexão estabelecida com sucesso');
    ctx.panel.webview.postMessage({
      type: 'credmgrConnectionResult',
      success: true
    });
  } else {
    ctx.sendLog('✗ Falha na conexão');
    ctx.panel.webview.postMessage({
      type: 'credmgrConnectionResult',
      success: false,
      error: result.stderr || 'Erro desconhecido'
    });
  }
}

export async function handleLoadFileStructure(message: any, ctx: HandlerContext): Promise<void> {
  ctx.sendLog('📂 Carregando estrutura de arquivos...');
  const structure = await loadProjectFileStructure(ctx.projectRoot);
  ctx.panel.webview.postMessage({
    type: 'fileStructureLoaded',
    structure: structure
  });
}

export async function handleDeployCredmgr(message: any, ctx: HandlerContext): Promise<void> {
  const url = String(message.url || '').trim();
  const commitMsg = String(message.commitMsg || 'deploy: automated').trim();
  const branch = String(message.branch || 'main').trim();
  const files = message.files as string[] || [];
  const options: DeployOptions = message.options || { 
    runBuild: false, 
    validate: false, 
    generateReport: false 
  };
  
  if (!url || files.length === 0) {
    ctx.sendLog('✗ URL ou arquivos não fornecidos');
    return;
  }
  
  ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ctx.sendLog('🚀 DEPLOY VIA CREDMGR INICIADO');
  ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    await initializeRepo(ctx.projectRoot, ctx.sendLog);
    await getOrCreateRemote(ctx.projectRoot, url, ctx.sendLog);
    
    if (options.runBuild) {
      ctx.sendLog('📦 Executando build...');
      const buildResult = await runCommand('npm run build', ctx.projectRoot, d => ctx.sendLog(d));
      if (!buildResult.ok) {
        ctx.sendLog('⚠️ Build falhou, mas continuando...');
      } else {
        ctx.sendLog('✓ Build concluído');
      }
    }
    
    if (options.validate) {
      ctx.sendLog('🔍 Validando arquivos...');
      const validationErrors = validateSelectedFiles(ctx.projectRoot, files);
      if (validationErrors.length > 0) {
        ctx.sendLog(`⚠️ ${validationErrors.length} arquivo(s) não encontrado(s)`);
        validationErrors.forEach(err => ctx.sendLog(`  • ${err}`));
      } else {
        ctx.sendLog('✓ Todos os arquivos validados');
      }
    }
    
    ctx.sendLog('📋 Adicionando arquivos selecionados...');
    for (const file of files) {
      const filePath = path.join(ctx.projectRoot, file);
      if (fs.existsSync(filePath)) {
        await runCommand(`git add "${file}"`, ctx.projectRoot);
      }
    }
    ctx.sendLog(`✓ ${files.length} arquivo(s) adicionado(s)`);
    
    ctx.sendLog('💾 Fazendo commit...');
    const commitResult = await runCommand(
      `git commit -m "${commitMsg}"`,
      ctx.projectRoot,
      d => ctx.sendLog(d)
    );
    
    if (!commitResult.ok && !commitResult.stderr.includes('nothing to commit')) {
      ctx.sendLog('⚠️ Nenhuma alteração para commit');
    } else {
      ctx.sendLog('✓ Commit realizado');
    }
    
    ctx.sendLog(`🚀 Fazendo push para ${branch}...`);
    const pushResult = await runCommand(
      `git push -u origin ${branch}`,
      ctx.projectRoot,
      d => ctx.sendLog(d)
    );
    
    if (!pushResult.ok) {
      throw new Error(pushResult.stderr || 'Push falhou');
    }
    
    ctx.sendLog('✓ Push concluído com sucesso');
    
    if (options.generateReport) {
      ctx.sendLog('📊 Gerando relatório de deploy...');
      const totalSize = calculateFilesSize(ctx.projectRoot, files);
      ctx.sendLog(`📦 Total: ${files.length} arquivos (${formatBytes(totalSize)})`);
    }
    
    ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    ctx.sendLog('✓ DEPLOY CONCLUÍDO COM SUCESSO ✓');
    ctx.sendLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const totalSize = calculateFilesSize(ctx.projectRoot, files);
    ctx.panel.webview.postMessage({
      type: 'credmgrDeployComplete',
      fileCount: files.length,
      size: formatBytes(totalSize),
      branch: branch
    });
    
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    ctx.sendLog(`✗ Erro no deploy: ${errorMsg}`);
    ctx.panel.webview.postMessage({
      type: 'credmgrDeployError',
      error: errorMsg
    });
    throw error;
  }
}

export async function handleSavePreset(message: any, ctx: HandlerContext): Promise<void> {
  const preset = message.preset;
  const presets = ctx.context.workspaceState.get('credmgrPresets', []) as any[];
  presets.push(preset);
  await ctx.context.workspaceState.update('credmgrPresets', presets);
  ctx.sendLog(`✓ Preset "${preset.name}" salvo`);
  vscode.window.showInformationMessage(`✓ Preset "${preset.name}" salvo`);
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function validateSelectedFiles(projectRoot: string, selectedFiles: string[]): string[] {
  const errors: string[] = [];
  
  for (const file of selectedFiles) {
    const fullPath = path.join(projectRoot, file);
    if (!fs.existsSync(fullPath)) {
      errors.push(file);
    }
  }
  
  return errors;
}

function calculateFilesSize(projectRoot: string, selectedFiles: string[]): number {
  let totalSize = 0;
  
  for (const file of selectedFiles) {
    const fullPath = path.join(projectRoot, file);
    try {
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.error(`Erro ao calcular tamanho de ${file}:`, error);
    }
  }
  
  return totalSize;
}

async function loadProjectFileStructure(projectRoot: string): Promise<any[]> {
  const ignorePatterns = ['.git', 'node_modules', '.vscode', '.idea', 'dist', 'build'];
  
  function scanDirectory(dirPath: string, relativePath: string = ''): any[] {
    const results: any[] = [];
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const itemRelativePath = path.join(relativePath, item);
        
        if (ignorePatterns.some(pattern => item.includes(pattern))) {
          continue;
        }
        
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          const children = scanDirectory(fullPath, itemRelativePath);
          results.push({
            name: item,
            path: itemRelativePath,
            type: 'folder',
            count: children.length,
            children: children,
            selected: false
          });
        } else {
          results.push({
            name: item,
            path: itemRelativePath,
            type: 'file',
            size: stats.size,
            selected: false
          });
        }
      }
    } catch (error) {
      console.error(`Erro ao escanear diretório ${dirPath}:`, error);
    }
    
    return results;
  }
  
  return scanDirectory(projectRoot);
}