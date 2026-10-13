-- Índices de auth validados (2026-10-13) — ver el análisis completo en README.md.
--
-- Por qué estos y no otros:
-- * El inicio de sesión OAuth busca la cuenta por (providerId, accountId) en
--   CADA acceso y esa pareja no tenía índice (solo había índices por userId):
--   sin esto, Postgres recorre toda la tabla "account" en cada login.
-- * La limpieza de sesiones y verificaciones vencidas filtra por expiresAt;
--   sin índice también es un barrido completo periódico.
-- * Ya existían y se conservan: "user".email (unique), "session".token
--   (unique), session_userId_idx, account_userId_idx y
--   verification_identifier_idx — no se duplica ninguno.
--
-- Nota: Pushidea hoy NO usa cuentas ni base de datos (todo vive en el
-- dispositivo), así que este archivo solo se aplicará si algún día se activa
-- el acceso, copiando migrations/auth/*.sql a migrations/ como indica
-- 0001_auth.sql. No se crea ninguna tabla de la app: el catálogo son 40 ideas
-- en memoria y las guardadas viven en localStorage, donde un índice SQL no
-- aportaría nada y solo encendería Postgres en cada arranque.

create index if not exists "account_provider_account_idx" on "account" ("providerId", "accountId");
create index if not exists "session_expiresAt_idx" on "session" ("expiresAt");
create index if not exists "verification_expiresAt_idx" on "verification" ("expiresAt");
