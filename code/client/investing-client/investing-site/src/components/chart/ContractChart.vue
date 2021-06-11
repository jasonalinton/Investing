<template>
  <div id="lightweight-chart"></div>
</template>

<script>
import $ from "jquery";
import axios from "axios";
import { createChart  } from "lightweight-charts";
import date from 'date-and-time';

export default {
  name: "ContractChart",
    props: {
        type: String
    },
  data: function () {
    return {
      chart: {},
      klines: [],
      height: 500,
    };
  },
  created: function () {
    initChart(this);
    this.intervalID = setInterval(initChart, 60000, this);
    window.addEventListener('resize', this.onResize);
  },
  methods: {
    initChart: initChart,
    createCandelstickChart: createCandelstickChart,
    createAreaChart: createAreaChart,
    onResize() {
        this.chart.resize(this.width(), this.height);
    },
    width: function () {
      return $(window).width() - 20;
    },
  },
};

function initChart(self) {
    var startDatetime = date.addDays(new Date(), -2);
    // let startDatetime = new Date(2021, 3, 18, 16, 30, 0);

    getBogeKlines(startDatetime, null)
        .then(res => {
            self.klines = res.data.data.getAssetValueRange;

            if (self.type == "candelstick") {
                self.createCandelstickChart(self);
            }
            else if (self.type == "area") {
                self.createAreaChart(self);
            }
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

function createCandelstickChart(self) {
  $("#lightweight-chart").empty();

  self.chart = createChart("lightweight-chart", { 
    width: self.width(), 
    height: self.height,
    layout: {
      backgroundColor: '#1D1D1D',
      textColor: '#d1d4dc',
    },
  });

  const series = self.chart.addCandlestickSeries({
    upColor: '#35b522',
    downColor: '#ff0f23',
    borderDownColor: '#ff0f23',
    borderUpColor: '#35b522',
    wickDownColor: '#ff0f23',
    wickUpColor: '#35b522',
  });

  self.chart.applyOptions({
    priceScale:{
      autoScale: true,
      position: 'right',
    },
    timeScale: {
      fixLeftEdge: true,
      timeVisible: true,
      // fitContent: true
    }
  });

  self.klines.forEach(kline => {
    let utcTimestamp = Number(kline.closeTime) / 1000;
    series.update({ time: utcTimestamp, open: kline.open, high: kline.high, low: kline.low, close: kline.close });
  });

  self.chart.timeScale().fitContent();
}

function createAreaChart(self) {
  $("#lightweight-chart").empty();
  
    self.chart = createChart("lightweight-chart", { 
      width: self.width(), 
      height: self.height,
      layout: {
        backgroundColor: '#1D1D1D',
        textColor: '#d1d4dc',
      },
       });
    const series = self.chart.addAreaSeries();
    self.chart.applyOptions({
      priceScale:{
        autoScale: true,
        position: 'right',
      },
      timeScale: {
        fixLeftEdge: true,
        timeVisible: true,
        // fitContent: true
      }
    });

    self.klines.forEach(kline => {
        let utcTimestamp = Number(kline.closeTime) / 1000;
        series.update({ time: utcTimestamp, value: kline.close });
    });

    self.chart.timeScale().fitContent();
}
</script>

<style>
.legend {
	position: absolute;
	left: 12px;
	top: 12px;
	z-index: 1;
	font-size: 12px;
	line-height: 18px;
	font-weight: 300;
}
</style>
