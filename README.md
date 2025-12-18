# 🛍️ R Store - Sistema de Gestão (PDV)

Sistema de gestão completo com Frente de Caixa (PDV), Controle de Estoque, Clientes e Financeiro. Desenvolvido com React, Vite e Supabase.

---

## 🚀 Como Rodar o Projeto (Localmente)

Se você precisa testar alterações ou rodar o sistema no seu computador:

1.  **Abra o terminal** na pasta do projeto.
2.  Instale as dependências (apenas na primeira vez ou se apagar a pasta `node_modules`):
    ```bash
    npm install
    ```
3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
4.  O sistema estará disponível em: `http://localhost:5173`

---

## 📱 Como Testar no Celular (Via Wi-Fi)

Para ver como o layout fica no seu celular enquanto desenvolve:

1.  Garanta que o computador e o celular estejam no **mesmo Wi-Fi**.
2.  No terminal, rode:
    ```bash
    npm run dev -- --host
    ```
3.  O terminal vai mostrar um endereço "Network", algo como: `http://192.168.0.x:5173`.
4.  Digite esse endereço no navegador do seu celular.

---

## ☁️ Como Atualizar o Site Online (GitHub/Vercel)

Qualquer alteração salva no seu código local precisa ser enviada para o GitHub para que a Vercel atualize o site automaticamente.

1.  **Salve** todos os arquivos modificados.
2.  No terminal, execute a sequência:

    ```bash
    git add .
    ```

    ```bash
    git commit -m "Descreva aqui o que você mudou"
    ```

    ```bash
    git push origin main
    ```
    *(Se der erro, tente `git push origin master`)*

3.  Aguarde 1 ou 2 minutos e acesse seu link da Vercel. A atualização será automática.

---

## 🛠️ Solução de Problemas Comuns

### 1. Tela Branca ou Erro 404 após atualização
Isso geralmente é cache do navegador tentando carregar arquivos antigos.
* **No PC:** Pressione `Ctrl + Shift + R` (ou `Cmd + Shift + R` no Mac).
* **No Celular:** Feche a aba ou limpe o cache do navegador.

### 2. Erro "Caixa Fechado"
O sistema bloqueia vendas se não houver um caixa aberto **no dia atual**.
* Vá ao menu **Caixa**.
* Se houver um caixa de ontem aberto, feche-o primeiro.
* Abra o caixa do dia com o valor de troco inicial.

### 3. O Site caiu (Erro 404 ao atualizar página)
Isso acontece se o arquivo `vercel.json` for deletado. Certifique-se de que ele existe na raiz do projeto com o seguinte conteúdo:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}


📦 Estrutura do Banco de Dados (Supabase)

sales / sale_items: Histórico de vendas e produtos vendidos.

products: Cadastro e estoque.

clients: Cadastro de clientes e dívidas (fiado).

cash_register_sessions: Abertura e fechamento de caixa.

cash_register_movements: Sangrias e suprimentos.