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
const j = schedule.scheduleJob("17 46 * * * *", async () => {
  sleep(2000);
  logger.info("shortTermLive access");

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

    const getData = await result.data.response.body.items.item;

    getData.map((data) => {
      if (data.category === "PTY") {
        pty = data.obsrValue;
      }
      if (data.category === "REH") {
        reh = data.obsrValue;
      }
      if (data.category === "RN1") {
        rn1 = data.obsrValue;
      }
      if (data.category === "T1H") {
        t1h = data.obsrValue;
      }
      if (data.category === "UUU") {
        uuu = data.obsrValue;
      }
      if (data.category === "VEC") {
        vec = data.obsrValue;
      }
      if (data.category === "VVV") {
        vvv = data.obsrValue;
      }
      if (data.category === "WSD") {
        wsd = data.obsrValue;
      }
    });

    const dataResult = await axios.post("http://localhost:3200/weather", {
      pty,
      reh,
      rn1,
      t1h,
      uuu,
      vec,
      vvv,
      wsd,
    });

    console.log(dataResult.data.header);
  } catch (error) {
    logger.error("shortTermLive error message:", error);
  }
});

// 00 00 * * * *
const l = schedule.scheduleJob("00 00 * * * * ", async () => {
  sleep(2000);
  logger.info("shortTermForecast access");

  const numOfRows = "44";

  let nowTime = moment().format("HH");
  let baseDate = moment().format("YYYYMMDD");
  let baseTime = "";
  let tmp, uuu, vvv, vec, wsd, sky, pty, pop, wav, pcp, reh, sno;

  try {
    if (Number(nowTime) > 2 && Number(nowTime) <= 5) {
      baseTime = "0200";
    } else if (Number(nowTime) > 5 && Number(nowTime) <= 8) {
      baseTime = "0500";
    } else if (Number(nowTime) > 8 && Number(nowTime) <= 11) {
      baseTime = "0800";
    } else if (Number(nowTime) > 11 && Number(nowTime) <= 14) {
      baseTime = "1100";
    } else if (Number(nowTime) > 14 && Number(nowTime) <= 17) {
      baseTime = "1400";
    } else if (Number(nowTime) > 17 && Number(nowTime) <= 20) {
      baseTime = "1700";
    } else if (Number(nowTime) > 20 && Number(nowTime) <= 23) {
      baseTime = "2000";
    } else if (Number(nowTime) >= 0 && Number(nowTime) <= 2) {
      baseDate = moment().subtract(1, "days").format("YYYYMMDD");
      baseTime = "2300";
    }
    const result = await axios.get(
      `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${process.env.SERVICEKEY}&numOfRows=${numOfRows}&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=70&ny=70&dataType=JSON`
    );
    const resultData = await result.data.response.body.items.item;

    resultData.map((data) => {
      if (data.category === "TMP" && data.fcstTime === nowTime + "00") {
        tmp = data.fcstValue;
      }
      if (data.category === "UUU" && data.fcstTime === nowTime + "00") {
        uuu = data.fcstValue;
      }
      if (data.category === "VVV" && data.fcstTime === nowTime + "00") {
        vvv = data.fcstValue;
      }
      if (data.category === "VEC" && data.fcstTime === nowTime + "00") {
        vec = data.fcstValue;
      }
      if (data.category === "WSD" && data.fcstTime === nowTime + "00") {
        wsd = data.fcstValue;
      }
      if (data.category === "SKY" && data.fcstTime === nowTime + "00") {
        sky = data.fcstValue;
      }
      if (data.category === "PTY" && data.fcstTime === nowTime + "00") {
        pty = data.fcstValue;
      }
      if (data.category === "pop" && data.fcstTime === nowTime + "00") {
        pop = data.fcstValue;
      }
      if (data.category === "WAV" && data.fcstTime === nowTime + "00") {
        wav = data.fcstValue;
      }
      if (data.category === "PCP" && data.fcstTime === nowTime + "00") {
        pcp = data.fcstValue;
      }
      if (data.category === "REH" && data.fcstTime === nowTime + "00") {
        reh = data.fcstValue;
      }
      if (data.category === "SNO" && data.fcstTime === nowTime + "00") {
        sno = data.fcstValue;
      }
    });

    const dataResult = await axios.post("http://localhost:3200/weather", {
      tmp,
      uuu,
      vvv,
      vec,
      wsd,
      sky,
      pty,
      pop,
      wav,
      pcp,
      reh,
      sno,
    });
    console.log(dataResult.data.header);
  } catch (error) {
    logger.error("shortTermForecast error message:", error);
  }
});

// second, minute, hour, day of month, month, day of week
const maxAndMin = schedule.scheduleJob(" 11 0 2 * * ", async () => {
  logger.info("test access");

  const numOfRows = "158";

  let baseDate = moment().format("YYYYMMDD");
  let baseTime = "0200";
  let tmn, tmx;

  try {
    const getTemp = await axios.get(
      `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${process.env.SERVICEKEY}&numOfRows=${numOfRows}&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=70&ny=70&dataType=JSON`
    );
    const itemData = await getTemp.data.response.body.items.item;

    itemData.map((data) => {
      if (data.category === "TMN" && data.fcstTime === "0600") {
        tmn = data.fcstValue;
      }
      if (data.category === "TMX" && data.fcstTime === "1500") {
        tmx = data.fcstValue;
      }
    });
    console.log("tmn값은?" + tmn);
    console.log("tmx값은?" + tmx);

    const result = await axios.post(
      "http://localhost:3200/weather/daily/temp",
      {
        tmn,
        tmx,
      }
    );

    console.log(result.data.header);
  } catch (error) {
    logger.error("test error message:", error);
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
