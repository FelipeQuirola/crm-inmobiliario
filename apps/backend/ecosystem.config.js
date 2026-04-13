module.exports = {
  apps: [
    {
      name: 'crm-backend',
      script: './dist/src/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        UPLOADS_PATH: '/root/crm/apps/backend/uploads',
      },
    },
  ],
};
