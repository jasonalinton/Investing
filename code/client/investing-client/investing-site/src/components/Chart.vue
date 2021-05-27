<template>
  <div id="lightweight-chart"></div>
</template>

<script>
import $ from "jquery";
import axios from "axios";
import { createChart, CrosshairMode } from "lightweight-charts";
import date from 'date-and-time';

export default {
  name: "Chart",
  data: function () {
    return {
      klines: [],
    };
  },
  created: function () {
    initChart(this);
    this.intervalID = setInterval(initChart, 10000, this);
  },
  methods: {
    initChart: initChart,
    createLightweightChart: createLightweightChart,
  },
};

function initChart(self) {
  var startDatetime = date.addDays(new Date(), -2);

  getBogeKlines(startDatetime, null)
      .then(res => {
          self.klines = res.data.data.getAssetValueRange;
          createLightweightChart(self);
          // self.showChart = true;
      });
}

async function getBogeKlines(startDatetime, endDatetime) {
    startDatetime = (startDatetime) ? `"${startDatetime.toJSON()}"` : `null`;
    endDatetime = (endDatetime) ? `"${endDatetime.toJSON()}"` : `null`;

    var data = {
        query: `
        mutation {
            getAssetValueRange(
                symbol: "BOGE"
                startDatetime: ${startDatetime}
                endDatetime: ${endDatetime}
            ) {
                symbol
                interval
                openTime
                open
                high
                low
                close
                volume
                closeTime
                numberOfTrades
            }
        }
        `
    }
    return axios.post('http://localhost:4000/graphql', data);
}

function createLightweightChart(self) {
  $("#lightweight-chart").empty();

  var chart = createChart("lightweight-chart", {
    height: 400,
    layout: {
      backgroundColor: "#000000",
      textColor: "rgba(255, 255, 255, 0.9)",
    },
    grid: {
      vertLines: {
        color: "rgba(197, 203, 206, 0.5)",
      },
      horzLines: {
        color: "rgba(197, 203, 206, 0.5)",
      },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
    },
    rightPriceScale: {
      borderColor: "rgba(197, 203, 206, 0.8)",
    },
    timeScale: {
      borderColor: "rgba(197, 203, 206, 0.8)",
    },
  });

  var series = chart.addCandlestickSeries({
    upColor: "rgba(255, 144, 0, 1)",
    downColor: "#000",
    borderDownColor: "rgba(255, 144, 0, 1)",
    borderUpColor: "rgba(255, 144, 0, 1)",
    wickDownColor: "rgba(255, 144, 0, 1)",
    wickUpColor: "rgba(255, 144, 0, 1)",
  });

  self.klines.forEach(kline => {
    let utcTimestamp = Number(kline.closeTime) / 1000;
    series.update({ time: utcTimestamp, open: kline.open, high: kline.high, low: kline.low, close: kline.close });
  });

  self.chart.chart.timeScale().fitContent();
}
</script>

<style>

</style>
