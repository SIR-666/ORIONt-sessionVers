const config = {
  user: "admin_prf",
  password: "!23QWE45d",
  server: "10.24.0.98",
  database: "dbExample",
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 50000,
  },
  options: {
    trustServerCertificate: true, 
  }
};
module.exports = config;