export const globalStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #1e1e1e;
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.container {
  max-width: 100%;
  height: 100vh;
  background: #252526;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header h1 {
  font-size: 16px;
  font-weight: 600;
}

.header-status {
  font-size: 10px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tabs-header {
  background: #1e1e1e;
  display: flex;
  border-bottom: 1px solid #3e3e42;
  overflow-x: auto;
  padding: 0 10px;
}

.tab {
  padding: 12px 18px;
  font-size: 11px;
  font-weight: 600;
  color: #858585;
  background: transparent;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab:hover { color: #cccccc; }
.tab.active { 
  color: #0066cc; 
  border-bottom-color: #0066cc;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px;
  background: #252526;
}

.logs-panel {
  width: 280px;
  background: #1e1e1e;
  border-left: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
}

.logs-title {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  color: #0066cc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logs-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  line-height: 1.6;
  color: #a0a0a0;
}

.log-entry {
  margin-bottom: 3px;
  padding: 1px 0;
}

.log-entry.success { color: #4ec9b0; }
.log-entry.error { color: #f48771; }
.log-entry.info { color: #9cdcfe; }
.log-entry.warning { color: #dcdcaa; }

.logs-clear {
  padding: 10px;
  border-top: 1px solid #3e3e42;
}

.logs-clear button {
  width: 100%;
  padding: 6px;
  font-size: 10px;
  background: #3e3e42;
  color: #858585;
  border: 1px solid #555555;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.logs-clear button:hover {
  background: #464646;
  color: #cccccc;
}

.tab-content {
  display: none;
  animation: fadeIn 0.2s ease;
}

.tab-content.active { display: block; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #0066cc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 3px;
  height: 10px;
  background: #0066cc;
}

.info-box {
  background: rgba(0, 102, 204, 0.1);
  border-left: 3px solid #0066cc;
  border-radius: 3px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 11px;
  color: #9cdcfe;
  line-height: 1.6;
}

.warning-box {
  background: rgba(220, 220, 170, 0.1);
  border-left: 3px solid #dcdcaa;
  border-radius: 3px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 11px;
  color: #dcdcaa;
  line-height: 1.6;
}

.success-box {
  background: rgba(78, 201, 176, 0.1);
  border-left: 3px solid #4ec9b0;
  border-radius: 3px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 11px;
  color: #4ec9b0;
  line-height: 1.6;
}

.error-box {
  background: rgba(244, 135, 113, 0.1);
  border-left: 3px solid #f48771;
  border-radius: 3px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 11px;
  color: #f48771;
  line-height: 1.6;
}

.field-group {
  margin-bottom: 14px;
}

.field-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: #cccccc;
  margin-bottom: 6px;
}

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

.field-status.saved,
.field-status.detected {
  color: #4ec9b0;
  background: rgba(78, 201, 176, 0.1);
  border-color: rgba(78, 201, 176, 0.2);
}

input[type="text"],
input[type="password"],
input[type="url"],
textarea,
select {
  width: 100%;
  padding: 8px 10px;
  background: #3e3e42;
  border: 1px solid #555555;
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  transition: all 0.2s;
}

textarea {
  min-height: 140px;
  resize: vertical;
  line-height: 1.4;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #0066cc;
  background: #464646;
  box-shadow: 0 0 8px rgba(0, 102, 204, 0.2);
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

button {
  flex: 1;
  min-width: 90px;
  padding: 8px 14px;
  border: none;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.4);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #3e3e42;
  color: #cccccc;
  border: 1px solid #555555;
}

.btn-secondary:hover:not(:disabled) {
  background: #464646;
  border-color: #666666;
}

.btn-success {
  background: #4ec9b0;
  color: #1e1e1e;
  font-weight: 700;
}

.btn-success:hover:not(:disabled) {
  background: #5fd4bb;
  box-shadow: 0 4px 12px rgba(78, 201, 176, 0.4);
  transform: translateY(-1px);
}

.divider {
  height: 1px;
  background: #3e3e42;
  margin: 16px 0;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #1e1e1e;
}

::-webkit-scrollbar-thumb {
  background: #464646;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555555;
}
`;