# Craft Food — configuração do estoque compartilhado

Esta versão é uma implementação inicial, não um site já publicado. Faça backup do estoque anterior e use um projeto Supabase de teste antes de substituir a versão em produção.

## 1. Banco e autenticação
1. Crie um projeto em https://supabase.com/.
2. Em SQL Editor, execute o conteúdo de `supabase/setup.sql` uma única vez em um banco novo.
3. Em Authentication, desative o cadastro público (Allow new users to sign up). Mantenha autenticação por email/senha habilitada.
4. Em Authentication > Users, crie o primeiro usuário manualmente, com email `rp-ID@craftfood.invalid` (substitua ID pelo número real, ex.: `rp-152@craftfood.invalid`), senha forte e confirmação de email ativada na criação administrativa. Não use email pessoal. Anote o UUID do usuário.
5. No SQL Editor, vincule o usuário:

```sql
insert into public.profiles(user_id, first_name,last_name,rp_id,role)
values ('UUID-DO-USUARIO','Nome','Sobrenome','152','owner');
```

Para os outros membros, repita os passos 4 e 5 com IDs distintos e cargo `member` ou `manager`. Não compartilhe o acesso ao painel Supabase com membros. A criação e redefinição de senhas são feitas pelo administrador no Auth; endereços sintéticos não recebem emails. O painel do site permite bloquear e alterar o cargo de contas existentes. O nome e sobrenome são do personagem, conforme o cadastro.

## 2. GitHub Pages
- Envie os arquivos desta pasta (incluindo `.github`, `src`, `public`, `supabase`) para o repositório, preservando a estrutura.
- Em Settings > Secrets and variables > Actions > Variables, crie `VITE_SUPABASE_URL` com o Project URL e `VITE_SUPABASE_ANON_KEY` com a chave pública anon ou publishable do projeto. Nunca use a service_role nem a chave secret no frontend.
- Em Settings > Pages, selecione GitHub Actions como Source. Execute o workflow Deploy GitHub Pages (ou faça push para main).
- Localmente: copie `.env.example` para `.env.local`, preencha as duas variáveis e execute `npm install` e `npm run dev`. Para compilar: `npm run build`.

## 3. Primeiro acesso
O dono entra primeiro. O banco vazio é inicializado com o estoque local do navegador do dono, filtrado para os sete ingredientes novos; as seis receitas são inicializadas com rendimento de 10 unidades e preços não informados representados por zero. Estoque sem informação permanece não controlado.. Para migrar de outro domínio, exporte um backup antes e importe pela página de backup após inicializar. O login usa nome, sobrenome, ID e senha. Os cadastros/receitas/estoque são compartilhados; planejamento e lista de compras permanecem locais ao navegador. O site consulta novas alterações a cada 5 segundos. Se dois membros editarem simultaneamente, a versão do banco é conferida e uma operação desatualizada é rejeitada.

## 4. Prints
Na página Ingredientes, recorte a imagem para conter apenas a grade retangular de inventário (incluindo slots vazios). Cole Ctrl+V ou selecione PNG/JPG/WEBP de até 2,9 MB. Informe colunas e linhas (o exemplo tinha 5 por 2). O OCR lê o canto superior esquerdo e a área do nome. Confirme e corrija cada correspondência e quantidade. Itens não selecionados são ignorados. Pilhas repetidas selecionadas no mesmo print são somadas automaticamente. Confira se não há duplicações indevidas. Não zera itens ausentes. O reconhecimento de ícones não foi implementado; nomes truncados só são associados quando o prefixo coincide de forma única. A leitura exige internet para carregar os recursos do Tesseract na primeira execução e precisa ser calibrada com prints completos reais.

## 5. Registros e limites
O servidor grava conta autenticada, nome, ID, horário, estado anterior e posterior e a imagem original (armazenada como texto base64 no banco, não em Storage). Dono e gerente veem os 50 registros mais recentes. O dono pode solicitar restauração de um estado anterior completo; isso também afeta alterações posteriores e é uma nova edição auditada. As regras SQL impedem escrita direta por membros e restringem a RPC de membros a alterações de estoque acompanhadas de print. O print é evidência enviada pelo usuário, não prova de que o estoque realmente existe no jogo. As telas antigas de edição podem exibir alguns botões mesmo para membros; o servidor rejeita essas operações. Não há integração direta com o jogo. O volume de prints e snapshots consome espaço no banco; monitore cotas e defina retenção antes de usar intensivamente.

## 6. Checklist antes de produção
- Teste login do dono, gerente, membro e bloqueado; verifique que membro não altera preços nem acessa registros de terceiros.
- Confirme que cadastro público está desativado.
- Teste importação com prints reais, conferindo números e nomes, pilhas duplicadas e itens ausentes.
- Abra dois navegadores com contas diferentes, faça importações, verifique sincronização e conflito de versões.
- Confira histórico e restauração com dados de teste; exporte backups regularmente.
- Não há teste de integração realizado com um projeto Supabase real nesta entrega.

## 7. Catálogo atualizado
O catálogo inicial contém somente Filé de Peixe, Ovo, Trigo, Garrafa de Água, Morango, Laranja e Maracujá. Se já existir um estado no Supabase, o novo catálogo não sobrescreve esse estado automaticamente: faça backup e ajuste os cadastros como dono, ou inicialize um projeto novo. Não importe um backup antigo inteiro se quiser manter apenas o novo catálogo. As imagens novas e o OCR por ícones ainda não foram implementados. Confirme se 10x representa o rendimento por fabricação.
