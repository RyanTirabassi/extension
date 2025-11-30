export const sshPageHTML = `
<div id="ssh" class="tab-content">
  <!-- Section 1: SSH Key Detection -->
  <div class="ssh-section">
    <div class="section-title">🔍 Diagnóstico de Chave SSH</div>
    
    <div id="keyDetectionBox" class="info-box">
      ⏳ Carregando chaves SSH do sistema...
    </div>

    <div class="ssh-keys-list" id="sshKeysList">
      <div class="empty-state">
        <div class="empty-icon">🔑</div>
        <div>Nenhuma chave SSH detectada</div>
      </div>
    </div>

    <div class="button-group">
      <button class="btn-secondary" onclick="refreshKeys()" id="btnRefreshKeys">
        ↻ RECARREGAR CHAVES
      </button>
      <button class="btn-secondary" onclick="testSelectedKey()" id="btnTestKey" disabled>
        ⚡ TESTAR CHAVE
      </button>
    </div>

    <div class="console-output" id="keyTestConsole"></div>
  </div>

  <!-- Section 2: SSH Key Generator -->
  <div class="ssh-section">
    <div class="section-title">🛠️ Gerador de Chave SSH</div>
    
    <div class="info-box">
      💡 Não possui uma chave SSH? Gere uma nova diretamente aqui!
    </div>

    <div class="key-generator">
      <div class="field-label">Selecione o algoritmo:</div>
      
      <div class="key-generator-options">
        <div class="algo-option selected" data-algo="ed25519" onclick="selectAlgo('ed25519')">
          <div class="algo-name">Ed25519</div>
          <div class="algo-desc">Mais rápido e seguro (recomendado)</div>
        </div>
        
        <div class="algo-option" data-algo="rsa" onclick="selectAlgo('rsa')">
          <div class="algo-name">RSA 4096</div>
          <div class="algo-desc">Compatibilidade máxima</div>
        </div>
      </div>

      <div class="field-group" style="margin-top: 16px;">
        <div class="field-label">Nome da chave:</div>
        <input type="text" id="keyName" placeholder="id_ed25519_github" value="id_ed25519_deploy">
      </div>

      <div class="field-group">
        <div class="field-label">Email (opcional):</div>
        <input type="text" id="keyEmail" placeholder="seu-email@example.com">
      </div>

      <button class="btn-success" onclick="generateKey()" id="btnGenerateKey" style="width: 100%; margin-top: 12px;">
        ✨ GERAR NOVA CHAVE SSH
      </button>

      <div class="console-output" id="keyGenConsole"></div>
      
      <div class="key-preview" id="keyPreview">
        <div class="key-preview-title">🔑 Chave Pública Gerada:</div>
        <div class="key-preview-content" id="keyPreviewContent"></div>
        <button class="btn-secondary" onclick="copyGeneratedKey()" style="width: 100%; margin-top: 8px;">
          📋 COPIAR CHAVE PÚBLICA
        </button>
      </div>
    </div>
  </div>

  <!-- Section 3: Setup Guide -->
  <div class="ssh-section">
    <div class="section-title">📖 Guia de Configuração</div>
    
    <div class="ssh-guide-container">
      <div class="ssh-guide-step">
        <div class="ssh-step-header">
          <div class="ssh-step-number" id="step1">1</div>
          <div class="ssh-step-title">Gerar ou selecionar chave SSH</div>
        </div>
        <div class="ssh-step-content">
          <div class="ssh-step-desc" id="step1Desc">
            Selecione uma chave existente ou gere uma nova usando o gerador acima.
          </div>
        </div>
      </div>

      <div class="ssh-guide-step">
        <div class="ssh-step-header">
          <div class="ssh-step-number" id="step2">2</div>
          <div class="ssh-step-title">Copiar chave pública</div>
        </div>
        <div class="ssh-step-content">
          <div class="ssh-step-desc">
            Copie o conteúdo da sua chave pública para adicionar no GitHub.
          </div>
          <div class="ssh-step-action">
            <button class="btn-secondary" onclick="copyPublicKey()" id="btnCopyPublic" disabled>
              📋 COPIAR CHAVE PÚBLICA
            </button>
          </div>
          <div class="key-preview" id="publicKeyPreview"></div>
        </div>
      </div>

      <div class="ssh-guide-step">
        <div class="ssh-step-header">
          <div class="ssh-step-number" id="step3">3</div>
          <div class="ssh-step-title">Adicionar chave no GitHub</div>
        </div>
        <div class="ssh-step-content">
          <div class="ssh-step-desc">
            Vá para <strong>Settings → SSH and GPG keys → New SSH key</strong> e cole sua chave.
          </div>
          <div class="ssh-step-action">
            <button class="btn-secondary" onclick="openGithubSettings()">
              🔗 ABRIR GITHUB SETTINGS
            </button>
          </div>
        </div>
      </div>

      <div class="ssh-guide-step">
        <div class="ssh-step-header">
          <div class="ssh-step-number" id="step4">4</div>
          <div class="ssh-step-title">Testar conexão SSH</div>
        </div>
        <div class="ssh-step-content">
          <div class="ssh-step-desc">
            Teste se sua chave SSH está funcionando corretamente com o GitHub.
          </div>
          <div class="ssh-step-action">
            <button class="btn-primary" onclick="testSSHConnection()" id="btnTestConnection">
              ⚡ TESTAR CONEXÃO
            </button>
          </div>
          <div class="console-output" id="sshTestConsole"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Section 4: Repository Configuration -->
  <div class="ssh-section">
    <div class="section-title">🔐 Configuração do Repositório</div>
    
    <div class="info-box">
      🔐 <strong>SSH:</strong> Certifique-se de ter adicionado sua chave pública no GitHub (Passo 3).
    </div>

    <div class="field-group">
      <div class="field-label">
        <span>URL SSH do Repositório</span>
        <span class="field-status" id="urlStatus">● Não validado</span>
      </div>
      <input 
        type="text" 
        id="sshUrl" 
        placeholder="git@github.com:usuario/repositorio.git"
        value=""
        oninput="validateSSHUrl(this)">
      <div class="validation-indicator" id="urlValidation" style="display: none;"></div>
    </div>

    <div class="field-group">
      <div class="field-label">Mensagem de Commit</div>
      <input type="text" id="commitMsg" value="deploy: automated commit via SSH">
    </div>

    <div class="field-group">
      <div class="field-label">Branch de Destino</div>
      <select id="branchSelect">
        <option value="main">main</option>
        <option value="master">master</option>
        <option value="develop">develop</option>
        <option value="staging">staging</option>
      </select>
    </div>

    <div class="button-group">
      <button class="btn-primary" onclick="testSSH()" id="btnTestSSH" disabled>
        ⚡ TESTAR SSH
      </button>
      <button class="btn-success" onclick="deploySsh()" id="btnDeploySsh" disabled>
        🚀 DEPLOY SSH
      </button>
    </div>

    <div class="console-output" id="deployConsole"></div>
  </div>

  <!-- Section 5: Deploy History -->
  <div class="ssh-section">
    <div class="section-title">📊 Histórico de Deploys SSH</div>
    
    <div class="deploy-history" id="deployHistory">
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div>Nenhum deploy realizado ainda</div>
      </div>
    </div>

    <button class="btn-secondary" onclick="clearHistory()" id="btnClearHistory" style="width: 100%; margin-top: 12px; display: none;">
      🗑️ LIMPAR HISTÓRICO
    </button>
  </div>
</div>
`;

export const sshPageStyles = `
/* SSH Section Base */
.ssh-section {
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
}

/* Field Status */
.field-status {
  font-size: 10px;
  color: #f48771;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: rgba(244, 135, 113, 0.1);
  border-radius: 3px;
  border: 1px solid rgba(244, 135, 113, 0.2);
}

.field-status.detected {
  color: #4ec9b0;
  background: rgba(78, 201, 176, 0.1);
  border-color: rgba(78, 201, 176, 0.2);
}

.field-status.loading {
  color: #dcdcaa;
  background: rgba(220, 220, 170, 0.1);
  border-color: rgba(220, 220, 170, 0.2);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* SSH Keys List */
.ssh-keys-list {
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 12px;
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.ssh-key-item {
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  cursor: pointer;
}

.ssh-key-item:last-child {
  margin-bottom: 0;
}

.ssh-key-item:hover {
  background: #3e3e42;
  border-color: #0066cc;
}

.ssh-key-item.selected {
  background: rgba(0, 102, 204, 0.1);
  border-color: #0066cc;
}

.ssh-key-item.testing {
  animation: testing 1s infinite;
}

@keyframes testing {
  0%, 100% { border-color: #0066cc; }
  50% { border-color: #dcdcaa; }
}

.ssh-key-info {
  flex: 1;
}

.ssh-key-name {
  font-size: 11px;
  font-weight: 600;
  color: #9cdcfe;
  margin-bottom: 4px;
}

.ssh-key-path {
  font-size: 10px;
  color: #858585;
  font-family: 'Courier New', monospace;
}

.ssh-key-type {
  font-size: 9px;
  padding: 2px 8px;
  background: rgba(78, 201, 176, 0.2);
  color: #4ec9b0;
  border-radius: 10px;
  margin-left: 8px;
}

.ssh-key-status {
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 4px;
}

.ssh-key-status.verified {
  background: rgba(78, 201, 176, 0.2);
  color: #4ec9b0;
}

.ssh-key-status.failed {
  background: rgba(244, 135, 113, 0.2);
  color: #f48771;
}

.ssh-key-status.testing {
  background: rgba(220, 220, 170, 0.2);
  color: #dcdcaa;
}

/* Key Generator */
.key-generator {
  background: rgba(0, 102, 204, 0.05);
  border: 1px solid rgba(0, 102, 204, 0.3);
  border-radius: 4px;
  padding: 16px;
  margin-top: 12px;
}

.key-generator-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.algo-option {
  background: #2d2d30;
  border: 2px solid #3e3e42;
  border-radius: 4px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.algo-option:hover {
  border-color: #0066cc;
  background: rgba(0, 102, 204, 0.1);
}

.algo-option.selected {
  border-color: #0066cc;
  background: rgba(0, 102, 204, 0.15);
}

.algo-name {
  font-size: 12px;
  font-weight: 700;
  color: #0066cc;
  margin-bottom: 4px;
}

.algo-desc {
  font-size: 10px;
  color: #858585;
  line-height: 1.4;
}

/* Key Preview */
.key-preview {
  background: #1e1e1e;
  border: 1px solid #4ec9b0;
  border-radius: 4px;
  padding: 12px;
  margin-top: 12px;
  display: none;
}

.key-preview.show {
  display: block;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.key-preview-title {
  font-size: 10px;
  font-weight: 600;
  color: #4ec9b0;
  margin-bottom: 8px;
}

.key-preview-content {
  font-size: 9px;
  font-family: 'Courier New', monospace;
  color: #9cdcfe;
  line-height: 1.4;
  word-break: break-all;
  max-height: 150px;
  overflow-y: auto;
}

/* Console Output */
.console-output {
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 12px;
  margin-top: 12px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  display: none;
}

.console-output.show {
  display: block;
}

.console-line {
  margin-bottom: 4px;
  color: #9cdcfe;
}

.console-line.success {
  color: #4ec9b0;
}

.console-line.error {
  color: #f48771;
}

.console-line.warning {
  color: #dcdcaa;
}

.console-line.info {
  color: #9cdcfe;
}

/* SSH Setup Guide - CORRIGIDO */
.ssh-guide-container {
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 16px;
  margin-top: 12px;
}

.ssh-guide-step {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #3e3e42;
}

.ssh-guide-step:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.ssh-step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.ssh-step-number {
  background: #3e3e42;
  color: #858585;
  font-weight: 700;
  font-size: 11px;
  min-width: 28px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
}

.ssh-step-number.active {
  background: #0066cc;
  color: white;
}

.ssh-step-number.completed {
  background: #4ec9b0;
  color: white;
}

.ssh-step-title {
  font-size: 11px;
  font-weight: 600;
  color: #e0e0e0;
  flex: 1;
}

.ssh-step-content {
  padding-left: 40px;
}

.ssh-step-desc {
  font-size: 10px;
  color: #858585;
  line-height: 1.6;
  margin-bottom: 8px;
}

.ssh-step-action {
  margin-top: 8px;
}

/* Deploy History */
.deploy-history {
  margin-top: 12px;
}

.history-item {
  background: #2d2d30;
  border-left: 3px solid #4ec9b0;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
  font-size: 11px;
  transition: all 0.2s;
  cursor: pointer;
}

.history-item:hover {
  background: #3e3e42;
}

.history-item.error {
  border-left-color: #f48771;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.history-status {
  font-weight: 600;
  color: #4ec9b0;
}

.history-status.error {
  color: #f48771;
}

.history-date {
  font-size: 10px;
  color: #858585;
}

.history-details {
  color: #9cdcfe;
  font-size: 10px;
  font-family: 'Courier New', monospace;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #858585;
  font-size: 11px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.3;
}

/* Validation Indicator */
.validation-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: 3px;
}

.validation-indicator.valid {
  background: rgba(78, 201, 176, 0.1);
  color: #4ec9b0;
}

.validation-indicator.invalid {
  background: rgba(244, 135, 113, 0.1);
  color: #f48771;
}

.validation-indicator.checking {
  background: rgba(220, 220, 170, 0.1);
  color: #dcdcaa;
}

/* Loading Spinner */
.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #3e3e42;
  border-top-color: #0066cc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Select dropdown styling */
select {
  width: 100%;
  padding: 10px 12px;
  background: #3e3e42;
  border: 1px solid #555555;
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

select:focus {
  outline: none;
  border-color: #0066cc;
  background: #464646;
  box-shadow: 0 0 8px rgba(0, 102, 204, 0.2);
}

select:hover {
  background: #464646;
}

/* Button styling improvements */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-success {
  background: #4ec9b0;
  color: #1e1e1e;
}

.btn-success:hover:not(:disabled) {
  background: #5fd4bb;
  box-shadow: 0 4px 12px rgba(78, 201, 176, 0.4);
  transform: translateY(-1px);
}

.btn-success:active:not(:disabled) {
  transform: translateY(0);
}
`;