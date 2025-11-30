export const createBaseLayout = (contentPages: string) => `
<div class="container">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <span style="font-size: 18px;">🚀</span>
      <h1>Deploy Automático v2</h1>
    </div>
    <div class="header-status">
      <span>●</span>
      <span id="status-text">Pronto</span>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs-header">
    <button class="tab active" onclick="switchTab('token', this)">🔑 TOKEN</button>
    <button class="tab" onclick="switchTab('ssh', this)">🔐 SSH</button>
    <button class="tab" onclick="switchTab('credmgr', this)">📦 CREDMGR</button>
    <button class="tab" onclick="switchTab('template', this)">📋 TEMPLATE</button>
    <button class="tab" onclick="switchTab('test', this)">✅ TESTE</button>
  </div>

  <!-- Main Content -->
  <div class="main-content">
    <!-- Left Panel - Pages -->
    <div class="content">
      ${contentPages}
    </div>

    <!-- Right Panel - Logs -->
    <div class="logs-panel">
      <div class="logs-title">
        📋 LOGS
      </div>
      <div class="logs-content" id="logsContent">
        <div class="log-entry success">✓ Deploy Automático v2 iniciado</div>
        <div class="log-entry success">✓ Sistema pronto para usar!</div>
      </div>
      <div class="logs-clear">
        <button onclick="clearLogs()">LIMPAR LOGS</button>
      </div>
    </div>
  </div>
</div>
`;