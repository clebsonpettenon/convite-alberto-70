# Convite Alberto Cotrim - 70 anos

Site gratuito para GitHub Pages com confirmação de presença salva no Supabase.

## Como configurar

1. Crie um projeto gratuito no Supabase.
2. Abra o SQL Editor e execute o conteúdo do arquivo `supabase.sql`.
3. Em Project Settings > API, copie:
   - Project URL
   - anon public key
4. Cole essas informações nos arquivos `script.js` e `admin.js`.
5. Para acessar a área administrativa:
   - Vá em Authentication > Users e crie um usuário com e-mail e senha.
   - No SQL Editor, execute:
     ```sql
     insert into public.admin_usuarios (email)
     values ('seu-email@exemplo.com')
     on conflict (email) do nothing;
     ```
   - Acesse `admin.html` e entre com esse e-mail e senha.
6. Suba os arquivos para um repositório público no GitHub.
7. Vá em Settings > Pages e publique pela branch `main`, pasta `/root`.

O link ficará parecido com:
https://seuusuario.github.io/convite-alberto-70/

A área administrativa ficará em:
https://seuusuario.github.io/convite-alberto-70/admin.html
# convite-alberto-70
