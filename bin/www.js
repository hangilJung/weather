const app = require("../app");
const PORT = process.env.PORT || 3600;
const logger = require("../config/logger");

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`WEATHER 서버 가동 ${PORT}`);
});
