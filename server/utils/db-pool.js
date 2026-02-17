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
let poolPromise = null;

/**
 * Get database connection pool
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
 * Close database connection pool gracefully
 */
export async function closePool() {
  if (!pool) {
    return;
  }

  try {
    if (pool.end) {
      // PostgreSQL/MySQL
      await pool.end();
    } else if (pool.client && pool.client.close) {
      // MongoDB
      await pool.client.close();
    }
    pool = null;
    poolPromise = null;
    logger.info("Database connection pool closed");
  } catch (error) {
    logger.error("Error closing database pool:", error);
  }
}

// Graceful shutdown
process.on("SIGTERM", closePool);
process.on("SIGINT", closePool);

export default { getPool, closePool };
