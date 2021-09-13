const express = require("express");
const app = express();
const dotenv = require("dotenv");
const morgan = require("morgan");
const schedule = require("node-schedule");
const axios = require("axios");
const moment = require("moment");
const logger = require("./config/logger");

let response = {
  header: {},
};
dotenv.config();

app.use(express.json());
app.use(morgan("dev"));

function sleep(ms) {
  const wakeUpTime = Date.now() + ms;
  while (Date.now() < wakeUpTime) {}
}

// second, minute, hour, day of month, month, day of week
const j = schedule.scheduleJob("17 46 * * * *", async (req, res) => {
  sleep(2000);
  logger.info("weather access");

  const numOfRows = "10";

  let baseDate = moment().format("YYYYMMDD");
  let baseTime = moment().subtract(1, "h").format("HH");

  if (moment().format("HH") === "00") {
    baseDate = moment().subtract(1, "days").format("YYYYMMDD");
  }

  try {
    const result = await axios.get(
      `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${process.env.SERVICEKEY}&numOfRows=${numOfRows}&pageNo=1&base_date=${baseDate}&base_time=${baseTime}00
      &nx=70&ny=70&dataType=JSON`
    );
    const data = await result.data.response.body.items.item;

    const dataResult = await axios.post("http://localhost:3200/weather", {
      data,
    });
  } catch (error) {
    logger.error("weather error message:", error);
  }
});

const k = schedule.scheduleJob("11 0 2 * * * ", async (req, res) => {
  sleep(2000);
  logger.info("daily_max_min_temp access");

  const numOfRows = "264";

  let baseDate = moment().format("YYYYMMDD");
  let baseTime = "0200";

  try {
    const getTemp = await axios.get(
      `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${process.env.SERVICEKEY}&numOfRows=${numOfRows}&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=70&ny=70&dataType=JSON`
    );
    const tmn = await getTemp.data.response.body.items.item[44].fcstValue;
    const tmx = await getTemp.data.response.body.items.item[144].fcstValue;

    const setData = await axios.post(
      "http://localhost:3200/weather/daily/temp",
      {
        tmn,
        tmx,
      }
    );
    return;
  } catch (error) {
    logger.error("daily_max_min_temp error message:", error);
  }
});

const l = schedule.scheduleJob("00 00 * * * * ", async (req, res) => {
  logger.info("shortTermForecast access");

  const numOfRows = "44";

  let nowTime = moment().format("HH");
  let baseDate = moment().format("YYYYMMDD");
  let baseTime = "";
  let i = 0;
  let tmp, uuu, vvv, vec, wsd, sky, pty, pop, pcp, reh, sno, data;

  try {
    if (Number(nowTime) > 2 && Number(nowTime) <= 5) {
      baseTime = "0200";
      i = nowTime - 3;
    } else if (Number(nowTime) > 5 && Number(nowTime) <= 8) {
      baseTime = "0500";
      i = nowTime - 6;
    } else if (Number(nowTime) > 8 && Number(nowTime) <= 11) {
      baseTime = "0800";
      i = nowTime - 9;
    } else if (Number(nowTime) > 11 && Number(nowTime) <= 14) {
      baseTime = "1100";
      i = nowTime - 12;
    } else if (Number(nowTime) > 14 && Number(nowTime) <= 17) {
      baseTime = "1400";
      i = nowTime - 15;
    } else if (Number(nowTime) > 17 && Number(nowTime) <= 20) {
      baseTime = "1700";
      i = nowTime - 18;
    } else if (Number(nowTime) > 20 && Number(nowTime) <= 23) {
      baseTime = "2000";
      i = nowTime - 21;
    } else if (Number(nowTime) > 23) {
      baseTime = "2300";
      i = 0;
    } else if (Number(nowTime) > 0 && Number(nowTime) <= 2) {
      baseDate = moment().subtract(1, "days").format("YYYYMMDD");
      baseTime = "2300";
      i = nowTime - 1;
    }

    const result = await axios.get(
      `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${process.env.SERVICEKEY}&numOfRows=${numOfRows}&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=70&ny=70&dataType=JSON`
    );
    const resultData = await result.data.response.body.items;

    function getShortTermForecast(num) {
      tmp = resultData.item[num].fcstValue;
      uuu = resultData.item[num + 1].fcstValue;
      vvv = resultData.item[num + 2].fcstValue;
      vec = resultData.item[num + 3].fcstValue;
      wsd = resultData.item[num + 4].fcstValue;
      sky = resultData.item[num + 5].fcstValue;
      pty = resultData.item[num + 6].fcstValue;
      pop = resultData.item[num + 7].fcstValue;
      pcp = resultData.item[num + 8].fcstValue;
      reh = resultData.item[num + 9].fcstValue;
      sno = resultData.item[num + 10].fcstValue;

      return {
        tmp,
        uuu,
        vvv,
        vec,
        wsd,
        sky,
        pty,
        pop,
        pcp,
        reh,
        sno,
      };
    }
    if (i === 0) {
      data = getShortTermForecast(0);
    } else if (i === 1) {
      data = getShortTermForecast(11);
    } else if (i === 2) {
      data = getShortTermForecast(22);
    }

    const setData = await axios.post(
      "http://localhost:3200/weather/short",
      data
    );
  } catch (error) {
    logger.error("short error message:", error);
  }
});

app.use((req, res, next) => {
  response.header.resultCode = "03";
  response.header.resultMsg = "HTTP_ERROR ";
  response.header.receiveMethodAndUrl = `${req.method} ${req.url}`;
  logger.info("method, url error");
  logger.error(error.message);
  res.status(404).json(response);
  next(error);
});

module.exports = app;
