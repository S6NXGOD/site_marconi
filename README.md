# Portal — Grupo Dr. Marconi Nunes

Portal institucional e de notícias do Grupo, unindo as duas frentes:
**CONPLAN** (gestão pública, prefeituras e municípios) e
**Marconi Nunes Contabilidade** (setor privado).

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL · NextAuth

---

## O que o site tem

**Público**
- Portal de notícias com grade editorial e filtro por categoria (Gestão Pública / Setor Privado / Geral)
- Notícia completa em `/noticias/[slug]`, com compartilhamento e relacionadas
- **Alertas & Prazos** com contagem regressiva (ex.: DAS, DCTFWeb, TCE-PI) e aviso flutuante
- **Áreas de Atuação** — as duas verticais em abas
- **Contas Aprovadas** — reels do Instagram incorporados
- **Fale Conosco** — grava o lead no banco
- Flutuante de WhatsApp com atendimento por setor

**Painel (`/admin`, protegido)**
- Notícias (CRUD + upload de capa)
- Alertas & Prazos (CRUD)
- Contas Aprovadas (CRUD por link de embed)
- Leads recebidos, com status e atalhos de contato
- Troca de senha em `/admin/conta`

---

## Rodando localmente

```bash
npm install
cp .env.example .env      # preencha DATABASE_URL, NEXTAUTH_SECRET, ADMIN_*
npm run db:migrate        # cria as tabelas
npm run db:seed           # cria o admin (lê ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev               # http://localhost:3000
```

Gere o segredo do NextAuth com:

```bash
openssl rand -base64 32
```

> **Banco já existente (criado com `db push` antes das migrations)?**
> Marque a migration inicial como aplicada, sem recriar as tabelas:
> `npx prisma migrate resolve --applied 0_init`

---

## Deploy no Railway

Tudo roda no Railway: aplicação, PostgreSQL e as imagens (volume).

### 1. Banco

No projeto do Railway: **New → Database → PostgreSQL**.

### 2. Aplicação

**New → GitHub Repo** e selecione este repositório.
O `railway.json` já define build, start e healthcheck — não precisa configurar nada na mão.

### 3. Volume das imagens (importante)

No serviço da aplicação: **Settings → Volumes → New Volume**

- **Mount path:** `/app/uploads`

Sem o volume, o disco do container é efêmero e **todas as imagens enviadas
pelo painel somem no próximo deploy**. O código detecta o volume sozinho
através de `RAILWAY_VOLUME_MOUNT_PATH`.

### 4. Variáveis

Em **Variables**, no serviço da aplicação:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` (referência ao serviço do banco) |
| `NEXTAUTH_SECRET` | resultado de `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://SEU-APP.up.railway.app` (ou o domínio próprio) |
| `ADMIN_EMAIL` | e-mail do administrador |
| `ADMIN_PASSWORD` | senha inicial forte (mín. 8 caracteres) |
| `ADMIN_NAME` | opcional — padrão: "Administrador" |

`PORT` é injetada pelo Railway e o Next usa automaticamente.

### 5. Deploy

No start (`npm run start:migrate`) acontece, nesta ordem:

1. `prisma migrate deploy` — aplica as migrations
2. `tsx prisma/seed.ts` — cria o admin **apenas se ainda não existir**
3. `next start`

O healthcheck em `/api/health` testa app **e** banco.

### 6. Domínio próprio

**Settings → Networking → Custom Domain**. Depois atualize `NEXTAUTH_URL`
(e `NEXT_PUBLIC_SITE_URL`, se usar) para o domínio final e refaça o deploy —
senão o login e o `sitemap.xml` continuam apontando para o domínio antigo.

---

## Decisões que valem saber

**O site nunca inventa conteúdo.** Não há dados de demonstração: sem notícia
publicada, a seção mostra um estado vazio adequado; sem reels, a seção some;
sem prazos, o aviso não aparece. Nada de notícia fictícia num site no ar.

**Imagens não usam host externo.** O otimizador do Next está fechado
(`remotePatterns: []`) para o site não virar proxy de imagens de terceiros.
Toda imagem entra por upload e é servida em `/api/uploads/[arquivo]`.

**Uploads ficam fora de `public/`.** O `next start` indexa `public/` no boot,
então um arquivo enviado depois só apareceria após reiniciar. Por isso são
servidos por uma rota dedicada, a partir do volume.

**A senha do admin não fica presa no ambiente.** A variável só cria o usuário
na primeira vez; depois disso a troca é feita em `/admin/conta` e nenhum
deploy sobrescreve.

**Preview não é indexado.** Só o domínio de produção libera `robots.txt`,
evitando que o domínio `*.up.railway.app` concorra no Google.

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | desenvolvimento |
| `npm run build` | build de produção |
| `npm run start` | sobe o build (sem migrations) |
| `npm run start:migrate` | migrations + admin + start — usado pelo Railway |
| `npm run db:migrate` | aplica migrations |
| `npm run db:seed` | cria o admin, se não existir |
| `npm run db:studio` | Prisma Studio |
