/**
 * Database Connection Pooling Utility
 * 
 * This module provides a connection pooling setup for various databases.
 * Currently supports PostgreSQL, MySQL, and MongoDB.
 * 
 * Usage:
 *   import { getPool } from './utils/db-pool.js';
 *   const pool = await getPool();
 *   const result = await pool.query('SELECT * FROM products');
 * 
 * Environment Variables:
 *   DB_TYPE: 'postgresql' | 'mysql' | 'mongodb'
 *   DB_HOST: Database host
 *   DB_PORT: Database port
 *   DB_NAME: Database name
 *   DB_USER: Database user
 *   DB_PASSWORD: Database password
 *   DB_POOL_MIN: Minimum connections (default: 2)
 *   DB_POOL_MAX: Maximum connections (default: 10)
 */

import logger from "./logger.js";

let pool = null;
let readPool = null;
let poolPromise = null;
let readPoolPromise = null;

/**
 * Get database connection pool (write pool)
 * Uses singleton pattern to ensure only one pool instance
 */
export async function getPool() {
  if (pool) {
    return pool;
  }

  if (!poolPromise) {
    poolPromise = createPool();
  }

  return poolPromise;
}

/**
 * Get read replica connection pool
 * Falls back to write pool if read replica is not configured
 */
export async function getReadPool() {
  // If read replica is not configured, use write pool
  if (!process.env.DB_READ_HOST) {
    return getPool();
  }

  if (readPool) {
    return readPool;
  }

  if (!readPoolPromise) {
    readPoolPromise = createReadPool();
  }

  return readPoolPromise;
}

/**
 * Create database connection pool based on DB_TYPE
 * Optimized pool settings for scalability
 */
async function createPool() {
  const dbType = process.env.DB_TYPE || "postgresql";
  
  // Optimized pool configuration for scalability
  // Adjust based on your database server capacity and expected load
  const isProduction = process.env.NODE_ENV === "production";
  
  const poolConfig = {
    // Minimum connections: Keep some connections warm for faster response
    min: parseInt(process.env.DB_POOL_MIN || (isProduction ? "10" : "2"), 10),
    // Maximum connections: Scale based on environment
    // Production: Higher limit for handling more concurrent requests (increased from 20 to 50)
    max: parseInt(process.env.DB_POOL_MAX || (isProduction ? "50" : "10"), 10),
    // Idle timeout: Close idle connections after 30 seconds
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || "30000", 10),
    // Connection timeout: Fail fast if can't connect within 5 seconds
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || "5000", 10),
    // Statement timeout: Prevent long-running queries (30 seconds)
    statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || "30000", 10),
  };
  
  logger.info(`Database pool configuration: min=${poolConfig.min}, max=${poolConfig.max}, idleTimeout=${poolConfig.idleTimeoutMillis}ms`);

  try {
    switch (dbType.toLowerCase()) {
      case "postgresql":
      case "postgres":
        return await createPostgresPool(poolConfig);

      case "mysql":
      case "mariadb":
        return await createMySQLPool(poolConfig);

      case "mongodb":
        return await createMongoPool(poolConfig);

      default:
        logger.warn(
          `Unknown DB_TYPE: ${dbType}. Database pooling not configured.`
        );
        return null;
    }
  } catch (error) {
    logger.error("Failed to create database pool:", error);
    throw error;
  }
}

/**
 * Create PostgreSQL connection pool
 */
async function createPostgresPool(config) {
  try {
    // Dynamic import to avoid requiring pg if not using PostgreSQL
    const { Pool } = await import("pg");

    const pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      min: config.min,
      max: config.max,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      statement_timeout: config.statementTimeout,
      // Connection keep-alive for better performance
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      // SSL configuration for production
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              rejectUnauthorized: false,
            }
          : false,
      // Application name for monitoring
      application_name: process.env.APP_NAME || "nectar-api",
    });

    // Test connection
    await pool.query("SELECT NOW()");
    logger.info("PostgreSQL connection pool created successfully");

    // Handle pool errors
    pool.on("error", (err) => {
      logger.error("Unexpected error on idle PostgreSQL client", err);
    });

    return pool;
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      logger.warn(
        "pg module not found. Install with: npm install pg"
      );
    }
    throw error;
  }
}

/**
 * Create MySQL connection pool
 */
async function createMySQLPool(config) {
  try {
    // Dynamic import to avoid requiring mysql2 if not using MySQL
    const mysql = await import("mysql2/promise");

    const pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: config.max,
      queueLimit: parseInt(process.env.DB_POOL_QUEUE_LIMIT || "0", 10), // 0 = unlimited queue
      enableKeepAlive: true,
      keepAliveInitialDelay: parseInt(process.env.DB_POOL_KEEPALIVE_DELAY || "0", 10),
      // Connection timeout
      connectTimeout: config.connectionTimeoutMillis,
      // Idle timeout
      idleTimeout: config.idleTimeoutMillis,
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              rejectUnauthorized: false,
            }
          : false,
    });

    // Test connection
    await pool.query("SELECT 1");
    logger.info("MySQL connection pool created successfully");

    return pool;
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      logger.warn(
        "mysql2 module not found. Install with: npm install mysql2"
      );
    }
    throw error;
  }
}

/**
 * Create MongoDB connection pool
 */
async function createMongoPool(config) {
  try {
    // Dynamic import to avoid requiring mongodb if not using MongoDB
    const { MongoClient } = await import("mongodb");

    const uri =
      process.env.DB_URI ||
      `mongodb://${process.env.DB_USER || ""}:${process.env.DB_PASSWORD || ""}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "27017"}/${process.env.DB_NAME || ""}`;

    const client = new MongoClient(uri, {
      minPoolSize: config.min,
      maxPoolSize: config.max,
      maxIdleTimeMS: config.idleTimeoutMillis,
      serverSelectionTimeoutMS: config.connectionTimeoutMillis,
    });

    await client.connect();
    logger.info("MongoDB connection pool created successfully");

    return {
      client,
      db: client.db(process.env.DB_NAME),
      query: async (collection, operation, ...args) => {
        const coll = client.db(process.env.DB_NAME).collection(collection);
        return await coll[operation](...args);
      },
    };
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      logger.warn(
        "mongodb module not found. Install with: npm install mongodb"
      );
    }
    throw error;
  }
}

/**
 * Create read replica connection pool
 * Only created if DB_READ_HOST is configured
 */
async function createReadPool() {
  const dbType = process.env.DB_TYPE || "postgresql";
  const isProduction = process.env.NODE_ENV === "production";
  
  const poolConfig = {
    min: parseInt(process.env.DB_READ_POOL_MIN || (isProduction ? "5" : "1"), 10),
    max: parseInt(process.env.DB_READ_POOL_MAX || (isProduction ? "30" : "5"), 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || "30000", 10),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || "5000", 10),
    statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || "30000", 10),
  };
  
  logger.info(`Read replica pool configuration: min=${poolConfig.min}, max=${poolConfig.max}`);

  try {
    switch (dbType.toLowerCase()) {
      case "postgresql":
      case "postgres":
        return await createPostgresReadPool(poolConfig);

      case "mysql":
      case "mariadb":
        return await createMySQLReadPool(poolConfig);

      case "mongodb":
        // MongoDB read preference is handled at query level
        return await getPool();

      default:
        logger.warn("Read replica not supported for this database type, using write pool");
        return await getPool();
    }
  } catch (error) {
    logger.error("Failed to create read replica pool, falling back to write pool:", error);
    return await getPool();
  }
}

/**
 * Create PostgreSQL read replica pool
 */
async function createPostgresReadPool(config) {
  try {
    const { Pool } = await import("pg");

    const readPool = new Pool({
      host: process.env.DB_READ_HOST,
      port: parseInt(process.env.DB_READ_PORT || process.env.DB_PORT || "5432", 10),
      database: process.env.DB_NAME,
      user: process.env.DB_READ_USER || process.env.DB_USER,
      password: process.env.DB_READ_PASSWORD || process.env.DB_PASSWORD,
      min: config.min,
      max: config.max,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      statement_timeout: config.statementTimeout,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
      application_name: (process.env.APP_NAME || "nectar-api") + "-read",
    });

    await readPool.query("SELECT NOW()");
    logger.info("PostgreSQL read replica pool created successfully");
    
    readPool.on("error", (err) => {
      logger.error("Unexpected error on idle PostgreSQL read replica client", err);
    });

    return readPool;
  } catch (error) {
    logger.error("Failed to create PostgreSQL read replica pool:", error);
    throw error;
  }
}

/**
 * Create MySQL read replica pool
 */
async function createMySQLReadPool(config) {
  try {
    const mysql = await import("mysql2/promise");

    const readPool = mysql.createPool({
      host: process.env.DB_READ_HOST,
      port: parseInt(process.env.DB_READ_PORT || process.env.DB_PORT || "3306", 10),
      database: process.env.DB_NAME,
      user: process.env.DB_READ_USER || process.env.DB_USER,
      password: process.env.DB_READ_PASSWORD || process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: config.max,
      queueLimit: parseInt(process.env.DB_POOL_QUEUE_LIMIT || "0", 10),
      enableKeepAlive: true,
      keepAliveInitialDelay: parseInt(process.env.DB_POOL_KEEPALIVE_DELAY || "0", 10),
      connectTimeout: config.connectionTimeoutMillis,
      idleTimeout: config.idleTimeoutMillis,
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    });

    await readPool.query("SELECT 1");
    logger.info("MySQL read replica pool created successfully");
    return readPool;
  } catch (error) {
    logger.error("Failed to create MySQL read replica pool:", error);
    throw error;
  }
}

/**
 * Close database connection pool gracefully
 */
export async function closePool() {
  const promises = [];
  
  if (pool) {
    try {
      if (pool.end) {
        promises.push(pool.end());
      } else if (pool.client && pool.client.close) {
        promises.push(pool.client.close());
      }
    } catch (error) {
      logger.error("Error closing write pool:", error);
    }
    pool = null;
    poolPromise = null;
  }

  if (readPool) {
    try {
      if (readPool.end) {
        promises.push(readPool.end());
      } else if (readPool.client && readPool.client.close) {
        promises.push(readPool.client.close());
      }
    } catch (error) {
      logger.error("Error closing read pool:", error);
    }
    readPool = null;
    readPoolPromise = null;
  }

  await Promise.all(promises);
  logger.info("Database connection pools closed");
}

// Graceful shutdown
process.on("SIGTERM", closePool);
process.on("SIGINT", closePool);

export default { getPool, closePool };
