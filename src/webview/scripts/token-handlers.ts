export const tokenHandlers = `
function saveGhToken() {
  const token = document.getElementById('ghToken').value.trim();
  if (!token) {
    addLog('✖ Token GitHub vazio', 'error');
    return;
  }

  if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
    addLog('✖ Token GitHub inválido - deve começar com ghp_ ou github_pat_', 'error');
    document.getElementById('gh-status').textContent = '✖ Inválido';
    document.getElementById('gh-status').classList.remove('saved');
    return;
  }

  if (token.length < 20) {
    addLog('✖ Token GitHub muito curto - verifique se copiou completo', 'error');
    document.getElementById('gh-status').textContent = '✖ Inválido';
    document.getElementById('gh-status').classList.remove('saved');
    return;
  }

  document.getElementById('gh-status').textContent = '✓ Salvo';
  document.getElementById('gh-status').classList.add('saved');
  addLog('✓ GitHub token salvo com segurança', 'success');
  vscode.postMessage({ type: 'saveGithubToken', token });
}

function clearGhToken() {
  document.getElementById('ghToken').value = '';
  document.getElementById('gh-status').textContent = '● Não salvo';
  document.getElementById('gh-status').classList.remove('saved');
  addLog('✓ GitHub token removido', 'success');
  vscode.postMessage({ type: 'clearGithubToken' });
}

function saveVercelToken() {
  const token = document.getElementById('vercelToken').value.trim();
  if (!token) {
    addLog('✖ Token Vercel vazio', 'error');
    return;
  }

  const vercelTokenPattern = /^[a-zA-Z0-9_-]+$/;
  if (!vercelTokenPattern.test(token)) {
    addLog('✖ Token Vercel inválido - contém caracteres não permitidos', 'error');
    document.getElementById('vercel-status').textContent = '✖ Inválido';
    document.getElementById('vercel-status').classList.remove('saved');
    return;
  }

  if (token.length < 10) {
    addLog('✖ Token Vercel muito curto - verifique se copiou completo', 'error');
    document.getElementById('vercel-status').textContent = '✖ Inválido';
    document.getElementById('vercel-status').classList.remove('saved');
    return;
  }

  document.getElementById('vercel-status').textContent = '✓ Salvo';
  document.getElementById('vercel-status').classList.add('saved');
  addLog('✓ Vercel token salvo com segurança', 'success');
  vscode.postMessage({ type: 'saveVercelToken', token });
}

function clearVercelToken() {
  document.getElementById('vercelToken').value = '';
  document.getElementById('vercel-status').textContent = '● Não salvo';
  document.getElementById('vercel-status').classList.remove('saved');
  addLog('✓ Vercel token removido', 'success');
  vscode.postMessage({ type: 'clearVercelToken' });
}

function saveRepoUrl() {
  const url = document.getElementById('repoUrl').value.trim();
  if (!url) {
    addLog('✖ Repo URL vazia', 'error');
    return;
  }

  const isHttpsGithub = url.includes('github.com') && (url.startsWith('https://') || url.startsWith('http://'));
  const isSshGithub = url.includes('git@github.com:');
  
  if (!isHttpsGithub && !isSshGithub) {
    addLog('✖ URL inválida - deve ser um repositório GitHub (HTTPS ou SSH)', 'error');
    addLog('  Exemplos válidos:', 'info');
    addLog('  • https://github.com/usuario/repo.git', 'info');
    addLog('  • git@github.com:usuario/repo.git', 'info');
    return;
  }

  var repoPattern;
  if (isHttpsGithub) {
    repoPattern = /github\\.com[:\\/]([^\\/:]+\\/[^\\/]+?)(?:\\.git)?(?:\\/)?$/i;
  } else {
    repoPattern = /git@github\\.com:([^\\/:]+\\/[^\\/]+?)(?:\\.git)?(?:\\/)?$/i;
  }
  
  const match = url.match(repoPattern);
  if (!match || !match[1] || !match[1].includes('/')) {
    addLog('✖ URL inválida - formato incorreto do repositório', 'error');
    addLog('  Use o formato: usuario/repositorio', 'info');
    return;
  }

  addLog('✓ Repo URL salva: ' + url, 'success');
  vscode.postMessage({ type: 'saveRepoUrl', url });
}

function testGithubAccess() {
  const repoUrl = document.getElementById('repoUrl').value.trim();
  const ghToken = document.getElementById('ghToken').value.trim();
  
  if (!repoUrl) {
    addLog('✖ Preencha a Repo URL', 'error');
    return;
  }

  addLog('🔍 Testando acesso ao GitHub...', 'info');
  updateStatus('Testando...');
  vscode.postMessage({ type: 'testGithubAccess', repoUrl, ghToken });
}

function deploy() {
  const repoUrl = document.getElementById('repoUrl').value.trim();
  const ghToken = document.getElementById('ghToken').value.trim();
  const commitMsg = document.getElementById('commitMsg').value.trim();
  
  if (!repoUrl || !ghToken) {
    addLog('✖ Preencha Repo URL e GitHub Token', 'error');
    return;
  }

  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog('🚀 INICIANDO DEPLOY', 'info');
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  updateStatus('Implantando...');
  vscode.postMessage({ type: 'deploy', repoUrl, ghToken, commitMsg, authMethod: 'token', deployVercel: false });
}

function deployVercel() {
  const repoUrl = document.getElementById('repoUrl').value.trim();
  const ghToken = document.getElementById('ghToken').value.trim();
  const vercelToken = document.getElementById('vercelToken').value.trim();
  
  if (!repoUrl || !ghToken || !vercelToken) {
    addLog('✖ Preencha Repo URL, GitHub Token e Vercel Token', 'error');
    return;
  }

  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog('⚡ INICIANDO DEPLOY + VERCEL', 'info');
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  updateStatus('Implantando em Vercel...');
  vscode.postMessage({ type: 'deploy', repoUrl, ghToken, vercelToken, authMethod: 'token', deployVercel: true });
}

function validateGithubToken(input) {
  const value = input.value.trim();
  const hint = document.getElementById('gh-validation');
  const status = document.getElementById('gh-status');
  
  if (!value) {
    input.classList.remove('valid', 'invalid');
    if (hint) hint.style.display = 'none';
    status.textContent = '● Não salvo';
    status.classList.remove('saved');
    return;
  }

  const isValid = (value.startsWith('ghp_') || value.startsWith('github_pat_')) && value.length >= 20;
  
  if (isValid) {
    input.classList.remove('invalid');
    input.classList.add('valid');
    if (hint) {
      hint.className = 'validation-hint valid';
      hint.textContent = '✓ Formato de token GitHub válido';
      hint.style.display = 'flex';
    }
  } else {
    input.classList.remove('valid');
    input.classList.add('invalid');
    if (hint) {
      hint.className = 'validation-hint invalid';
      
      if (!value.startsWith('ghp_') && !value.startsWith('github_pat_')) {
        hint.textContent = '✖ Token deve começar com ghp_ ou github_pat_';
      } else if (value.length < 20) {
        hint.textContent = '✖ Token muito curto - verifique se copiou completo';
      }
      
      hint.style.display = 'flex';
    }
    status.textContent = '● Não salvo';
    status.classList.remove('saved');
  }
}

function validateVercelToken(input) {
  const value = input.value.trim();
  const hint = document.getElementById('vercel-validation');
  const status = document.getElementById('vercel-status');
  
  if (!value) {
    input.classList.remove('valid', 'invalid');
    if (hint) hint.style.display = 'none';
    status.textContent = '● Não salvo';
    status.classList.remove('saved');
    return;
  }

  const vercelPattern = /^[a-zA-Z0-9_-]+$/;
  const isValid = vercelPattern.test(value) && value.length >= 10;
  
  if (isValid) {
    input.classList.remove('invalid');
    input.classList.add('valid');
    if (hint) {
      hint.className = 'validation-hint valid';
      hint.textContent = '✓ Formato de token Vercel válido';
      hint.style.display = 'flex';
    }
  } else {
    input.classList.remove('valid');
    input.classList.add('invalid');
    if (hint) {
      hint.className = 'validation-hint invalid';
      
      if (!vercelPattern.test(value)) {
        hint.textContent = '✖ Token contém caracteres inválidos';
      } else if (value.length < 10) {
        hint.textContent = '✖ Token muito curto';
      }
      
      hint.style.display = 'flex';
    }
    status.textContent = '● Não salvo';
    status.classList.remove('saved');
  }
}

function validateRepoUrl(input) {
  const value = input.value.trim();
  const hint = document.getElementById('url-validation');
  
  if (!value) {
    input.classList.remove('valid', 'invalid');
    if (hint) hint.style.display = 'none';
    return;
  }

  const isHttpsGithub = value.includes('github.com') && (value.startsWith('https://') || value.startsWith('http://'));
  const isSshGithub = value.includes('git@github.com:');
  
  if (!isHttpsGithub && !isSshGithub) {
    input.classList.remove('valid');
    input.classList.add('invalid');
    if (hint) {
      hint.className = 'validation-hint invalid';
      hint.textContent = '✖ Deve ser uma URL do GitHub (HTTPS ou SSH)';
      hint.style.display = 'flex';
    }
    return;
  }

  var repoPattern;
  if (isHttpsGithub) {
    repoPattern = /github\\.com[:\\/]([^\\/:]+\\/[^\\/]+?)(?:\\.git)?(?:\\/)?$/i;
  } else {
    repoPattern = /git@github\\.com:([^\\/:]+\\/[^\\/]+?)(?:\\.git)?(?:\\/)?$/i;
  }
  
  const match = value.match(repoPattern);
  const isValid = match && match[1] && match[1].includes('/');
  
  if (isValid) {
    input.classList.remove('invalid');
    input.classList.add('valid');
    if (hint) {
      hint.className = 'validation-hint valid';
      hint.textContent = '✓ URL válida: ' + match[1];
      hint.style.display = 'flex';
    }
  } else {
    input.classList.remove('valid');
    input.classList.add('invalid');
    if (hint) {
      hint.className = 'validation-hint invalid';
      hint.textContent = '✖ Formato inválido - use: usuario/repositorio';
      hint.style.display = 'flex';
    }
  }
}
`;