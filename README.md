# 🚀 Deploy Automático v2

Automatize build e deploy de aplicações React com GitHub Actions para Vercel.

## 📋 Requisitos

- **VS Code** 1.80.0 ou superior
- **Node.js** 16+ 
- **Git** instalado
- **npm** ou **yarn**

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd deploy-automatico
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Compile o projeto

```bash
npm run compile
```

### 4. Inicie o modo watch (opcional)

```bash
npm run watch
```

## 🎯 Estrutura de Arquivos

```
deploy-automatico/
├── src/
│   ├── extension.ts      # Arquivo principal
│   ├── panel.ts          # Lógica do painel
│   ├── webview.ts        # HTML/CSS/JS da UI
│   ├── utils.ts          # Funções utilitárias
│   ├── secrets.ts        # Gerenciamento de secrets
│   └── types.ts          # Tipos TypeScript
├── package.json          # Metadados do projeto
├── tsconfig.json         # Configuração TypeScript
└── README.md             # Este arquivo
```

## 🚀 Como Usar

### 1. Abra um projeto no VS Code

```bash
code seu-projeto
```

### 2. Abra o Command Palette (Ctrl+Shift+P / Cmd+Shift+P)

### 3. Digite: **Deploy Automático v2**

### 4. Configure seus tokens e URLs:

#### Aba TOKEN
- ✅ Salve seu **GitHub Token** (Personal Access Token)
- ✅ Salve sua **URL do Repositório**
- ✅ Salve seu **Vercel Token** (opcional)
- 🚀 Clique em **DEPLOY**

#### Aba SSH
- 🔐 Configure SSH no GitHub (Settings → SSH Keys)
- 📝 Adicione sua URL SSH
- 🚀 Clique em **DEPLOY SSH**

#### Aba TEMPLATE
- 📋 Cole um template YAML do GitHub Actions
- ✅ Clique em **APLICAR**
- 📂 Arquivo será criado em `.github/workflows/deploy.yml`

#### Aba TESTE
- ⚡ Clique em **EXECUTAR TESTES**
- 📊 Veja os resultados em tempo real
- 📋 Logs aparecem à direita

## 🔑 Gerando Tokens

### GitHub Token
1. Vá para: github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione escopos: `repo`, `workflow`
4. Copie o token e cole na extensão

### Vercel Token
1. Vá para: vercel.com/account/tokens
2. Crie um novo token
3. Copie e cole na extensão

## 🛠️ Desenvolvimento

### Build para produção

```bash
npm run esbuild-base -- --minify
```

### Publicar a extensão

```bash
vsce publish
```

## 📝 Notas Importantes

- ⚠️ **Nunca compartilhe seus tokens**
- 🔒 Tokens são armazenados de forma segura pelo VS Code
- 📌 Configure o repositório Git antes de usar
- 🔄 Use `main` ou `master` como branch principal

## 🐛 Troubleshooting

### "Git not found"
- Instale o Git: https://git-scm.com

### "Push rejected"
- Verifique as permissões do token
- Confirme que o repositório remote está configurado

### "Vercel command not found"
- Execute: `npm install -g vercel`

## 📚 Referências

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [VS Code Extension API](https://code.visualstudio.com/api)

## 📄 Licença

MIT

## 👥 Contribuições

Contribuições são bem-vindas! Abra uma issue ou pull request.