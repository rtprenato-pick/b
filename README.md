# 🛒 Lista de Compras Inteligente

Aplicação web simples para gerenciamento de listas de compras, com sincronização em tempo real na nuvem através do JSONBin.io.

## 🚀 Como instalar no GitHub Pages

1. Faça o fork ou copie este repositório.
2. Crie uma conta gratuita no site [jsonbin.io](https://jsonbin.io).
3. Crie um novo "Bin" contendo apenas `[]`.
4. Copie o seu **Bin ID** e a sua **Master Key**.
5. Abra o arquivo `index.html` e altere as seguintes linhas no final do arquivo:

```javascript
const BIN_ID = 'SEU_BIN_ID_AQUI'; 
const API_KEY = 'SUA_API_KEY_AQUI';
