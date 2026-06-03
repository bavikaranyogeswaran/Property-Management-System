-- DWH Schema in PostgreSQL

-- Dimensions
CREATE TABLE IF NOT EXISTS dim_property (
    property_id INT PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50),
    city VARCHAR(100),
    district VARCHAR(100),
    status VARCHAR(50),
    management_fee_percentage DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS dim_unit (
    unit_id INT PRIMARY KEY,
    property_id INT,
    unit_number VARCHAR(50),
    type VARCHAR(50),
    monthly_rent BIGINT,
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS dim_tenant (
    user_id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    employment_status VARCHAR(50),
    monthly_income BIGINT,
    behavior_score INT
);

CREATE TABLE IF NOT EXISTS dim_date (
    date_id DATE PRIMARY KEY,
    year INT,
    month INT,
    day INT,
    quarter INT,
    month_name VARCHAR(20),
    day_name VARCHAR(20)
);

-- Facts
CREATE TABLE IF NOT EXISTS fact_ledger (
    entry_id INT PRIMARY KEY,
    lease_id INT,
    property_id INT,
    unit_id INT,
    tenant_id INT,
    account_type VARCHAR(50),
    category VARCHAR(50),
    debit BIGINT,
    credit BIGINT,
    entry_date DATE
);

CREATE TABLE IF NOT EXISTS fact_occupancy_snapshot (
    snapshot_date DATE,
    property_id INT,
    total_units INT,
    occupied_units INT,
    occupancy_rate DECIMAL(5,2),
    potential_rent BIGINT,
    actual_rent BIGINT,
    PRIMARY KEY (snapshot_date, property_id)
);

CREATE TABLE IF NOT EXISTS fact_maintenance (
    request_id INT PRIMARY KEY,
    unit_id INT,
    property_id INT,
    tenant_id INT,
    priority VARCHAR(20),
    status VARCHAR(50),
    created_at TIMESTAMP,
    total_cost BIGINT
);

CREATE TABLE IF NOT EXISTS fact_leads (
    lead_id INT PRIMARY KEY,
    property_id INT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    move_in_date DATE,
    score INT,
    conversion_days INT
);
