# Craft Food
Calculadora pessoal de produção GTA RP. Os dados ficam no LocalStorage. Exporte backups regularmente.

## Rodar localmente
Node 22. `npm install`, depois `npm run dev`. Para compilar: `npm run build`.

## GitHub Pages
Envie todo o conteúdo desta pasta (inclusive .github) ao repositório na branch main. Em Settings > Pages > Source, selecione GitHub Actions. Em Actions, execute Publicar no GitHub Pages caso necessário. As rotas usam hash para funcionar sem servidor. Não envie node_modules.

## Itens iniciais adicionados

O site agora inclui automaticamente seis receitas extraídas dos prints fornecidos: Frango Frito, Sprunk Extra, Hambúrguer Vegetariano, Hambúrguer Artesanal, Cola e Toddinhoseu. Elas aparecem no primeiro carregamento e também são adicionadas a instalações com dados existentes (sem apagar ou sobrescrever receitas já cadastradas pelo usuário). Os preços unitários e preços de venda começam em zero, pois não foram informados; podem ser ajustados nos formulários.

As imagens ficam em `public/items/`: o Frango Frito foi recortado do print fornecido e os outros cinco itens usam ilustrações SVG identificativas (não são fotos oficiais do jogo). É possível trocar as imagens depois editando a receita no site.


## Atualização do inventário (print de 21/11/2026)

O estoque inicial agora inclui: Limão 178, Tomate 175, Trigo 196, Frango 116, Carne Animal 190, Açúcar 166, Garrafa de Água 116, Garrafa de Leite 292 e Chocolate 146.

As imagens dos ingredientes são recortes do print enviado, com fundo do jogo; a qualidade é limitada pela resolução da captura.

**Importante:** os estoques existentes que já tenham valor numérico não são substituídos; o estoque do print só preenche registros sem estoque controlado. Preços unitários não foram fornecidos. O item “Real” (55) não foi cadastrado como ingrediente.
