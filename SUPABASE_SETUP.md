# 🔧 Configurazione Supabase

Guida passo-passo per configurare Supabase per il progetto Gestore Abbonamenti Software.

## 📋 Passi per la Configurazione

### 1. Crea un Account Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Clicca su "Sign up" e crea un account gratuito
3. Verifica la tua email

### 2. Crea un Nuovo Progetto

1. Una volta loggato, clicca su "New project"
2. Scegli un nome per il tuo progetto (es: `gestore-abbonamenti`)
3. Seleziona la **password del database** (importante: salvala!)
4. Scegli la **regione** più vicina a te
5. Clicca su "Create new project"

### 3. Ottieni le Credenziali del Database

1. Una volta creato il progetto, vai alla **Dashboard**
2. Nel menu laterale, clicca su **Settings** (icona a forma di ingranaggio)
3. Clicca su **Database**
4. Trova la sezione **Connection parameters**
5. Copia l'**URI** dalla sezione **Connection string**

### 4. Ottieni le Chiavi API di Supabase

1. Sempre nella **Dashboard**, vai su **Settings**
2. Clicca su **API**
3. Qui trovi:
   - **URL**: L'URL del tuo progetto Supabase
   - **anon key**: La chiave pubblica (anon key)
   - **service_role key**: La chiave segreta (NON USARE nel frontend!)

**⚠️ IMPORTANTE:**
- **anon key**: È pubblica, può essere usata nel frontend
- **service_role key**: È segreta, NON deve mai essere esposta nel client
- **URL**: È pubblico, serve per le chiamate API

### 5. Configura il File .env.local

La stringa di connessione avrà questo formato:

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Dove:
- `[PROJECT_REF]` - È l'ID del tuo progetto (visibile nell'URL della dashboard)
- `[PASSWORD]` - È la password che hai scelto al punto 2
- `[REGION]` - È la regione che hai scelto (es: `us-east-1`)

**Esempio completo:**
```
postgresql://postgres.abc123def456:MyPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 5. Aggiorna il File .env.local

Sostituisci i placeholder nel file `.env.local`:

```env
# Database connection
DATABASE_URL="postgresql://postgres.abc123def456:MyPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Supabase API Keys (per frontend)
NEXT_PUBLIC_SUPABASE_URL="https://abc123def456.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 6. Verifica la Connessione

```bash
npm run db:push
```

Se tutto è configurato correttamente, dovresti vedere:
- ✅ Schema sincronizzato con il database
- ✅ Prisma Client generato

## 🔍 Risoluzione Problemi

### Errore di Connessione
- Verifica che l'URL sia corretto
- Assicurati che la password non contenga caratteri speciali
- Controlla che il progetto Supabase sia attivo

### Timeout di Connessione
- Supabase ha un limite di connessioni nel piano gratuito
- Verifica di non avere altre connessioni aperte
- La stringa di connessione potrebbe essere errata

### Errore di Autenticazione
- Verifica che la password sia corretta
- Assicurati che l'URL contenga il PROJECT_REF giusto

## 📊 Dashboard Supabase

Una volta configurato, puoi:
1. **Monitorare** il database dalla dashboard Supabase
2. **Visualizzare** i dati con Table Editor
3. **Configurare** backup automatici
4. **Monitorare** le performance

## 🔐 Sicurezza

- **Non condividere** mai le credenziali del database
- **Usa sempre** variabili d'ambiente
- **Limita** l'accesso al database solo alle operazioni necessarie
- **Monitora** gli accessi dalla dashboard Supabase

---

**💡 Suggerimento:** Salva sempre le credenziali in un posto sicuro e non committarle mai nel codice!
