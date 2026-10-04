require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  const server = app.listen(PORT, () =>
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
  );
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err.message);
    server.close(() => process.exit(1));
  });
})();
