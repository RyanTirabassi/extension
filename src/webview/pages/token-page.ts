export const tokenPageHTML = `
<div id="token" class="tab-content active">
  <div class="section-title">Método de Autenticação</div>
  
  <div class="auth-methods">
    <div class="auth-method">
      <input type="radio" id="auth-token" name="method" value="token" checked>
      <label for="auth-token" class="auth-method-label">
        <span class="auth-method-icon">🔑</span>
        <span class="auth-method-name">Token</span>
      </label>
    </div>
    <div class="auth-method">
      <input type="radio" id="auth-ssh" name="method" value="ssh">
      <label for="auth-ssh" class="auth-method-label">
        <span class="auth-method-icon">🔐</span>
        <span class="auth-method-name">SSH</span>
      </label>
    </div>
  </div>

  <div class="info-box">
    💡 <strong>Token HTTPS:</strong> Recomendado para segurança máxima. O token fica armazenado localmente criptografado.
  </div>

  <div class="field-group">
    <div class="field-label">
      <span>GitHub Token</span>
      <span class="field-status" id="gh-status">● Não salvo</span>
    </div>
    <input type="password" id="ghToken" placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx">
    <div class="button-group">
      <button class="btn-primary" onclick="saveGhToken()">✅ SALVAR</button>
      <button class="btn-secondary" onclick="clearGhToken()">🗑️ REMOVER</button>
    </div>
  </div>

  <div class="divider"></div>

  <div class="field-group">
    <div class="field-label">
      <span>Vercel Token</span>
      <span class="field-status" id="vercel-status">● Não salvo</span>
    </div>
    <input type="password" id="vercelToken" placeholder="vercel_xxxxxxxxxxxxxxxx">
    <div class="button-group">
      <button class="btn-primary" onclick="saveVercelToken()">✅ SALVAR</button>
      <button class="btn-secondary" onclick="clearVercelToken()">🗑️ REMOVER</button>
    </div>
  </div>

  <div class="divider"></div>

  <div class="field-group">
    <div class="field-label">URL do Repositório</div>
    <input type="url" id="repoUrl" placeholder="https://github.com/seu-usuario/seu-repo.git">
    <div class="button-group">
      <button class="btn-primary" onclick="saveRepoUrl()">💾 SALVAR</button>
      <button class="btn-secondary" onclick="testGithubAccess()">⚡ TESTAR ACESSO</button>
    </div>
  </div>

  <div class="field-group">
    <div class="field-label">Mensagem de Commit</div>
    <input type="text" id="commitMsg" value="deploy: automated">
  </div>

  <div class="field-group">
    <div class="button-group">
      <button class="btn-primary" onclick="deploy()">🚀 DEPLOY</button>
      <button class="btn-secondary" onclick="deployVercel()">⚡ + VERCEL</button>
    </div>
  </div>
</div>
`;

export const tokenPageStyles = `
.auth-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}

.auth-method input[type="radio"] { display: none; }

.auth-method-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: #3e3e42;
  border: 2px solid #555555;
  border-radius: 5px;
  transition: all 0.2s;
  text-align: center;
  cursor: pointer;
}

.auth-method input[type="radio"]:checked + .auth-method-label {
  background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
  border-color: #0066cc;
}

.auth-method-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.auth-method-name {
  font-size: 12px;
  font-weight: 600;
}
`;