# 🏢 Gestore Abbonamenti Software

Una piattaforma web completa per la gestione di utenti abbonati a software esterni, con automazioni GitHub, Vercel e Stripe.

## ✨ Caratteristiche

- 🔐 **Autenticazione Admin** con NextAuth.js
- 🗄️ **Database** PostgreSQL con Prisma ORM
- 🔄 **Automazioni** GitHub repository e Vercel deployment
- 💳 **Pagamenti** integrati con Stripe
- 🎨 **UI Moderna** con Tailwind CSS
- 📱 **Responsive Design**

## 🛠️ Stack Tecnologico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Autenticazione**: NextAuth.js
- **Pagamenti**: Stripe API
- **Deploy**: Vercel

## 🚀 Quick Start

### 1. Clona il Progetto
```bash
git clone <url-del-tuo-repo>
cd gestore-abbonamenti-software
npm install
```

### 2. Configura Supabase

1. **Crea un progetto** su [Supabase](https://supabase.com)
2. **Ottieni le credenziali**:
   - **Database URL** dalla sezione Database → Connection parameters
   - **Project URL** e **anon key** dalla sezione Settings → API
3. **Aggiorna il file `.env.local`**:

```env
# Database connection
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Supabase API Keys (per frontend)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
```

### 3. Configura le Variabili d'Ambiente

Copia il template e aggiorna i valori:

```bash
cp .env.example .env.local
```

Modifica `.env.local` con:
- **Supabase**: URL del database, Project URL e anon key
- **NextAuth**: Secret sicuro
- **Stripe**: Chiavi API (opzionale per test)

**📖 Guida completa**: Vedi [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### 4. Inizializza il Database

```bash
# Push schema al database
npm run db:push

# Crea admin di default
npm run db:seed
```

### 5. Avvia l'Applicazione

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## 🔑 Credenziali di Default

- **Email Admin**: `admin@gestoreabbonamenti.com`
- **Password Admin**: `admin123`

## 📋 Configurazione API

### GitHub Integration
1. Crea un **Personal Access Token** su GitHub
2. Vai su `/settings` nell'app
3. Inserisci il token e username GitHub

### Stripe Integration
1. Crea un account su [Stripe](https://stripe.com)
2. Ottieni le chiavi API dalla dashboard
3. Configura i webhook per i pagamenti

## 🗄️ Struttura Database

### Tabelle Principali
- `Admin` - Utenti amministratori
- `Configuration` - Configurazioni API
- `Subscriber` - Abbonati/clienti
- `Payment` - Pagamenti e transazioni

## 📊 Funzionalità

- ✅ Gestione utenti abbonati
- ✅ Automazioni GitHub repository
- ✅ Deployment automatico Vercel
- ✅ Sistema di pagamenti ricorrenti
- ✅ Dashboard admin completa
- ✅ Webhook Stripe
- ✅ API REST complete

## 🔧 Scripts Disponibili

```bash
npm run dev          # Server di sviluppo
npm run build        # Build di produzione
npm run start        # Avvia in produzione
npm run lint         # Controllo linting
npm run db:push      # Push schema database
npm run db:seed      # Seed database
npm run db:studio    # Prisma Studio
```

## 🚀 Deploy

### Vercel (Raccomandato)
1. Collega il repo a [Vercel](https://vercel.com)
2. Configura le variabili d'ambiente
3. Deploy automatico

### Altre Piattaforme
- Netlify
- Railway
- Render
- Heroku

## 📝 Note di Sviluppo

- Il progetto è completamente **configurabile** dall'admin
- **Sicurezza** implementata con token criptati
- **Automazioni** complete per gestione abbonati
- **Scalabile** e **mantenibile**

## 🤝 Contribuire

1. Fork il progetto
2. Crea un branch per le tue feature
3. Commit le modifiche
4. Push al branch
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è privato e riservato.

---

**Made with ❤️ per la gestione abbonamenti software**
