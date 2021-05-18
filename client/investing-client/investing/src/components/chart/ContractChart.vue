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
      chart: {
        chart: {},
        width: $(window).width() - 20,
        height: 500
      }
    };
  },
  created: function () {
    initChart(this);
    this.intervalID = setInterval(initChart, 10000, this);
    window.addEventListener('resize', this.onResize);
  },
  methods: {
    initChart: initChart,
    createCandelstickChart: createCandelstickChart,
    createAreaChart: createAreaChart,
    onResize() {
        this.chart.chart.resize(this.chart.width, this.chart.height);
    },
  },
};

function initChart(self) {
    var startDatetime = date.addDays(new Date(), -10);

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

  self.chart.chart = createChart("lightweight-chart", { 
    width: self.chart.width, 
    height: self.chart.height,
    layout: {
      backgroundColor: '#1D1D1D',
      textColor: '#d1d4dc',
    },
  });

  const series = self.chart.chart.addCandlestickSeries({
    upColor: '#35b522',
    downColor: '#ff0f23',
    borderDownColor: '#ff0f23',
    borderUpColor: '#35b522',
    wickDownColor: '#ff0f23',
    wickUpColor: '#35b522',
  });

  self.chart.chart.applyOptions({
    priceScale:{
      autoScale: true,
      position: 'right',
    },
    timeScale: {
      fixLeftEdge: true,
      timeVisible: true
    }
  });

  self.klines.forEach(kline => {
    let utcTimestamp = Number(kline.closeTime) / 1000;
    series.update({ time: utcTimestamp, open: kline.open, high: kline.high, low: kline.low, close: kline.close });
  });

  self.chart.chart.timeScale().fitContent();
}

function createAreaChart(self) {
  $("#lightweight-chart").empty();
  
    self.chart.chart = createChart("lightweight-chart", { 
      width: self.chart.width, 
      height: self.chart.height,
      layout: {
        backgroundColor: '#1D1D1D',
        textColor: '#d1d4dc',
      },
       });
    const series = self.chart.chart.addAreaSeries();
    self.chart.chart.applyOptions({
      priceScale:{
        autoScale: true,
        position: 'right',
      },
      timeScale: {
        fixLeftEdge: true,
        timeVisible: true
      }
    });

    self.klines.forEach(kline => {
        let utcTimestamp = Number(kline.closeTime) / 1000;
        series.update({ time: utcTimestamp, value: kline.close });
    });

    self.chart.chart.timeScale().fitContent();
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
