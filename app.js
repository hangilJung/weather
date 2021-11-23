const express = require("express");
const app = express();
const dotenv = require("dotenv");
const schedule = require("node-schedule");
const axios = require("axios");
const moment = require("moment");
const logger = require("./config/logger");

dotenv.config();

schedule.scheduleJob("17 46 * * * *", async () => {
  logger.info("shortTermLive access");

  const numOfRows = "10";
  const columnNames = [
    { key: "PTY" },
    { key: "REH" },
    { key: "RN1" },
    { key: "T1H" },
    { key: "UUU" },
    { key: "VEC" },
    { key: "VVV" },
    { key: "WSD" },
  ];

  let baseDate = moment().format("YYYYMMDD");
  let baseTime = moment().subtract(1, "h").format("HH");
  let apiServerPassData = {};

  if (moment().format("HH") === "00") {
    baseDate = moment().subtract(1, "days").format("YYYYMMDD");
  }

  try {
    const weatherOpenApiRequestDataResult = await axios.get(
      `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${process.env.SERVICEKEY}&numOfRows=${numOfRows}&pageNo=1&base_date=${baseDate}&base_time=${baseTime}00
      &nx=70&ny=70&dataType=JSON`
    );

    const getData = await weatherOpenApiRequestDataResult.data.response.body
      .items.item;

    for (let columnName of columnNames) {
      for (let row of getData) {
        if (row.category === columnName.key) {
          apiServerPassData[columnName.key.toLowerCase()] = row.obsrValue;
          break;
        }
      }
    }
    const apiServerPassDataResult = await axios.post(
      "http://localhost:3100/weather",
      {
        apiServerPassData,
      }
    );

    if (apiServerPassDataResult.data.header.resultCode === "00") {
      logger.info("shortTermLiveDatabaseOnSaveSuccess");
    }
  } catch (error) {
    logger.error("shortTermLive error message:", error);
  }
});

// 00 00 * * * *
schedule.scheduleJob("58 59 * * * * ", async () => {
  logger.info("shortTermForecast access");

  const numOfRows = "36";
  const columnNames = [
    { key: "TMP" },
    { key: "UUU" },
    { key: "VVV" },
    { key: "VEC" },
    { key: "WSD" },
    { key: "SKY" },
    { key: "PTY" },
    { key: "POP" },
    { key: "WAV" },
    { key: "PCP" },
    { key: "REH" },
    { key: "SNO" },
  ];
  let nowTime = moment().format("HH");
  let baseDate = moment().format("YYYYMMDD");
  let baseTime = "";
  let apiServerPassData = {};

  try {
    for (let time = 2; time < 25; time += 3) {
      if (Number(nowTime) > time && Number(nowTime) <= time + 3) {
        if (time > 9) {
          baseTime = String(time) + "00";
          break;
        } else {
          baseTime = "0" + String(time) + "00";
          break;
        }
      } else if (nowTime === "00" || nowTime === "01" || nowTime === "02") {
        baseDate = moment().subtract(1, "days").format("YYYYMMDD");
        baseTime = "2300";
        logger.info("baseTIme 2300 작동함.");
        break;
      }
    }

    const weatherOpenApiRequestDataResult = await axios.get(
      `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${process.env.SERVICEKEY}&numOfRows=${numOfRows}&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=70&ny=70&dataType=JSON`
    );

    const getData = await weatherOpenApiRequestDataResult.data.response.body
      .items.item;

    for (let columnName of columnNames) {
      for (let row of getData) {
        if (
          row.category === columnName.key &&
          row.fcstTime === nowTime + "00"
        ) {
          apiServerPassData[columnName.key.toLowerCase()] = row.fcstValue;
          break;
        }
      }
    }

    const apiServerPassDataResult = await axios.post(
      "http://localhost:3100/weather/short",
      {
        apiServerPassData,
      }
    );

    if (apiServerPassDataResult.data.header.resultCode === "00") {
      logger.info("shortTermForecastDatabaseOnSaveSuccess");
    }
  } catch (error) {
    logger.error("shortTermForecast error message:", error);
  }
});

// second, minute, hour, day of month, month, day of week
schedule.scheduleJob("11 0 2 * * *", async () => {
  logger.info("dailyMaxMinTemp access");

  const numOfRows = "158";
  const columnNames = [{ key: "TMN" }, { key: "TMX" }];

  let baseDate = moment().format("YYYYMMDD");
  let baseTime = "0200";
  let apiServerPassData = {};

  try {
    const weatherOpenApiRequestDataResult = await axios.get(
      `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${process.env.SERVICEKEY}&numOfRows=${numOfRows}&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=70&ny=70&dataType=JSON`
    );
    const getData = await weatherOpenApiRequestDataResult.data.response.body
      .items.item;

    for (let column of columnNames) {
      for (let row of getData) {
        if (row.category === column.key) {
          apiServerPassData[column.key.toLowerCase()] = row.fcstValue;
        }
      }
    }

    const apiServerPassDataResult = await axios.post(
      "http://localhost:3100/weather/daily/temp",
      {
        apiServerPassData,
      }
    );

    if (apiServerPassDataResult.data.header.resultCode === "00") {
      logger.info("dailyMaxMinTempDatabaseOnSaveSuccess");
    }
  } catch (error) {
    logger.error("dailyMaxMinTemp error message:", error);
  }
});

app.use((req, res, next) => {
  response.header.resultCode = "03";
  response.header.resultMsg = "HTTP_ERROR ";
  response.header.receiveMethodAndUrl = `${req.method} ${req.url}`;
  logger.error("method, url error message: ", error.message);
  res.status(404).json(response);
  next(error);
});

module.exports = app;
