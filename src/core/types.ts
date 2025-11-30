import * as vscode from 'vscode';

export interface TestResult {
  name: string;
  icon: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  time: string;
}

export interface SSHKey {
  id: string;
  name: string;
  path: string;
  type: string;
  recommended?: boolean;
  verified?: boolean;
}

export interface DeployOptions {
  runBuild: boolean;
  validate: boolean;
  generateReport: boolean;
}

export interface HandlerContext {
  panel: vscode.WebviewPanel;
  context: vscode.ExtensionContext;
  projectRoot: string;
  sendLog: (text: string) => void;
  sendTestUpdate: (tests: TestResult[]) => void;
}

export interface MessageHandler {
  (message: any, ctx: HandlerContext): Promise<void>;
}