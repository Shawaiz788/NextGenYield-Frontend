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

-- ============================================================================
-- Expansion Modules: Soil Prep & Machinery, Team, Community & Marketplace
-- ============================================================================

-- 9. Machinery Listings Table (tab:machinery_table)
CREATE TABLE machinery_listings (
    machinery_id VARCHAR(50) PRIMARY KEY,
    owner_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    machinery_type VARCHAR(40) NOT NULL, -- laser_leveler, tractor, rotavator, seed_drill, chisel_plow
    brand_model VARCHAR(80),
    horsepower DECIMAL(6, 1),
    hourly_rate_pkr DECIMAL(10, 2),
    daily_rate_pkr DECIMAL(10, 2) NOT NULL,
    district VARCHAR(50) NOT NULL,
    location_address VARCHAR(200),
    contact_phone VARCHAR(20) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_machinery_type_district ON machinery_listings(machinery_type, district);

-- 10. Machinery Bookings Table (tab:machinery_booking_table)
CREATE TABLE machinery_bookings (
    booking_id VARCHAR(50) PRIMARY KEY,
    machinery_id VARCHAR(50) NOT NULL REFERENCES machinery_listings(machinery_id) ON DELETE CASCADE,
    renter_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    total_hours DECIMAL(6, 1),
    total_amount_pkr DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled
    purpose_step VARCHAR(50), -- laser_leveling, plowing, rauni, rotavating
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_machinery_bookings_mach_id ON machinery_bookings(machinery_id);
CREATE INDEX idx_machinery_bookings_renter ON machinery_bookings(renter_id);

-- 11. Farm Employees Table (tab:farm_employee_table)
CREATE TABLE farm_employees (
    employee_record_id VARCHAR(50) PRIMARY KEY,
    owner_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    employee_user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
    employee_name VARCHAR(60) NOT NULL,
    employee_phone VARCHAR(20) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'farmhand', -- farmhand, operator, agronomist, manager
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, invited, suspended
    access_all_fields BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_farm_employees_owner ON farm_employees(owner_id);
CREATE INDEX idx_farm_employees_phone ON farm_employees(employee_phone);

-- 12. Field Assignments Table (tab:field_assignment_table)
CREATE TABLE field_assignments (
    assignment_id VARCHAR(50) PRIMARY KEY,
    employee_record_id VARCHAR(50) NOT NULL REFERENCES farm_employees(employee_record_id) ON DELETE CASCADE,
    field_id VARCHAR(50) NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
    can_scan BOOLEAN NOT NULL DEFAULT TRUE,
    can_edit_schedule BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_field_assignments_emp ON field_assignments(employee_record_id);
CREATE INDEX idx_field_assignments_field ON field_assignments(field_id);

-- 13. Community Posts Table (tab:community_post_table)
CREATE TABLE community_posts (
    post_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    author_name VARCHAR(60) NOT NULL,
    author_district VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'general', -- agronomy_tips, disease_alert, machinery, market_prices, general
    title VARCHAR(120) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_community_posts_cat ON community_posts(category);

-- 14. Post Comments Table (tab:post_comment_table)
CREATE TABLE post_comments (
    comment_id VARCHAR(50) PRIMARY KEY,
    post_id VARCHAR(50) NOT NULL REFERENCES community_posts(post_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    author_name VARCHAR(60) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);

-- 15. Post Likes Table (tab:post_like_table)
CREATE TABLE post_likes (
    like_id VARCHAR(50) PRIMARY KEY,
    post_id VARCHAR(50) NOT NULL REFERENCES community_posts(post_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_post_user_like UNIQUE (post_id, user_id)
);

-- 16. User Connections Table (tab:user_connection_table)
CREATE TABLE user_connections (
    connection_id VARCHAR(50) PRIMARY KEY,
    requester_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'accepted',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_connections_req_target ON user_connections(requester_id, target_id);

-- 17. Chat Conversations Table (tab:chat_conversation_table)
CREATE TABLE chat_conversations (
    conversation_id VARCHAR(50) PRIMARY KEY,
    user1_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user2_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_conv_users ON chat_conversations(user1_id, user2_id);

-- 18. Chat Messages Table (tab:chat_message_table)
CREATE TABLE chat_messages (
    message_id VARCHAR(50) PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
    sender_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_msg_conv ON chat_messages(conversation_id);

-- 19. Marketplace Items Table (tab:marketplace_item_table)
CREATE TABLE marketplace_items (
    item_id VARCHAR(50) PRIMARY KEY,
    seller_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    seller_name VARCHAR(60) NOT NULL,
    seller_phone VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(40) NOT NULL, -- seeds, fertilizer, machinery, wheat_grain, pesticides, land_lease, other
    price_pkr DECIMAL(12, 2) NOT NULL,
    condition VARCHAR(20) NOT NULL DEFAULT 'new',
    district VARCHAR(50) NOT NULL,
    location_address VARCHAR(200),
    description TEXT NOT NULL,
    image_url VARCHAR(255),
    is_sold BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_marketplace_cat_district ON marketplace_items(category, district);
