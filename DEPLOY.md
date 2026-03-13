# Guia de Deploy Local (Baixo Consumo)

Este guia documenta o passo a passo para rodar o **Safe Finanças** de forma invisível no seu Mac, consumindo o mínimo de memória RAM e CPU. Ideal para quando a aplicação estiver finalizada e você quiser apenas usá-la como um serviço local nativo.

Nesta abordagem, em vez de rodar o servidor de desenvolvimento do Vue (`npm run dev`), nós vamos **compilar** o front-end em arquivos estáticos e fazer o backend Node.js servi-los. Depois, usaremos o **PM2** para manter apenas o backend rodando no fundo de forma eficiente.

## Passo 1: Preparar o Backend para servir o Frontend

Na raiz do seu projeto, no arquivo `backend/server.js`, adicione as seguintes linhas **logo antes** do aviso `app.listen(...)` (no fim do arquivo) para que o Express consiga entregar as telas:

```javascript
// Servir arquivos estáticos do frontend (Modo Produção)
const path = require('path');
const express = require('express');

// Diz para o express expor a pasta 'dist' onde fica o frontend compilado
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Fallback: Redireciona qualquer chamada não mapeada na API para o app do Vue
// (Isso permite que o Vue Router funcione corretamente)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});
```

*Nota: Garanta que esta configuração fique abaixo das declarações das rotas de API (ex: `app.use('/api/...', ...)`), caso contrário, o frontend pode sequestrar as chamadas do seu backend.*

## Passo 2: Compilar o Frontend

Sempre que você fizer alterações no visual ou lógica do frontend e quiser usá-las no dia a dia, você precisará "compilar" (build) o projeto.

Abra o terminal na pasta `frontend` e rode:
```bash
npm run build
```
*Isto gerará uma pasta `dist` super otimizada dentro de `frontend`.*

## Passo 3: Inicializar a Aplicação com o PM2

Com o backend pronto para hospedar a UI e as telas já compiladas, basta rodar o backend usando PM2.

1. Instale o PM2 globalmente no Mac (se ainda não o fez):
   ```bash
   npm install -g pm2
   ```

2. Vá para a pasta raiz, entre no *backend* e inicie o servidor em segundo plano. **Para evitar que o Safe Finanças ocupe portas comuns de desenvolvimento (como 3000 ou 3001) que você possa precisar no trabalho, vamos forçá-lo a rodar na porta 9999**:
   ```bash
   cd backend
   PORT=9999 pm2 start server.js --name "safe-financas"
   ```

**Pronto!** 
O Safe Finanças já está acessível no navegador na porta escolhida (neste exemplo, `http://localhost:9999`), gastando em torno de ~80 MegaBytes de RAM e 0% de CPU. Pode fechar o terminal e a IDE e trabalhar em outras coisas livremente.

## Passo 4: Inicialização Automática junto com o Mac (Opcional)

Para configurar o Safe Finanças para ligar sozinho quando você iniciar o macOS:

1. Gere o comando de configuração de inicialização padrão do seu sistema:
   ```bash
   pm2 startup
   ```
   *(Ele vai exibir um comando no terminal que você precisará copiar e colar novamente no próprio terminal)*

2. Salve a lista atual de aplicações para que o PM2 lembre de reiniciá-las no futuro:
   ```bash
   pm2 save
   ```

---

## Consultas e Comandos Úteis do PM2

- `pm2 status`
  Verifica de forma rápida todos os serviços rodando e quanto estão gastando de recursos.
  
- `pm2 logs safe-financas`
  Abre o terminal da aplicação em tempo real (para debugar ou ver logs).
  
- `pm2 restart safe-financas`
  Reinicia a aplicação. Sempre obrigatório rodar caso modifique os arquivos ou configurações do backend e backend/database.
  
- `pm2 stop safe-financas`
  Interrompe e desliga a aplicação temporariamente do fundo.
