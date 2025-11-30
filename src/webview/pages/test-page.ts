export const testPageHTML = `
<div id="test" class="tab-content">
  <div class="section-title">Verificação Completa de Diagnóstico</div>
  
  <div class="info-box">
    💡 Clique em <strong>EXECUTAR TESTES</strong> para verificar sua configuração em tempo real.
  </div>

  <!-- Resumo Executivo -->
  <div class="summary-box">
    <div class="summary-item success">
      <div class="summary-number" id="success-count">0</div>
      <div class="summary-label">Bem-Sucedidos</div>
    </div>
    <div class="summary-item error">
      <div class="summary-number" id="error-count">0</div>
      <div class="summary-label">Falhas</div>
    </div>
    <div class="summary-item">
      <div class="summary-number" id="total-count">0</div>
      <div class="summary-label">Total</div>
    </div>
  </div>

  <!-- Grid de Testes -->
  <div class="test-grid" id="test-grid">
    <div class="test-card pending">
      <div class="test-icon">📄</div>
      <div class="test-name">Git Instalado</div>
      <div class="test-status pending">Aguardando...</div>
      <span class="test-badge pending">⏳ PENDENTE</span>
    </div>
    <div class="test-card pending">
      <div class="test-icon">🐙</div>
      <div class="test-name">GitHub Acessível</div>
      <div class="test-status pending">Aguardando...</div>
      <span class="test-badge pending">⏳ PENDENTE</span>
    </div>
    <div class="test-card pending">
      <div class="test-icon">⚡</div>
      <div class="test-name">Vercel Token</div>
      <div class="test-status pending">Aguardando...</div>
      <span class="test-badge pending">⏳ PENDENTE</span>
    </div>
    <div class="test-card pending">
      <div class="test-icon">🔐</div>
      <div class="test-name">Autenticação</div>
      <div class="test-status pending">Aguardando...</div>
      <span class="test-badge pending">⏳ PENDENTE</span>
    </div>
  </div>

  <!-- Resultados Detalhados -->
  <div class="section-title">Resultados Detalhados</div>
  <div id="detailed-results" class="detailed-results" style="display: none;"></div>
  <div id="no-results" class="no-results">Nenhum teste executado ainda</div>

  <!-- Botão de Ação -->
  <div style="margin-top: 16px;">
    <button class="btn-primary" onclick="executeTests()" style="width: 100%;">⚡ EXECUTAR TESTES</button>
  </div>
</div>
`;

export const testPageStyles = `
.summary-box {
  background: #3e3e42;
  border: 1px solid #0066cc;
  border-radius: 5px;
  padding: 14px;
  margin-bottom: 18px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.summary-item {
  text-align: center;
}

.summary-number {
  font-size: 22px;
  font-weight: 700;
  color: #0066cc;
  margin-bottom: 2px;
}

.summary-label {
  font-size: 10px;
  color: #858585;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.summary-item.success .summary-number { color: #4ec9b0; }
.summary-item.error .summary-number { color: #f48771; }

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.test-card {
  background: #3e3e42;
  border: 2px solid #555555;
  border-radius: 5px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.test-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #555555;
}

.test-card.success {
  border-color: #4ec9b0;
  background: rgba(78, 201, 176, 0.08);
}

.test-card.success::before { background: #4ec9b0; }

.test-card.error {
  border-color: #f48771;
  background: rgba(244, 135, 113, 0.08);
}

.test-card.error::before { background: #f48771; }

.test-card.pending {
  border-color: #dcdcaa;
}

.test-card.pending::before { background: #dcdcaa; }

.test-card.pending .test-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.test-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.test-name {
  font-size: 11px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 6px;
}

.test-status {
  font-size: 10px;
  color: #858585;
  margin-bottom: 10px;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.3;
}

.test-status.success { color: #4ec9b0; }
.test-status.error { color: #f48771; }

.test-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}

.test-badge.success {
  background: rgba(78, 201, 176, 0.2);
  color: #4ec9b0;
}

.test-badge.error {
  background: rgba(244, 135, 113, 0.2);
  color: #f48771;
}

.test-badge.pending {
  background: rgba(220, 220, 170, 0.2);
  color: #dcdcaa;
}

.detailed-results {
  background: #3e3e42;
  border: 1px solid #555555;
  border-radius: 5px;
  overflow: hidden;
}

.result-item {
  padding: 12px;
  border-bottom: 1px solid #2d2d30;
  display: flex;
  gap: 12px;
  font-size: 10px;
}

.result-item:last-child { border-bottom: none; }

.result-icon {
  font-size: 14px;
  min-width: 14px;
}

.result-title {
  font-size: 11px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 2px;
}

.result-message {
  color: #858585;
  font-family: 'Courier New', monospace;
  line-height: 1.4;
}

.result-time {
  font-size: 9px;
  color: #555555;
  margin-top: 2px;
}

.no-results {
  text-align: center;
  padding: 20px;
  color: #858585;
  font-size: 11px;
}
`;