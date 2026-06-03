import mysql from 'mysql2/promise';
import pkg from 'pg';
const { Client } = pkg;
import format from 'pg-format';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

// Config
const MYSQL_CONFIG = {
  host: process.env.SRC_DB_HOST || 'db',
  user: process.env.SRC_DB_USER || 'pms_user',
  password: process.env.SRC_DB_PASSWORD || 'password',
  database: process.env.SRC_DB_NAME || 'pms_database',
  timezone: '+00:00'
};

const PG_CONFIG = {
  host: process.env.DWH_DB_HOST || 'dwh-db',
  user: process.env.DWH_DB_USER || 'dwh_user',
  password: process.env.DWH_DB_PASSWORD || 'dwh_password',
  database: process.env.DWH_DB_NAME || 'pms_dwh',
  port: 5432
};

const CRON_SCHEDULE = process.env.ETL_CRON_SCHEDULE || '0 1 * * *';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runETL() {
  console.log(`[${new Date().toISOString()}] Starting ETL Sync...`);
  
  let mysqlConn, pgClient;
  
  try {
    mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
    pgClient = new Client(PG_CONFIG);
    await pgClient.connect();
    
    // Initialize Schema if needed
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf8');
    await pgClient.query(schemaSql);
    
    // ==========================================
    // 1. Sync dim_property
    // ==========================================
    console.log('Syncing dim_property...');
    const [properties] = await mysqlConn.query(`
      SELECT p.property_id, p.name, pt.name as type, p.city, p.district, p.status, p.management_fee_percentage
      FROM properties p
      LEFT JOIN property_types pt ON p.property_type_id = pt.type_id
    `);
    
    await pgClient.query('TRUNCATE TABLE dim_property CASCADE');
    if (properties.length > 0) {
      const propValues = properties.map(p => [p.property_id, p.name, p.type, p.city, p.district, p.status, p.management_fee_percentage]);
      await pgClient.query(format('INSERT INTO dim_property (property_id, name, type, city, district, status, management_fee_percentage) VALUES %L', propValues));
    }

    // ==========================================
    // 2. Sync dim_unit
    // ==========================================
    console.log('Syncing dim_unit...');
    const [units] = await mysqlConn.query(`
      SELECT u.unit_id, u.property_id, u.unit_number, ut.name as type, u.monthly_rent, u.status
      FROM units u
      LEFT JOIN unit_types ut ON u.unit_type_id = ut.type_id
    `);
    
    await pgClient.query('TRUNCATE TABLE dim_unit CASCADE');
    if (units.length > 0) {
      const unitValues = units.map(u => [u.unit_id, u.property_id, u.unit_number, u.type, u.monthly_rent, u.status]);
      await pgClient.query(format('INSERT INTO dim_unit (unit_id, property_id, unit_number, type, monthly_rent, status) VALUES %L', unitValues));
    }

    // ==========================================
    // 3. Sync dim_tenant
    // ==========================================
    console.log('Syncing dim_tenant...');
    const [tenants] = await mysqlConn.query(`
      SELECT u.user_id, u.name, u.email, t.employment_status, t.monthly_income, t.behavior_score
      FROM users u
      JOIN tenants t ON u.user_id = t.user_id
    `);
    
    await pgClient.query('TRUNCATE TABLE dim_tenant CASCADE');
    if (tenants.length > 0) {
      const tenantValues = tenants.map(t => [t.user_id, t.name, t.email, t.employment_status, t.monthly_income, t.behavior_score]);
      await pgClient.query(format('INSERT INTO dim_tenant (user_id, name, email, employment_status, monthly_income, behavior_score) VALUES %L', tenantValues));
    }

    // ==========================================
    // 4. Sync fact_ledger
    // ==========================================
    console.log('Syncing fact_ledger...');
    const [ledgers] = await mysqlConn.query(`
      SELECT al.entry_id, al.lease_id, l.unit_id, u.property_id, l.tenant_id, 
             al.account_type, al.category, al.debit, al.credit, al.entry_date
      FROM accounting_ledger al
      LEFT JOIN leases l ON al.lease_id = l.lease_id
      LEFT JOIN units u ON l.unit_id = u.unit_id
    `);
    
    await pgClient.query('TRUNCATE TABLE fact_ledger CASCADE');
    if (ledgers.length > 0) {
      const ledgerValues = ledgers.map(l => [l.entry_id, l.lease_id, l.property_id, l.unit_id, l.tenant_id, l.account_type, l.category, l.debit, l.credit, l.entry_date]);
      const batchSize = 1000;
      for (let i = 0; i < ledgerValues.length; i += batchSize) {
        const batch = ledgerValues.slice(i, i + batchSize);
        await pgClient.query(format('INSERT INTO fact_ledger (entry_id, lease_id, property_id, unit_id, tenant_id, account_type, category, debit, credit, entry_date) VALUES %L', batch));
      }
    }

    // ==========================================
    // 5. Sync fact_maintenance
    // ==========================================
    console.log('Syncing fact_maintenance...');
    const [maintenance] = await mysqlConn.query(`
      SELECT m.request_id, m.unit_id, u.property_id, m.tenant_id, m.priority, m.status, m.created_at, 
             COALESCE(SUM(mc.amount), 0) as total_cost
      FROM maintenance_requests m
      LEFT JOIN units u ON m.unit_id = u.unit_id
      LEFT JOIN maintenance_costs mc ON m.request_id = mc.request_id AND mc.status = 'active'
      GROUP BY m.request_id, m.unit_id, u.property_id, m.tenant_id, m.priority, m.status, m.created_at
    `);
    
    await pgClient.query('TRUNCATE TABLE fact_maintenance CASCADE');
    if (maintenance.length > 0) {
      const maintValues = maintenance.map(m => [m.request_id, m.unit_id, m.property_id, m.tenant_id, m.priority, m.status, m.created_at, m.total_cost]);
      await pgClient.query(format('INSERT INTO fact_maintenance (request_id, unit_id, property_id, tenant_id, priority, status, created_at, total_cost) VALUES %L', maintValues));
    }
    
    // ==========================================
    // 6. Sync fact_leads
    // ==========================================
    console.log('Syncing fact_leads...');
    const [leads] = await mysqlConn.query(`
      SELECT l.lead_id, l.property_id, l.status, l.created_at, l.move_in_date, l.score,
             DATEDIFF(
               (SELECT changed_at FROM lead_stage_history lsh WHERE lsh.lead_id = l.lead_id AND to_status = 'converted' LIMIT 1),
               l.created_at
             ) as conversion_days
      FROM leads l
    `);
    
    await pgClient.query('TRUNCATE TABLE fact_leads CASCADE');
    if (leads.length > 0) {
      const leadValues = leads.map(l => [l.lead_id, l.property_id, l.status, l.created_at, l.move_in_date, l.score, l.conversion_days]);
      await pgClient.query(format('INSERT INTO fact_leads (lead_id, property_id, status, created_at, move_in_date, score, conversion_days) VALUES %L', leadValues));
    }

    console.log(`[${new Date().toISOString()}] ETL Sync Completed Successfully!`);

  } catch (err) {
    console.error(`[${new Date().toISOString()}] ETL Sync Failed:`, err);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    if (pgClient) await pgClient.end();
  }
}

// Start sequence
async function init() {
  console.log("ETL Worker starting up... waiting 30s for DBs to be ready.");
  await delay(30000);
  
  // Run once on startup
  await runETL();

  // Schedule cron
  cron.schedule(CRON_SCHEDULE, async () => {
    await runETL();
  });
  
  console.log(`ETL Job scheduled with cron: ${CRON_SCHEDULE}`);
}

init();
