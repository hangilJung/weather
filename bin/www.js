const app = require("../app");
const logger = require("../config/logger");
const PORT = process.env.PORT || 3600;

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`WEB서버 가동 ${PORT}`);
});
