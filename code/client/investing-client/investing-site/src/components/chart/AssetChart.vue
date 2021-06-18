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
import $ from "jquery";
import { createChart  } from "lightweight-charts";
import { toISODate, getDateInTimezone } from '../../service/utility'
import gql from 'graphql-tag'

export default {
  name: "AssetChart",
  props: {
      asset: Object,
      type: String,
  },
  data: function () {
    return {
      config: {
        interval: '4h',
        periods: 220
      },
      chart: {},
      height: 500,
      data: {},
      intervals: [ '1m', '3m', '5m', '15m', '30m', 
                   '1h', '2h','4h', '6h', '8h', '12h',
                   '1d', '3d', '1w', '1M' ],
    };
  },
  created: function () {
    this.bars(this.asset.symbol, this.config.intervals, this.config.periods);
    
    window.addEventListener('resize', this.onResize);
  },
  methods: {
    initChart: initChart,
    createCandelstickChart: createCandelstickChart,
    createAreaChart: createAreaChart,
    bars(symbol, interval, periods) {
      let self = this;
      this.$apollo.mutate({
        mutation: gql`mutation ($symbol: String!, $interval: String, $periods: Int) {
            bars(symbol: $symbol, interval: $interval, periods: $periods) {
                openTime
                open
                high
                low
                volume
                close
            }
        }`,
        variables: { symbol, interval, periods },
        update: (cache, { data: { bars }}) => {
          self.bars = bars;
          self.initChart(self);
        }
      })
    },
    refreshChart() {
      this.bars(this.asset.symbol, this.intervals, this.periods);
    },
    onResize() {
        this.chart.resize(this.width(), this.height);
    },
    width: function () {
      return $(window).width() - 20;
    },
    toISODate,
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

  self.bars.forEach(bar => {
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
