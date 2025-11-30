export const templatePageHTML = `
<div id="template" class="tab-content">
  <div class="section-title">Templates Prontos</div>
  
  <div class="info-box">
    💡 <strong>Novo:</strong> Selecione um template pronto ou cole seu próprio YAML personalizado.
  </div>

  <div class="templates-grid">
    <!-- Template 1: Node.js CI -->
    <div class="template-card" onclick="selectTemplate('nodejs')">
      <span class="template-icon">⚡</span>
      <div class="template-name">Node.js CI/CD</div>
      <div class="template-desc">Pipeline completo para projetos Node.js com build, testes e deploy automático.</div>
      <div class="template-tags">
        <span class="template-tag">Node.js</span>
        <span class="template-tag">npm</span>
        <span class="template-tag">Vercel</span>
      </div>
    </div>

    <!-- Template 2: React -->
    <div class="template-card selected" onclick="selectTemplate('react')">
      <span class="template-icon">⚛️</span>
      <div class="template-name">React + Vite</div>
      <div class="template-desc">Otimizado para projetos React com Vite, incluindo lint e testes automatizados.</div>
      <div class="template-tags">
        <span class="template-tag">React</span>
        <span class="template-tag">Vite</span>
        <span class="template-tag">ESLint</span>
      </div>
    </div>

    <!-- Template 3: Docker -->
    <div class="template-card" onclick="selectTemplate('docker')">
      <span class="template-icon">🐳</span>
      <div class="template-name">Docker Build</div>
      <div class="template-desc">Build e push de imagens Docker para registries com cache otimizado.</div>
      <div class="template-tags">
        <span class="template-tag">Docker</span>
        <span class="template-tag">Container</span>
        <span class="template-tag">Registry</span>
      </div>
    </div>
  </div>

  <div class="section-title">Editor YAML</div>
  
  <div class="field-group">
    <div class="field-label">
      <span>Template YAML</span>
      <span style="font-size: 10px; color: #666;">Use Ctrl+Space para autocompletar</span>
    </div>
    <textarea id="templateInput" placeholder="Cole ou edite seu template YAML aqui..." oninput="validateYAMLSilent()">name: React CI/CD

on:
  push:
    branches: ["main", "master"]
  pull_request:
    branches: ["main", "master"]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - name: Deploy to Vercel
        run: npx vercel --prod --token=\${{ secrets.VERCEL_TOKEN }}</textarea>
  </div>

  <div class="validation-box valid show" id="validationBox">
    <div class="validation-content">
      <div class="validation-item">
        <span class="validation-icon">✓</span>
        <div>
          <div style="color: #4caf50; font-weight: 600; margin-bottom: 4px;">Template YAML válido</div>
          <div style="color: #858585; font-size: 10px;">Aguardando validação...</div>
        </div>
      </div>
    </div>
  </div>

  <div class="button-group">
    <button class="btn-primary" onclick="applyTemplate()">
      <span class="btn-icon">✅</span>
      APLICAR
    </button>
    <button class="btn-secondary" onclick="applyAndOpenTemplate()">
      <span class="btn-icon">📄</span>
      APLICAR E ABRIR
    </button>
    <button class="btn-secondary" onclick="validateYAML()">
      <span class="btn-icon">🔍</span>
      VALIDAR
    </button>
    <button class="btn-secondary" onclick="clearTemplate()">
      <span class="btn-icon">🗑️</span>
      LIMPAR
    </button>
  </div>

  <!-- Descrição Detalhada (aparece após clicar em Aplicar) -->
  <div class="template-description" id="templateDescription">
    <!-- Conteúdo será inserido dinamicamente via JavaScript -->
  </div>
</div>
`;

export const templatePageStyles = `
/* Templates Grid */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.template-card {
  background: #2a2a2a;
  border: 2px solid #444;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.template-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #444;
  transition: all 0.3s ease;
}

.template-card:hover {
  border-color: #0066cc;
  background: rgba(0, 102, 204, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
}

.template-card:hover::before {
  background: #0066cc;
}

.template-card.selected {
  border-color: #0066cc;
  background: rgba(0, 102, 204, 0.1);
}

.template-card.selected::before {
  background: #0066cc;
}

.template-icon {
  font-size: 32px;
  margin-bottom: 12px;
  display: block;
}

.template-name {
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 8px;
}

.template-desc {
  font-size: 11px;
  color: #a0a0b0;
  line-height: 1.5;
  margin-bottom: 12px;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.template-tag {
  font-size: 9px;
  padding: 3px 8px;
  background: rgba(0, 102, 204, 0.2);
  color: #0066cc;
  border-radius: 10px;
  border: 1px solid rgba(0, 102, 204, 0.3);
}

/* Validation Box */
.validation-box {
  background: #2a2a2a;
  border: 2px solid #444;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  display: none;
}

.validation-box.show {
  display: block;
  animation: slideDown 0.3s ease;
}

.validation-box.valid {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.05);
}

.validation-box.invalid {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.05);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.validation-content {
  font-size: 11px;
  line-height: 1.6;
}

.validation-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.validation-item:last-child {
  margin-bottom: 0;
}

.validation-icon {
  font-size: 14px;
  min-width: 14px;
}

/* Template Description */
.template-description {
  background: linear-gradient(135deg, rgba(0, 102, 204, 0.1) 0%, rgba(0, 82, 163, 0.1) 100%);
  border: 2px solid #0066cc;
  border-radius: 8px;
  padding: 20px;
  margin-top: 24px;
  display: none;
  animation: fadeInUp 0.4s ease;
}

.template-description.show {
  display: block;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.description-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 102, 204, 0.3);
}

.description-icon {
  font-size: 36px;
}

.description-title {
  flex: 1;
}

.description-name {
  font-size: 16px;
  font-weight: 700;
  color: #0066cc;
  margin-bottom: 4px;
}

.description-subtitle {
  font-size: 11px;
  color: #a0a0b0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.description-content {
  font-size: 12px;
  color: #e0e0e0;
  line-height: 1.8;
  margin-bottom: 16px;
}

.description-features {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
}

.features-title {
  font-size: 11px;
  font-weight: 700;
  color: #0066cc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 11px;
  color: #cccccc;
  line-height: 1.6;
}

.feature-item:last-child {
  margin-bottom: 0;
}

.feature-icon {
  color: #4caf50;
  font-size: 14px;
  min-width: 14px;
  margin-top: 2px;
}

.description-usage {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 16px;
}

.usage-title {
  font-size: 11px;
  font-weight: 700;
  color: #0066cc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.usage-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.usage-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 11px;
  color: #cccccc;
  line-height: 1.6;
}

.step-number {
  background: #0066cc;
  color: white;
  font-weight: 700;
  font-size: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-icon {
  font-size: 14px;
}
`;