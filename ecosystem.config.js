module.exports = {
  apps: [{
    name: "telegram-marketing",
    script: "npm",
    args: "start",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production"
    },
    env_production: {
      NODE_ENV: "production"
    },
    watch: false,
    max_memory_restart: "1G",
    error_file: "logs/err.log",
    out_file: "logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm Z",
    combine_logs: true,
    merge_logs: true,
    autorestart: true
  }]
};
