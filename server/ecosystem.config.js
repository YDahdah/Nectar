/**
 * PM2 Ecosystem Configuration
 * Enables cluster mode for horizontal scaling
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 * 
 * This will start multiple instances (one per CPU core) for better performance
 */

export default {
  apps: [
    {
      name: 'nectar-api',
      script: './server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster', // Enable cluster mode
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Auto-restart on crash
      autorestart: true,
      // Watch for file changes (development only)
      watch: false,
      // Max memory before restart (safety net)
      max_memory_restart: '1G',
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Health check
      health_check_grace_period: 3000,
      // Advanced options
      instance_var: 'INSTANCE_ID',
      // Merge logs from all instances
      merge_logs: true,
      // Log date format
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
