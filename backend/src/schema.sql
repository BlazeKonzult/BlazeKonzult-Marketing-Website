-- BlazeKonzult assessment platform schema (MySQL 5.7+/MariaDB 10.3+, utf8mb4)
-- Applied by `npm run migrate` (dist/cli.js). Idempotent: CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner','admin','editor','sales','viewer') NOT NULL DEFAULT 'viewer',
  active TINYINT(1) NOT NULL DEFAULT 1,
  failed_logins INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` MEDIUMTEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Global library of assessment categories (step groups)
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(60) NOT NULL UNIQUE,
  data MEDIUMTEXT NOT NULL,           -- JSON: name{en,nl}, description{en,nl}, weight, sort, scored
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Global question bank
CREATE TABLE IF NOT EXISTS questions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  status ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
  data MEDIUMTEXT NOT NULL,           -- JSON question definition (see engine.php)
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendation rule library
CREATE TABLE IF NOT EXISTS recommendation_rules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  active TINYINT(1) NOT NULL DEFAULT 1,
  data MEDIUMTEXT NOT NULL,           -- JSON rule (see engine.php)
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assessment types (working configuration)
CREATE TABLE IF NOT EXISTS templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  status ENUM('draft','published','unpublished','archived') NOT NULL DEFAULT 'draft',
  data MEDIUMTEXT NOT NULL,           -- JSON: name/summary/intro/seo {en,nl}, settings, thresholds, sort
  current_version_id INT UNSIGNED NULL,
  deleted_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS template_questions (
  template_id INT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  overrides TEXT NULL,                -- JSON: weight, required
  PRIMARY KEY (template_id, question_id),
  KEY (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Immutable published snapshots: results always reference the version used
CREATE TABLE IF NOT EXISTS template_versions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id INT UNSIGNED NOT NULL,
  version INT UNSIGNED NOT NULL,
  snapshot MEDIUMTEXT NOT NULL,       -- JSON: full template, categories, questions, thresholds, rules
  checksum CHAR(64) NOT NULL,
  published_by INT UNSIGNED NULL,
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (template_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Anonymous funnel tracking (no answers, no personal data)
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_id CHAR(32) NOT NULL UNIQUE,
  template_id INT UNSIGNED NOT NULL,
  version_id INT UNSIGNED NOT NULL,
  locale CHAR(2) NOT NULL DEFAULT 'en',
  max_step INT NOT NULL DEFAULT 0,
  step_count INT NOT NULL DEFAULT 0,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  KEY (template_id, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_ref CHAR(12) NOT NULL UNIQUE,            -- non-guessable display reference for staff
  token_hash CHAR(64) NOT NULL UNIQUE,            -- sha256 of participant result token
  idempotency_key CHAR(36) NOT NULL UNIQUE,       -- prevents duplicate/concurrent double submits
  session_id INT UNSIGNED NULL,
  template_id INT UNSIGNED NOT NULL,
  version_id INT UNSIGNED NOT NULL,
  locale CHAR(2) NOT NULL DEFAULT 'en',
  answers_enc MEDIUMTEXT NOT NULL,                -- encrypted JSON answers
  result_enc MEDIUMTEXT NOT NULL,                 -- encrypted JSON result
  overall_score DECIMAL(5,1) NULL,                -- plain aggregates for analytics only
  classification VARCHAR(40) NULL,
  coverage DECIMAL(5,1) NULL,
  uncertainty DECIMAL(5,1) NULL,
  category_scores TEXT NULL,                      -- JSON {category: score}
  gap_codes TEXT NULL,                            -- comma list of critical gap question codes
  industry VARCHAR(60) NULL,
  company_size VARCHAR(20) NULL,
  country VARCHAR(20) NULL,
  result_expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (template_id, created_at),
  KEY (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_ref CHAR(12) NOT NULL UNIQUE,
  source ENUM('assessment','contact','checklist','newsletter') NOT NULL,
  assessment_id INT UNSIGNED NULL,
  status ENUM('new','contacted','qualified','consultation_scheduled','proposal_sent','converted','closed') NOT NULL DEFAULT 'new',
  priority ENUM('high','medium','low') NOT NULL DEFAULT 'low',
  priority_score INT NOT NULL DEFAULT 0,
  name_enc TEXT NULL,
  company_enc TEXT NULL,
  email_enc TEXT NOT NULL,
  email_hash CHAR(64) NOT NULL,                   -- HMAC blind index for duplicate detection
  phone_enc TEXT NULL,
  job_title_enc TEXT NULL,
  message_enc MEDIUMTEXT NULL,
  details TEXT NULL,                              -- JSON non-sensitive: contact_method, timeframe, company_size, interests, need
  wants_report TINYINT(1) NOT NULL DEFAULT 0,
  wants_consultation TINYINT(1) NOT NULL DEFAULT 0,
  consent_privacy_at DATETIME NULL,
  consent_marketing TINYINT(1) NOT NULL DEFAULT 0,
  consent_marketing_at DATETIME NULL,
  assigned_to INT UNSIGNED NULL,
  locale CHAR(2) NOT NULL DEFAULT 'en',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY (status), KEY (source), KEY (email_hash), KEY (created_at), KEY (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lead_notes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,
  note_enc TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT UNSIGNED NOT NULL,
  lead_id INT UNSIGNED NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  download_count INT NOT NULL DEFAULT 0,
  last_download_at DATETIME NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_outbox (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind VARCHAR(60) NOT NULL,
  to_enc TEXT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_enc MEDIUMTEXT NOT NULL,
  text_enc MEDIUMTEXT NOT NULL,
  status ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  next_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_error VARCHAR(500) NULL,
  lead_id INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  KEY (status, next_attempt_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  entity VARCHAR(40) NULL,
  entity_id VARCHAR(40) NULL,
  meta TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (created_at), KEY (entity, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket CHAR(64) NOT NULL,
  window_start INT UNSIGNED NOT NULL,
  hits INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin sessions (DB-backed so multiple Node processes share them). id = sha256(cookie token).
CREATE TABLE IF NOT EXISTS admin_sessions (
  id CHAR(64) PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  csrf CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_docs (
  doc_key VARCHAR(120) NOT NULL PRIMARY KEY,
  data MEDIUMTEXT NOT NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_revisions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doc_key VARCHAR(120) NOT NULL,
  data MEDIUMTEXT NULL,
  action VARCHAR(20) NOT NULL DEFAULT 'save',
  user_id INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (doc_key, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file VARCHAR(64) NOT NULL UNIQUE,
  original_name VARCHAR(190) NOT NULL,
  mime VARCHAR(40) NOT NULL,
  size INT UNSIGNED NOT NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  alt VARCHAR(300) NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_mfa (
  user_id INT UNSIGNED NOT NULL PRIMARY KEY,
  secret_enc TEXT NOT NULL,
  enabled_at DATETIME NOT NULL,
  last_step BIGINT NOT NULL DEFAULT 0,
  recovery TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mfa_challenges (
  id CHAR(64) NOT NULL PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  purpose ENUM('verify','setup') NOT NULL,
  secret_enc TEXT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trusted_devices (
  id CHAR(64) NOT NULL PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  label VARCHAR(190) NULL,
  expires_at DATETIME NOT NULL,
  last_used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-user interface preferences (theme, sidebar, notification read state and preferences)
CREATE TABLE IF NOT EXISTS user_prefs (
  user_id INT UNSIGNED NOT NULL,
  `key` VARCHAR(60) NOT NULL,
  `value` TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- URL redirects managed from the admin (applied before the website renders)
CREATE TABLE IF NOT EXISTS redirects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_path VARCHAR(300) NOT NULL UNIQUE,
  to_path VARCHAR(500) NOT NULL,
  status_code SMALLINT NOT NULL DEFAULT 301,
  hits INT UNSIGNED NOT NULL DEFAULT 0,
  last_hit_at DATETIME NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
