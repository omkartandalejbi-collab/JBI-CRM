import app from './app.js';
import { CONFIG } from './config/index.js';
import prisma from './prisma.js';

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✔ Connected to SQLite Database successfully.');

    app.listen(CONFIG.PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 JBI CRM Server is running on port ${CONFIG.PORT}`);
      console.log(`📡 Base URL: http://localhost:${CONFIG.PORT}`);
      console.log(`🔒 RBAC & Security Middleware active`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start JBI CRM server:', error);
    process.exit(1);
  }
};

startServer();
