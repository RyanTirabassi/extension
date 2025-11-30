export const testHandlers = `
function executeTests() {
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  addLog('⚡ INICIANDO TESTES DE DIAGNÓSTICO', 'info');
  addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
  updateStatus('Executando testes...');
  vscode.postMessage({ type: 'executeTests' });
}

function handleTestResults(tests) {
  let successCount = 0, errorCount = 0, pendingCount = 0;

  tests.forEach((test, idx) => {
    if (test.status === 'success') successCount++;
    else if (test.status === 'error') errorCount++;
    else if (test.status === 'pending') pendingCount++;

    const testCard = document.getElementById('test-grid').children[idx];
    if (testCard) {
      testCard.className = \`test-card \${test.status}\`;
      
      let badge = '⏳ PENDENTE';
      if (test.status === 'success') badge = '✓ OK';
      else if (test.status === 'error') badge = '✗ FALHA';
      
      testCard.innerHTML = \`
        <div class="test-icon">\${test.icon}</div>
        <div class="test-name">\${test.name}</div>
        <div class="test-status \${test.status}">\${test.message}</div>
        <span class="test-badge \${test.status}">\${badge}</span>
      \`;
    }

    // Só loga se não estiver pendente
    if (test.status !== 'pending') {
      const logBadge = test.status === 'success' ? '✓ OK' : '✗ FALHA';
      addLog(\`\${logBadge} \${test.name}: \${test.message}\`, test.status);
    }
  });

  document.getElementById('success-count').textContent = successCount;
  document.getElementById('error-count').textContent = errorCount;
  document.getElementById('total-count').textContent = tests.length;

  // Filtrar apenas testes concluídos para resultados detalhados
  const completedTests = tests.filter(t => t.status !== 'pending');
  
  const detailedResults = document.getElementById('detailed-results');
  const noResults = document.getElementById('no-results');
  
  if (completedTests.length > 0) {
    detailedResults.innerHTML = completedTests.map(test => {
      const icon = test.status === 'success' ? '✓' : '✗';
      const color = test.status === 'success' ? '#4ec9b0' : '#f48771';
      return \`
        <div class="result-item">
          <div class="result-icon" style="color: \${color};">\${icon}</div>
          <div>
            <div class="result-title">\${test.name}</div>
            <div class="result-message">\${test.message}</div>
            <div class="result-time">Executado em \${test.time}</div>
          </div>
        </div>
      \`;
    }).join('');
    
    detailedResults.style.display = 'block';
    noResults.style.display = 'none';
  } else {
    detailedResults.style.display = 'none';
    noResults.style.display = 'block';
  }

  // Só finaliza quando todos os testes estiverem completos
  if (pendingCount === 0) {
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
    addLog('✓ DIAGNÓSTICO CONCLUÍDO', 'success');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
    updateStatus('Pronto');
  }
}
`;