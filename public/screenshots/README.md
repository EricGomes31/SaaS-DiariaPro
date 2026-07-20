# Screenshots da landing page

Salve aqui os prints do app (PNG) com **exatamente** estes nomes — a landing page
(`public/apresentacao-diaria-pro.html`) os referencia por estes caminhos:

| Arquivo | Tela | Onde aparece |
|---|---|---|
| `dashboard.png`      | Dashboard ("Bom dia, admin")        | Herói + og:image (preview no WhatsApp) |
| `controle-dias.png`  | Controle de Dias (calendário)       | Seção "Veja por dentro" |
| `trabalhadores.png`  | Trabalhadores (cartões)             | Seção "Veja por dentro" |
| `pagamentos.png`     | Pagamentos                          | Seção "Veja por dentro" |
| `relatorios.png`     | Relatórios                          | Seção "Veja por dentro" |

## Várias fotos por seção (carrossel)

Cada tela da seção "Veja por dentro" é um carrossel com setinhas (‹ ›). Para adicionar
mais fotos da mesma tela, é só salvar arquivos **numerados em sequência**:

```
controle-dias.png      ← 1ª foto (obrigatória)
controle-dias-2.png    ← 2ª foto
controle-dias-3.png    ← 3ª foto
...
```

Regras:
- A numeração começa em `-2` e tem que ser **sem buracos** — a página para de procurar
  na primeira que faltar (ex.: se existe `-2` e `-4` mas não `-3`, o `-4` é ignorado).
- Vale para qualquer seção: `trabalhadores-2.png`, `pagamentos-2.png`, `relatorios-2.png`, etc.
- As setinhas e as bolinhas só aparecem quando há **2+ fotos** na seção. Com 1 foto, fica igual a antes.
- Não precisa mexer no HTML — é só soltar os arquivos com o nome certo.

## Dicas
- Use os prints em **tema claro** (combinam com o fundo da landing) ou escuro — só mantenha o padrão.
- Ideal: largura ~1600px, PNG. O `dashboard.png` é usado também como imagem de
  compartilhamento (Open Graph) — o ideal é que tenha boa legibilidade em 1200×630.
- Enquanto os arquivos não existirem, a página mostra um placeholder discreto no lugar
  da imagem (não fica quebrada).
