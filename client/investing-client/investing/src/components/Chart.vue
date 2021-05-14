<template>
  <div id="lightweight-chart"></div>
</template>

<script>
import $ from "jquery";
import axios from "axios";
import { createChart, CrosshairMode } from "lightweight-charts";

export default {
  name: "Chart",
  data: function () {
    return {
      bnbHistory: {
        payloadSize: 10,
        bnbKlines: [],
        bnbKlines_Saved: [],
        saveCount: 0,
      },
    };
  },
  created: function () {
    let self = this;
    this.initChart(self);
  },
  methods: {
    initChart: initChart,
    getKlines: getKlines,
    createLightweightChart: createLightweightChart,
  },
};

function initChart(self) {
  this.getKlines().then(
    (res) => {
      var klines = res.data.data.assetValues;

      klines.map((kline) => {
        kline.time = (new Date(Number(kline.openTime))).toJSON();
      });
      self.bnbHistory.bnbKlines = klines;

      self.createLightweightChart(self);
    },
    (error) => {
      console.log(error);
    }
  );
}

async function getKlines() {
  var data = {
    query: `
        query {
            assetValues {
                id
                symbol
                openTime
                open
                high
                low
                close
                volume
                closeTime
            }
        }
        `,
  };
  return axios.post("http://localhost:4000/graphql", data);
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

  var candleSeries = chart.addCandlestickSeries({
    upColor: "rgba(255, 144, 0, 1)",
    downColor: "#000",
    borderDownColor: "rgba(255, 144, 0, 1)",
    borderUpColor: "rgba(255, 144, 0, 1)",
    wickDownColor: "rgba(255, 144, 0, 1)",
    wickUpColor: "rgba(255, 144, 0, 1)",
  });

  for (var i = 0; i < self.bnbHistory.bnbKlines.length; i++) {
    candleSeries.update(self.bnbHistory.bnbKlines[i]);
  }
}
</script>

<style>

</style>
