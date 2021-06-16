<template>
  <div class="row g-0">
    <div class="col">
      <!-- Toolbar -->
      <div class="row g-0">
        <div class="col">
          <!-- Interval Buttons -->
          <div class="btn-group" role="group" aria-label="Timeframes">
            <button v-for="(interval, index) in intervals" :key="index" @click="refreshChart(asset.symbol, interval)" type="button" class="btn btn-outline-primary">{{ interval }}</button>
          </div>
        </div>
      </div>
      <div class="row g-0">
        <div class="col">
          <div id="lightweight-chart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import $ from "jquery";
import { createChart  } from "lightweight-charts";
import { toISODate, getDateInTimezone } from '../../service/utility'

export default {
  name: "AssetChart",
    props: {
        asset: Object,
        type: String,
    },
  data: function () {
    return {
      chart: {},
      height: 500,
      data: {},
      intervals: [ '1m', '3m', '5m', '15m', '30m', '1h', '2h','4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M' ]
    };
  },
  created: function () {
      let self = this;
      this.getBars(this.asset.symbol)
        .then(res => {
            self.data = res.data.data.getAssetCandles;
        })
        .then(() => { self.initChart(self) })
    ;

    window.addEventListener('resize', this.onResize);
  },
  methods: {
    initChart: initChart,
    createCandelstickChart: createCandelstickChart,
    createAreaChart: createAreaChart,
    getBars: async (symbol, interval) => {
        interval = interval ?? '1h';
        var data = {
            query: `
            mutation {
                getAssetCandles(symbol: "${symbol}", interval: "${interval}", periods: 180) {
                    openTime
                    open
                    high
                    low
                    volume
                    close
                }
            }
            `
        }
        return axios.post('http://localhost:4000/graphql', data);
    },
    onResize() {
        this.chart.resize(this.width(), this.height);
    },
    width: function () {
      return $(window).width() - 20;
    },
    toISODate,
    refreshChart: function(symbol, interval) {
      let self = this;
      self.getBars(self.asset.symbol, interval)
        .then(res => {
            self.data = res.data.data.getAssetCandles;
        })
        .then(() => { self.initChart(self) })
    ;

    }
  },
};

function initChart(self) {
    if (self.type == "candelstick") {
        self.createCandelstickChart(self);
    } else if (self.type == "area") {
        self.createAreaChart(self);
    }
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
      fitContent: true
    }
  });

  self.data.forEach(bar => {
    let date1 = new Date(Number(bar.openTime));
    let date2 = getDateInTimezone(date1);
    let time = date2.getTime() / 1000;
    //console.log(date2);
    //let time = Number(bar.openTime) / 1000;
    //let time = toISODate(new Date(Number(bar.openTime)));
    series.update({ time, open: bar.open, high: bar.high, low: bar.low, close: bar.close });
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
