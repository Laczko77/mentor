# PRD – Mentoring Management Web Application
**Projekt neve:** MentorTrack  
**Verzió:** 1.0  
**Dátum:** 2026-02-19  
**Készítette:** Laczkovich KRistóf  
**Platform:** Antigravity (AI-agent által programozandó)

---

## 1. Összefoglaló

A MentorTrack egy belső webalkalmazás, amelyet egy Telekom L1-es műszaki csapat mentorálási folyamatainak kezelésére terveztek. A mentor (1 fő) és a mentoráltjai (7–9 fő) számára egy egységes felületet biztosít az időpont-meghirdetésre, jelentkezésre, jóváhagyásra, az óraszámok nyomon követésére és a naptáras beosztás áttekintésére. Az Excel-alapú koordinációt váltja ki.

---

## 2. Felhasználói szerepkörök

| Szerepkör | Leírás |
|-----------|--------|
| **Mentor** | Az alkalmazás adminisztrátora. Időpontokat hirdet, jóváhagyja a jelentkezéseket, nyomon követi az összes mentorált előrehaladását. |
| **Mentorált** | Jelentkezik a meghirdetett időpontokra, látja saját óraegyenlegét és elfogadott foglalkozásait. |

Egyelőre nincs superadmin szükséges (1 mentor), de az architektúra legyen bővíthető.

---

## 3. Technológiai stack

| Réteg | Technológia | Indok |
|-------|-------------|-------|
| **Frontend** | Next.js 14 (App Router) | SSR, routing, API routes |
| **UI komponensek** | shadcn/ui + Tailwind CSS | Könnyen testreszabható, AI-agent számára jól dokumentált |
| **Backend/API** | Python (FastAPI) | Üzleti logika, komplex számítások (óraszám-kalkuláció) |
| **Adatbázis + Auth** | Supabase (PostgreSQL + GoTrue Auth) | Egyszerű setup, valós idejű frissítések, beépített autentikáció |
| **Naptár komponens** | `react-big-calendar` vagy `@fullcalendar/react` | Naptár nézet mentor beosztáshoz |
| **Deployment** | Vercel (frontend) + Railway / Render (FastAPI) | Egyszerű CI/CD |

> **AI-agent megjegyzés:** A shadcn/ui komponensek copy-paste alapú rendszerben működnek (`npx shadcn@latest add <component>`). A FastAPI endpoint-ok RESTful, típusos Pydantic sémákkal dokumentáltak, ami jól követhető az agent számára.

---

## 4. Adatbázis séma (Supabase / PostgreSQL)

### 4.1 `profiles`
Supabase `auth.users` táblához kapcsolt profil.

```sql
id          uuid PRIMARY KEY REFERENCES auth.users(id)
full_name   text NOT NULL
email       text NOT NULL
role        text CHECK (role IN ('mentor', 'mentee')) NOT NULL
joined_at   date NOT NULL  -- fontos az óraküszöb számításához
created_at  timestamptz DEFAULT now()
```

### 4.2 `sessions`
Meghirdetett mentorálási alkalmak (egyéni és csoportos).

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
mentor_id     uuid REFERENCES profiles(id)
title         text NOT NULL
type          text CHECK (type IN ('individual', 'group')) NOT NULL
start_time    timestamptz NOT NULL
end_time      timestamptz NOT NULL
duration_min  int GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time))/60) STORED
max_slots     int DEFAULT 1  -- egyéninél 1, csoportosnál N
location_note text           -- pl. "Teams link" vagy "iroda 3.em"
status        text CHECK (status IN ('open', 'closed', 'cancelled')) DEFAULT 'open'
created_at    timestamptz DEFAULT now()
```

### 4.3 `bookings`
Mentorált jelentkezése egy session-re.

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id   uuid REFERENCES sessions(id) ON DELETE CASCADE
mentee_id    uuid REFERENCES profiles(id)
status       text CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) DEFAULT 'pending'
note         text   -- mentorált megjegyzése
mentor_note  text   -- mentor visszajelzése
created_at   timestamptz DEFAULT now()
UNIQUE(session_id, mentee_id)
```

### 4.4 `completed_hours` (nézet / view)
Számított nézet a tényleges, elfogadott és lezajlott mentorálási percekről.

```sql
CREATE VIEW completed_hours AS
SELECT
  b.mentee_id,
  SUM(s.duration_min) / 60.0 AS completed_hours
FROM bookings b
JOIN sessions s ON s.id = b.session_id
WHERE b.status = 'accepted'
  AND s.end_time < now()
GROUP BY b.mentee_id;
```

---

## 5. Funkcionális követelmények

### 5.1 Autentikáció
- Supabase Auth e-mail + jelszó alapú bejelentkezés.
- Regisztrációt csak a mentor tud kezdeményezni (meghívó alapú, vagy a mentor manuálisan hozza létre a fiókokat az adminfelületen).
- Szerepkör (`role`) mező a `profiles` táblában; middleware védi a role-based útvonalakat.
- Jelszó-visszaállítás e-mailben (Supabase beépített funkció).

### 5.2 Mentor funkciók

#### 5.2.1 Session meghirdetése
- Új mentorálási alkalom létrehozása: cím, típus (egyéni/csoportos), időpont, időtartam, helyszín/link, max. létszám (csoportosnál).
- Módosítás és törlés lehetősége (törléskor a függő/elfogadott foglalások automatikus értesítése).

#### 5.2.2 Foglalások kezelése
- Beérkező `pending` státuszú foglalások listája (értesítés badge a navigációban).
- Elfogadás / elutasítás egyenként, opcionális mentor-megjegyzéssel.
- Csoportos session esetén részleges elfogadás is lehetséges (pl. 3/5-öt fogad el).

#### 5.2.3 Óraszám dashboard
- Táblázat az összes mentorált nevével, kötelező órakereteivel és teljesített óráival.
- Küszöbszabály automatikusan kalkulálva:
  - **< 3 hónap a cégnél** (`joined_at` alapján): **12 kötelező óra**
  - **≥ 3 hónap**: **4 kötelező óra**
  - A határ számítása: `now() - joined_at < interval '3 months'`
- Progress bar vizualizáció (shadcn `Progress` komponens).
- Szűrés: teljesített / nem teljesített / közelítő határidő.

#### 5.2.4 Naptár nézet
- Havi/heti nézet a saját összes meghirdetett sessionjével.
- Esemény színkódolása: `open` (kék), `closed/full` (szürke), `cancelled` (piros).
- Kattintásra session részletek + foglalások listája modal-ban.

#### 5.2.5 Mentoráltkezelés
- Mentoráltakhoz rövid profil (belépés dátuma, státusz) és egyéni megjegyzés mező.
- Meghívó e-mail küldése új mentorált hozzáadásakor (Supabase Auth invite).

### 5.3 Mentorált funkciók

#### 5.3.1 Elérhető sessionök böngészése
- Lista és naptár nézet a szabad, jövőbeli sessionökről.
- Egyéni alkalmak csak akkor láthatók, ha van szabad hely.
- Csoportos alkalmok létszámadattal (pl. „3/8 hely foglalt").

#### 5.3.2 Jelentkezés sessionre
- Egyetlen kattintással + opcionális megjegyzéssel.
- `pending` státuszú foglalás jön létre; a mentorált értesítést kap az elfogadás/elutasítás után.
- Saját jelentkezés visszavonása lehetséges `accepted` előtt.

#### 5.3.3 Saját óraegyenleg
- Dashboard widget: teljesített / kötelező / maradék.
- Korábbi sessionök listája státusszal és mentor-megjegyzéssel.

#### 5.3.4 Saját naptár
- Csak a mentorált elfogadott és pending sessionjeit mutatja.

---

## 6. Értesítési logika

| Esemény | Ki kap értesítést | Csatorna |
|---------|-------------------|----------|
| Mentorált jelentkezik | Mentor | In-app badge |
| Mentor elfogad/elutasít | Mentorált | In-app értesítés |
| Session törlése | Összes érintett | In-app |
| Kötelező óra küszöb 80%-nál | Mentor | In-app figyelmeztetés |

> Az e-mail értesítéseket Supabase Edge Functions küldi.

---

## 7. Kiegészítő funkciók (javasolt)

### 7.1 Ismétlődő sessionök
Mentor beállíthat pl. „minden hétfő 14:00" ismétlődő alkalmakat, amelyek automatikusan létrejönnek adott időhorizontra (pl. 4 hét).

### 7.2 Session sablon
Mentor elmentheti kedvenc session-beállításait (pl. „Heti 1:1 – Teams, 45 perc") és egy kattintással újra meghirdetheti.

### 7.3 Exportálás
- CSV export a teljesített órákról (HR-nek küldéshez).
- iCal / .ics letöltés a naptárból (Google Calendar, Outlook kompatibilis).

### 7.4 Megjegyzések / Session notes
Elfogadott session után a mentor rövid feljegyzést írhat (témák, fejlesztési pontok). Csak a mentor és az érintett mentorált látja.

### 7.5 Statisztika oldal (mentor számára)
- Havi összesítő: hány session volt, hány elfogadott, csoportos vs. egyéni arány.
- Grafikon az egyes mentoráltakhoz teljesített órák trendjéről.

---

## 8. Nem funkcionális követelmények

| Kategória | Elvárás |
|-----------|---------|
| **Teljesítmény** | Oldalak < 2 mp betöltési idő (SSR/ISR, kis felhasználóbázis) |
| **Biztonság** | Supabase Row Level Security (RLS) minden táblán; mentor csak saját adatait látja, mentoráltakét ő is; mentoráltaknak csak saját adataik |
| **Hozzáférhetőség** | shadcn/ui ARIA-kompatibilis komponensek |
| **Bővíthetőség** | Több mentor hozzáadhatósága minimális módosítással |
| **Mobil** | Responsive design (Tailwind breakpoints), nem natív app |

---

## 9. Row Level Security (RLS) szabályok

```sql
-- sessions: mentor látja az összeset, mentorált csak a nyílt/saját sessionöket
-- bookings: mentor látja az összeset; mentorált csak saját foglalásait
-- profiles: mindenki látja az alap profilokat; részletes adatokat csak saját maga

-- Példa sessions policy:
CREATE POLICY "Mentor sees all sessions"
  ON sessions FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'mentor'));

CREATE POLICY "Mentees see open sessions"
  ON sessions FOR SELECT
  USING (status = 'open' AND auth.uid() IN (SELECT id FROM profiles WHERE role = 'mentee'));
```

---

## 10. API végpontok (FastAPI)

### Auth (Supabase kezeli, FastAPI csak validál)
```
POST /auth/login
POST /auth/logout
POST /auth/invite          – mentor meghív új mentoráltot
```

### Sessions
```
GET    /sessions            – lista (szűrők: type, status, date_range)
POST   /sessions            – új session (mentor)
GET    /sessions/{id}       – részletek + foglalások
PUT    /sessions/{id}       – módosítás (mentor)
DELETE /sessions/{id}       – törlés (mentor)
POST   /sessions/{id}/recur – ismétlődő session létrehozása
```

### Bookings
```
POST   /sessions/{id}/book         – mentorált jelentkezik
PUT    /bookings/{id}/status       – mentor elfogad/elutasít
DELETE /bookings/{id}              – mentorált visszavonja
```

### Dashboard
```
GET /dashboard/mentor              – összesített stats, pending count
GET /dashboard/mentee              – saját óraegyenleg
GET /hours/report                  – CSV export
```

### Profiles
```
GET  /profiles                     – mentoráltlista (mentor)
GET  /profiles/{id}                – profil részletek
PUT  /profiles/{id}                – frissítés
```

---

## 11. Képernyő / oldaltérkép

```
/                         → redirect → /dashboard
/login                    → bejelentkezés
/dashboard                → Mentor: stats + pending foglalások
                          → Mentorált: saját egyenleg + következő session
/sessions                 → Session lista (mindkét role)
/sessions/new             → Új session form (mentor)
/sessions/[id]            → Session részletek + foglalás gomb
/calendar                 → Naptár nézet
/hours                    → Óraszám táblázat (mentor) / saját egyenleg (mentorált)
/mentees                  → Mentoráltlista és profilok (mentor)
/mentees/[id]             → Mentorált részletes profil (mentor)
/notifications            → Értesítések listája
/settings                 → Profil, jelszóváltás
```

---

## 12. Fejlesztési prioritások (MVP fázisok)

### Fázis 1 – MVP (2–3 hét)
- Supabase projekt setup (adatbázis, auth, RLS)
- Bejelentkezés / kijelentkezés
- Session CRUD (mentor)
- Egyszerű foglalási folyamat (mentorált → pending → mentor elfogad)
- Óraszám dashboard (alap kalkuláció)

### Fázis 2 – Kiegészítők (1–2 hét)
- Naptár nézet (`react-big-calendar`)
- Értesítések (in-app)
- Session megjegyzések
- CSV export

### Fázis 3 – Nice-to-have
- Ismétlődő sessionök
- Session sablonok
- Statisztika / grafikon oldal

---

## 13. Könyvtárstruktúra (ajánlott)

```
mentor-track/
├── frontend/                  # Next.js App
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── dashboard/
│   │   ├── sessions/
│   │   ├── calendar/
│   │   ├── hours/
│   │   └── mentees/
│   ├── components/
│   │   ├── ui/                # shadcn/ui komponensek
│   │   ├── SessionCard.tsx
│   │   ├── HoursProgress.tsx
│   │   └── CalendarView.tsx
│   ├── lib/
│   │   ├── supabase.ts        # Supabase kliens
│   │   └── api.ts             # FastAPI hívások
│   └── middleware.ts           # Route védelem
│
├── backend/                   # FastAPI
│   ├── main.py
│   ├── routers/
│   │   ├── sessions.py
│   │   ├── bookings.py
│   │   ├── hours.py
│   │   └── profiles.py
│   ├── models/                # Pydantic sémák
│   ├── db/                    # Supabase Python kliens
│   └── utils/
│       └── hours_calculator.py  # Óraküszöb logika
│
└── supabase/
    ├── migrations/            # SQL migrációk
    └── seed.sql               # Teszt adatok
```

---

## 14. Definíciók és megjegyzések

- **Kötelező óra:** A `joined_at` dátumtól számított 3 hónapon belüli mentoráltaknak 12 óra, utána 4 óra / ciklus (a ciklus definícióját pontosítani kell – pl. naptári hónap vagy belépési évforduló).
- **Teljesített óra:** Csak az `accepted` státuszú booking, amelynek `end_time` múlt.
- **Csoportos session:** Egy session-re több mentorált is foglalhat; mindegyikük óraegyenlegébe beleszámít ugyanaz az időtartam.
- **Pending timeout:** Opcionális: ha a mentor X napon belül nem reagál, auto-elutasítás vagy emlékeztető (fázis 2).

---

*Ez a dokumentum alapján az Antigravity AI agent képes legenerálni a teljes alkalmazást. A sémák, route-ok és üzleti logika egyértelműen definiált; ahol döntési pont van (pl. ciklus-definíció), azt a fejlesztés elején tisztázni kell.*
