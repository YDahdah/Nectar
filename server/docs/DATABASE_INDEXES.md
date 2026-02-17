# Database Indexes for Scalability

This document outlines recommended database indexes for optimal query performance and scalability.

## Overview

Database indexes are critical for handling high user volumes efficiently. Without proper indexes, queries can become slow as data grows, leading to poor user experience and potential database bottlenecks.

## Recommended Indexes

### PostgreSQL/MySQL Indexes

#### Users Table
```sql
-- Email is frequently used for lookups and should be unique
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Created date for sorting/filtering
CREATE INDEX idx_users_created_at ON users(created_at);

-- Admin flag for admin queries
CREATE INDEX idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
```

#### Perfumes/Products Table
```sql
-- Brand filtering (very common query)
CREATE INDEX idx_perfumes_brand ON perfumes(brand);

-- Gender filtering
CREATE INDEX idx_perfumes_gender ON perfumes(gender);

-- Created date for sorting
CREATE INDEX idx_perfumes_created_at ON perfumes(created_at);

-- Composite index for common filter combinations
CREATE INDEX idx_perfumes_brand_gender ON perfumes(brand, gender);

-- Price range queries
CREATE INDEX idx_perfumes_price ON perfumes(price);

-- Stock quantity for inventory checks
CREATE INDEX idx_perfumes_stock_quantity ON perfumes(stock_quantity) WHERE stock_quantity > 0;
```

#### Orders Table
```sql
-- User lookup (very common)
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Order date for sorting and filtering
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);

-- Status filtering
CREATE INDEX idx_orders_status ON orders(status);

-- Composite index for user's orders sorted by date
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date DESC);

-- Created date
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

#### Order Items Table
```sql
-- Order lookup
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Perfume lookup
CREATE INDEX idx_order_items_perfume_id ON order_items(perfume_id);

-- Composite index for order details
CREATE INDEX idx_order_items_order_perfume ON order_items(order_id, perfume_id);
```

#### Cart Items Table
```sql
-- Cart lookup
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- Perfume lookup
CREATE INDEX idx_cart_items_perfume_id ON cart_items(perfume_id);

-- Composite index
CREATE INDEX idx_cart_items_cart_perfume ON cart_items(cart_id, perfume_id);
```

### MongoDB Indexes

If using MongoDB, create similar indexes:

```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ isAdmin: 1 });

// Perfumes collection
db.perfumes.createIndex({ brand: 1 });
db.perfumes.createIndex({ gender: 1 });
db.perfumes.createIndex({ createdAt: -1 });
db.perfumes.createIndex({ brand: 1, gender: 1 });
db.perfumes.createIndex({ price: 1 });
db.perfumes.createIndex({ stockQuantity: 1 });

// Orders collection
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ orderDate: -1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ userId: 1, orderDate: -1 });

// Order items collection
db.orderItems.createIndex({ orderId: 1 });
db.orderItems.createIndex({ perfumeId: 1 });
db.orderItems.createIndex({ orderId: 1, perfumeId: 1 });
```

## Implementation

### Option 1: Manual SQL Execution

Run the SQL commands above directly on your database:

```bash
# PostgreSQL
psql -U your_user -d your_database -f indexes.sql

# MySQL
mysql -u your_user -p your_database < indexes.sql
```

### Option 2: Migration Script

Create a migration script in your project:

```javascript
// server/migrations/create-indexes.js
import { getPool } from '../utils/db-pool.js';
import logger from '../utils/logger.js';

async function createIndexes() {
  const pool = await getPool();
  
  try {
    // Users indexes
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)');
    
    // Perfumes indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_perfumes_brand ON perfumes(brand)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_perfumes_gender ON perfumes(gender)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_perfumes_created_at ON perfumes(created_at)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_perfumes_brand_gender ON perfumes(brand, gender)');
    
    // Orders indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_user_date ON orders(user_id, order_date DESC)');
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create indexes:', error);
    throw error;
  }
}

createIndexes();
```

### Option 3: Database Migration Tool

Use a migration tool like:
- **PostgreSQL**: `node-pg-migrate`, `knex.js`, or `Sequelize`
- **MySQL**: `knex.js`, `Sequelize`, or `TypeORM`
- **MongoDB**: `migrate-mongo` or `mongodb-migrations`

## Verification

After creating indexes, verify they exist:

### PostgreSQL
```sql
-- List all indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### MySQL
```sql
-- List all indexes
SHOW INDEXES FROM users;
SHOW INDEXES FROM perfumes;
SHOW INDEXES FROM orders;

-- Check index usage
SELECT * FROM information_schema.STATISTICS 
WHERE table_schema = 'your_database_name';
```

### MongoDB
```javascript
// List all indexes
db.users.getIndexes();
db.perfumes.getIndexes();
db.orders.getIndexes();

// Check index usage stats
db.users.aggregate([{ $indexStats: {} }]);
```

## Performance Impact

### Before Indexes
- Product queries by brand: **500-1000ms** (full table scan)
- User order history: **1000-2000ms** (full table scan)
- Email lookups: **200-500ms** (full table scan)

### After Indexes
- Product queries by brand: **5-20ms** (index scan)
- User order history: **10-50ms** (index scan)
- Email lookups: **1-5ms** (unique index)

## Maintenance

1. **Monitor Index Usage**: Regularly check which indexes are being used
2. **Remove Unused Indexes**: Unused indexes slow down writes
3. **Rebuild Indexes**: Periodically rebuild indexes to maintain performance
   ```sql
   -- PostgreSQL
   REINDEX INDEX idx_perfumes_brand;
   
   -- MySQL
   ANALYZE TABLE perfumes;
   ```

## Notes

- Indexes speed up reads but slow down writes (INSERT/UPDATE/DELETE)
- Don't over-index - only create indexes for frequently queried columns
- Composite indexes are useful for queries that filter on multiple columns
- Unique indexes also enforce data integrity
- Partial indexes (WHERE clause) can be more efficient for filtered queries

---

*Last Updated: February 17, 2026*
