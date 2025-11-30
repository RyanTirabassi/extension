export const templateHandlers = `
let currentTemplate = 'react'; // Template selecionado atualmente

function selectTemplate(type) {
  // Remove seleção anterior
  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.remove('selected');
  });

  // Adiciona seleção ao card clicado
  event.currentTarget.classList.add('selected');

  // Atualiza o template atual
  currentTemplate = type;

  // Templates pré-definidos
  const templates = {
    nodejs: \`name: CI - Node.js

on:
  push:
    branches: ["main", "master"]
  pull_request:
    branches: ["main", "master"]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test\`,

    react: \`name: React CI/CD

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
        run: npx vercel --prod --token=\\\${{ secrets.VERCEL_TOKEN }}\`,

    docker: \`name: Docker Build

on:
  push:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker Image
        run: docker build -t myapp:latest .
      - name: Push to Registry
        run: docker push myapp:latest\`
  };

  // Carrega template no editor
  document.getElementById('templateInput').value = templates[type];
  
  // Valida silenciosamente (sem feedback visual do botão)
  validateYAMLSilent();
  
  // Esconde a descrição quando trocar de template
  document.getElementById('templateDescription').classList.remove('show');
}

function validateYAMLSilent() {
  const content = document.getElementById('templateInput').value.trim();
  const validationBox = document.getElementById('validationBox');
  
  if (!content) {
    validationBox.classList.remove('show');
    return;
  }

  const isValid = content.includes('name:') && content.includes('on:') && content.includes('jobs:');
  
  validationBox.classList.add('show');
  validationBox.classList.toggle('valid', isValid);
  validationBox.classList.toggle('invalid', !isValid);

  if (isValid) {
    const nameMatch = content.match(/name:\\s*([^\\n]+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Template';
    const stepsCount = (content.match(/- name:/g) || []).length;
    
    validationBox.innerHTML = \`
      <div class="validation-content">
        <div class="validation-item">
          <span class="validation-icon" style="color: #4caf50;">✓</span>
          <div>
            <div style="color: #4caf50; font-weight: 600; margin-bottom: 4px;">Template YAML válido</div>
            <div style="color: #858585; font-size: 10px;">Nome: \${name} • \${stepsCount} etapa(s) detectada(s)</div>
          </div>
        </div>
      </div>
    \`;
  } else {
    validationBox.innerHTML = \`
      <div class="validation-content">
        <div class="validation-item">
          <span class="validation-icon" style="color: #f44336;">✗</span>
          <div>
            <div style="color: #f44336; font-weight: 600; margin-bottom: 4px;">Template YAML inválido</div>
            <div style="color: #858585; font-size: 10px;">Verifique se contém: name:, on:, jobs:</div>
          </div>
        </div>
      </div>
    \`;
  }
}

function validateYAML() {
  const content = document.getElementById('templateInput').value.trim();
  const validationBox = document.getElementById('validationBox');
  
  if (!content) {
    validationBox.classList.remove('show');
    addLog('⚠️ Nenhum template para validar', 'warning');
    return;
  }

  const isValid = content.includes('name:') && content.includes('on:') && content.includes('jobs:');
  
  validationBox.classList.add('show');
  validationBox.classList.toggle('valid', isValid);
  validationBox.classList.toggle('invalid', !isValid);

  if (isValid) {
    const nameMatch = content.match(/name:\\s*([^\\n]+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Template';
    const stepsCount = (content.match(/- name:/g) || []).length;
    
    validationBox.innerHTML = \`
      <div class="validation-content">
        <div class="validation-item">
          <span class="validation-icon" style="color: #4caf50;">✓</span>
          <div>
            <div style="color: #4caf50; font-weight: 600; margin-bottom: 4px;">Template YAML válido</div>
            <div style="color: #858585; font-size: 10px;">Nome: \${name} • \${stepsCount} etapa(s) detectada(s)</div>
          </div>
        </div>
      </div>
    \`;
    
    // Feedback visual adicional ao clicar no botão validar
    if (event && event.type === 'click') {
      // Adiciona animação de sucesso
      validationBox.style.animation = 'none';
      setTimeout(() => {
        validationBox.style.animation = 'slideDown 0.3s ease';
      }, 10);
      
      // Mostra mensagem temporária
      const btn = event.target;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="btn-icon">✓</span> VÁLIDO';
      btn.style.background = '#4caf50';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
      }, 2000);
      
      addLog(\`✓ Template "\${name}" validado com sucesso\`, 'success');
    }
  } else {
    validationBox.innerHTML = \`
      <div class="validation-content">
        <div class="validation-item">
          <span class="validation-icon" style="color: #f44336;">✗</span>
          <div>
            <div style="color: #f44336; font-weight: 600; margin-bottom: 4px;">Template YAML inválido</div>
            <div style="color: #858585; font-size: 10px;">Verifique se contém: name:, on:, jobs:</div>
          </div>
        </div>
      </div>
    \`;
    
    // Feedback visual de erro ao clicar no botão validar
    if (event && event.type === 'click') {
      // Adiciona animação de erro
      validationBox.style.animation = 'none';
      setTimeout(() => {
        validationBox.style.animation = 'shake 0.5s ease';
      }, 10);
      
      // Mostra mensagem temporária
      const btn = event.target;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="btn-icon">✗</span> INVÁLIDO';
      btn.style.background = '#f44336';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
      }, 2000);
      
      addLog('✗ Template YAML inválido', 'error');
    }
  }
}

function updateDescription(type) {
  const descriptions = {
    nodejs: {
      icon: '⚡',
      name: 'Node.js CI/CD Pipeline',
      subtitle: 'Pipeline de Integração Contínua para Node.js',
      content: 'Este template automatiza o processo de build e testes para aplicações Node.js. Ele é executado automaticamente a cada push na branch principal e em pull requests, garantindo que seu código seja sempre testado e validado antes de ir para produção.',
      features: [
        { text: '<strong>Instalação automática de dependências</strong> - Executa npm ci para instalar exatamente as versões especificadas no package-lock.json' },
        { text: '<strong>Configuração do Node.js 18</strong> - Usa a versão LTS mais recente do Node.js para máxima compatibilidade' },
        { text: '<strong>Build automatizado</strong> - Compila o projeto e verifica se não há erros de compilação' },
        { text: '<strong>Execução de testes</strong> - Roda todos os testes unitários e de integração configurados' },
        { text: '<strong>Cache de dependências</strong> - Otimiza o tempo de build reutilizando pacotes já baixados' }
      ],
      steps: [
        'Clique em <strong>"APLICAR TEMPLATE"</strong> para criar o arquivo .github/workflows/deploy.yml',
        'Configure seu projeto com <strong>scripts npm</strong> (build e test no package.json)',
        'Faça commit e push - o <strong>workflow será executado automaticamente</strong>',
        'Acompanhe o progresso na aba <strong>"Actions"</strong> do GitHub'
      ]
    },
    react: {
      icon: '⚛️',
      name: 'React + Vite CI/CD Pipeline',
      subtitle: 'Pipeline de Integração e Entrega Contínua',
      content: 'Este template automatiza completamente o processo de build e deploy para aplicações React construídas com Vite. Ele é executado automaticamente a cada push na branch principal e em pull requests, garantindo que seu código seja sempre testado e validado antes de ir para produção.',
      features: [
        { text: '<strong>Instalação automática de dependências</strong> - Executa npm ci para instalar exatamente as versões especificadas no package-lock.json' },
        { text: '<strong>Verificação de código com ESLint</strong> - Analisa seu código em busca de problemas de sintaxe, padrões e possíveis bugs' },
        { text: '<strong>Execução de testes automatizados</strong> - Roda todos os testes unitários e de integração configurados no projeto' },
        { text: '<strong>Build otimizado para produção</strong> - Gera uma versão minificada e otimizada da aplicação' },
        { text: '<strong>Deploy automático para Vercel</strong> - Publica a aplicação automaticamente após build bem-sucedido' }
      ],
      steps: [
        'Clique em <strong>"APLICAR TEMPLATE"</strong> para criar o arquivo .github/workflows/deploy.yml no seu projeto',
        'Configure os <strong>secrets necessários</strong> no seu repositório GitHub (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)',
        'Faça commit e push das alterações - o <strong>workflow será executado automaticamente</strong>',
        'Acompanhe o progresso na aba <strong>"Actions"</strong> do seu repositório no GitHub'
      ]
    },
    docker: {
      icon: '🐳',
      name: 'Docker Build Pipeline',
      subtitle: 'Build e Push de Imagens Docker',
      content: 'Este template automatiza o processo de build e publicação de imagens Docker. Ideal para projetos que utilizam containers, ele constrói a imagem a cada push na branch principal e a envia para o registry configurado, mantendo suas imagens sempre atualizadas.',
      features: [
        { text: '<strong>Build automatizado de imagens</strong> - Constrói a imagem Docker usando seu Dockerfile' },
        { text: '<strong>Cache de layers</strong> - Otimiza o tempo de build reutilizando layers já construídas' },
        { text: '<strong>Versionamento automático</strong> - Gera tags baseadas em commits e branches' },
        { text: '<strong>Push para registry</strong> - Envia a imagem para Docker Hub, GitHub Container Registry ou registry privado' },
        { text: '<strong>Multi-architecture support</strong> - Suporte para builds em diferentes arquiteturas (amd64, arm64)' }
      ],
      steps: [
        'Clique em <strong>"APLICAR TEMPLATE"</strong> para criar o arquivo .github/workflows/deploy.yml',
        'Configure os <strong>secrets</strong> com credenciais do registry (DOCKER_USERNAME, DOCKER_PASSWORD)',
        'Certifique-se de ter um <strong>Dockerfile</strong> na raiz do projeto',
        'Faça push - a imagem será <strong>construída e publicada automaticamente</strong>'
      ]
    }
  };

  const desc = descriptions[type];
  const descriptionEl = document.getElementById('templateDescription');
  
  descriptionEl.innerHTML = \`
    <div class="description-header">
      <span class="description-icon">\${desc.icon}</span>
      <div class="description-title">
        <div class="description-name">\${desc.name}</div>
        <div class="description-subtitle">\${desc.subtitle}</div>
      </div>
    </div>

    <div class="description-content">
      \${desc.content}
    </div>

    <div class="description-features">
      <div class="features-title">🎯 O que este template faz:</div>
      \${desc.features.map(f => \`
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <div>\${f.text}</div>
        </div>
      \`).join('')}
    </div>

    <div class="description-usage">
      <div class="usage-title">
        <span>📖</span>
        Como usar este template:
      </div>
      <div class="usage-steps">
        \${desc.steps.map((step, i) => \`
          <div class="usage-step">
            <span class="step-number">\${i + 1}</span>
            <div>\${step}</div>
          </div>
        \`).join('')}
      </div>
    </div>
  \`;
}

function applyTemplate() {
  const content = document.getElementById('templateInput').value.trim();
  
  if (!content) {
    addLog('✖ Cole um template YAML', 'error');
    return;
  }

  addLog('📝 Aplicando template...', 'info');
  
  // Primeiro mostra a descrição
  updateDescription(currentTemplate);
  const description = document.getElementById('templateDescription');
  description.classList.add('show');
  
  // Scroll suave até a descrição
  setTimeout(() => {
    description.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
  
  // Envia para o backend sem abrir o arquivo automaticamente
  vscode.postMessage({ 
    type: 'applyTemplate', 
    content,
    openFile: false  // ← Nova flag para não abrir o arquivo
  });
}

function applyAndOpenTemplate() {
  const content = document.getElementById('templateInput').value.trim();
  
  if (!content) {
    addLog('✖ Cole um template YAML', 'error');
    return;
  }

  addLog('📝 Aplicando template e abrindo arquivo...', 'info');
  
  // Envia para o backend E abre o arquivo
  vscode.postMessage({ 
    type: 'applyTemplate', 
    content,
    openFile: true  // ← Flag para abrir o arquivo
  });
}

function clearTemplate() {
  document.getElementById('templateInput').value = '';
  document.getElementById('validationBox').classList.remove('show');
  document.getElementById('templateDescription').classList.remove('show');
  
  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  currentTemplate = null;
  addLog('🗑️ Template limpo', 'info');
}

// Inicializa o template React como padrão
if (typeof validateYAMLSilent === 'function') {
  validateYAMLSilent();
}
if (typeof updateDescription === 'function') {
  updateDescription('react');
}
`;