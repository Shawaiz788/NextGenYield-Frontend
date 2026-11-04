-- ============================================================================
-- NextGenYield Database Schema (PostgreSQL + PostGIS)
-- Derived directly from Chapter 4 Data Dictionary in main.tex
-- ============================================================================

-- Enable UUID extension if UUIDs are used (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (tab:user_table)
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(60) NOT NULL,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'landowner', 'stakeholder')),
    district VARCHAR(50) NOT NULL,
    language_pref VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (language_pref IN ('en', 'ur')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fields Table (tab:field_table)
-- Note: current_cycle_id FK is added after crop_cycles table is defined
CREATE TABLE fields (
    field_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    field_name VARCHAR(50) NOT NULL,
    shape_type VARCHAR(15) NOT NULL CHECK (shape_type IN ('square', 'rectangle', 'polygon', 'circle')),
    area_acres DECIMAL(6, 2) NOT NULL,
    area_sqm DECIMAL(10, 2) NOT NULL,
    boundary_geojson JSONB NOT NULL,
    center_latitude DECIMAL(9, 6) NOT NULL,
    center_longitude DECIMAL(9, 6) NOT NULL,
    current_cycle_id VARCHAR(50), -- FK to crop_cycles(cycle_id)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crop Cycles Table (tab:cropcycle_table)
CREATE TABLE crop_cycles (
    cycle_id VARCHAR(50) PRIMARY KEY,
    field_id VARCHAR(50) NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
    wheat_variety VARCHAR(50) NOT NULL,
    seed_company VARCHAR(60) NOT NULL,
    fertilizer_company VARCHAR(60) NOT NULL,
    sowing_method VARCHAR(30) NOT NULL,
    sowing_date DATE NOT NULL,
    target_harvest_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add circular foreign key from fields -> crop_cycles
ALTER TABLE fields
    ADD CONSTRAINT fk_fields_current_cycle
    FOREIGN KEY (current_cycle_id)
    REFERENCES crop_cycles(cycle_id)
    ON DELETE SET NULL;

-- 4. Field Observations Table (tab:observation_table)
CREATE TABLE field_observations (
    observation_id VARCHAR(50) PRIMARY KEY,
    cycle_id VARCHAR(50) NOT NULL REFERENCES crop_cycles(cycle_id) ON DELETE CASCADE,
    image_uri VARCHAR(255) NOT NULL,
    stage_index INTEGER NOT NULL CHECK (stage_index BETWEEN 0 AND 5),
    stage_name VARCHAR(30) NOT NULL,
    confidence DECIMAL(5, 2) NOT NULL,
    pitch_angle_deg DECIMAL(4, 1) NOT NULL,
    blur_score DECIMAL(6, 2) NOT NULL,
    das INTEGER NOT NULL, -- Days After Sowing
    captured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Fertilizer Schedule Table (tab:fertilizer_table)
CREATE TABLE fertilizer_schedules (
    fertilizer_id VARCHAR(50) PRIMARY KEY,
    cycle_id VARCHAR(50) NOT NULL REFERENCES crop_cycles(cycle_id) ON DELETE CASCADE,
    split_number INTEGER NOT NULL CHECK (split_number BETWEEN 1 AND 3),
    nutrient_type VARCHAR(40) NOT NULL,
    target_das INTEGER NOT NULL,
    dose_per_acre VARCHAR(50) NOT NULL,
    is_applied BOOLEAN NOT NULL DEFAULT FALSE,
    applied_at TIMESTAMP NULL
);

-- 6. Irrigation Schedule Table (tab:irrigation_table)
CREATE TABLE irrigation_schedules (
    irrigation_id VARCHAR(50) PRIMARY KEY,
    cycle_id VARCHAR(50) NOT NULL REFERENCES crop_cycles(cycle_id) ON DELETE CASCADE,
    event_name VARCHAR(40) NOT NULL,
    water_source VARCHAR(30) NOT NULL,
    target_das INTEGER NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. Peer Showcase Fields Table (tab:showcase_table)
CREATE TABLE peer_showcase_fields (
    showcase_id VARCHAR(50) PRIMARY KEY,
    field_code VARCHAR(20) NOT NULL,
    district VARCHAR(50) NOT NULL,
    wheat_variety VARCHAR(50) NOT NULL,
    seed_company VARCHAR(60) NOT NULL,
    fertilizer_company VARCHAR(60) NOT NULL,
    area_acres DECIMAL(6, 2) NOT NULL,
    shape_type VARCHAR(15) NOT NULL CHECK (shape_type IN ('square', 'rectangle', 'polygon', 'circle')),
    yield_maunds_per_acre DECIMAL(5, 1) NOT NULL,
    yield_kg_sqm DECIMAL(5, 2) NOT NULL,
    sowing_date DATE NOT NULL,
    harvest_date DATE NOT NULL,
    cycle_event_log JSONB NOT NULL
);

-- 8. Agronomic Advisory Rules Table (tab:advisory_table)
CREATE TABLE agronomic_advisory_rules (
    rule_id VARCHAR(50) PRIMARY KEY,
    stage_index INTEGER NOT NULL CHECK (stage_index BETWEEN 0 AND 5),
    stage_name VARCHAR(30) NOT NULL,
    summary_text_en TEXT NOT NULL,
    summary_text_ur TEXT NOT NULL,
    irrigation_advice_en TEXT NOT NULL,
    irrigation_advice_ur TEXT NOT NULL,
    nutrient_advice_en TEXT NOT NULL,
    nutrient_advice_ur TEXT NOT NULL,
    risk_alerts JSONB NOT NULL,
    audio_script_ur TEXT NOT NULL
);

-- Indexes for performance & foreign key navigation
CREATE INDEX idx_fields_user_id ON fields(user_id);
CREATE INDEX idx_crop_cycles_field_id ON crop_cycles(field_id);
CREATE INDEX idx_field_observations_cycle_id ON field_observations(cycle_id);
CREATE INDEX idx_fertilizer_schedules_cycle_id ON fertilizer_schedules(cycle_id);
CREATE INDEX idx_irrigation_schedules_cycle_id ON irrigation_schedules(cycle_id);
CREATE INDEX idx_advisory_rules_stage_index ON agronomic_advisory_rules(stage_index);
