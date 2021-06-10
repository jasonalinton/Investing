<template>
  <div class="row g-0">
    <div class="col">
      <div class="row g-0">
        <div class="col">
          <div id="minute-chart"></div>
          <div id="hour-chart"></div>
          <div id="day-chart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import $ from "jquery";
import { createChart  } from "lightweight-charts";
import { toISODate } from '../../service/utility'

export default {
  name: "SplitTimeframeChart",
    props: {
        asset: Object,
        type: String,
    },
  data: function () {
    return {
      minuteChart: {},
      hourChart: {},
      dayChart: {},
      height: 300,
      minuteData: {},
      hourData: {},
      dayData: {},
      intervals: [ '1m', '3m', '5m', '15m', '30m', '1h', '2h','4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M' ]
    };
  },
  created: function () {
    this.initChart(this, this.minuteChart, "minute-chart", this.minuteData, '1m');
    this.initChart(this, this.hourChart, "hour-chart", this.hourData, '1h');
    this.initChart(this, this.dayChart, "day-chart", this.dayData, '1d');

    window.addEventListener('resize', this.onResize);
  },
  methods: {
    initChart: (self, chart, chartID, data, interval) => {
        self.getBars(self.asset.symbol, interval)
            .then(res => {
                data = res.data.data.getAssetCandles;
            })
            .then(() => { 
                if (self.type == "candelstick") {
                    self.createCandelstickChart(self, chart, chartID, data, interval);
                } else if (self.type == "area") {
                    self.createAreaChart(self, chart, chartID, data);
                }
                
            });
    },
    createCandelstickChart: createCandelstickChart,
    createAreaChart: createAreaChart,
    getBars: async (symbol, interval) => {
        interval = interval ?? '1h';
        var data = {
            query: `
            mutation {
                getAssetCandles(symbol: "${symbol}", interval: "${interval}", periods: 360) {
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
  },
};

function createCandelstickChart(self, chart, chartID, data, interval) {
  $("#lightweight-chart").empty();

  chart = createChart(chartID, { 
    width: self.width(), 
    height: self.height,
    layout: {
      backgroundColor: '#1D1D1D',
      textColor: '#d1d4dc',
    },
    grid: {
        vertLines: {
            color: 'rgba(70, 130, 180, 0.5)',
        },
        horzLines: {
            visible: false
        },
    },
  });

  const series = chart.addCandlestickSeries({
    upColor: '#35b522',
    downColor: '#ff0f23',
    borderDownColor: '#ff0f23',
    borderUpColor: '#35b522',
    wickDownColor: '#ff0f23',
    wickUpColor: '#35b522',
  });

  chart.applyOptions({
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

  data.forEach(bar => {
    let time = (interval == '1d') ? toISODate(new Date(Number(bar.openTime))) : Number(bar.openTime) / 1000;
    series.update({ time, open: bar.open, high: bar.high, low: bar.low, close: bar.close });
  });

  chart.timeScale().fitContent();
}

function createAreaChart(self, chart, chartID, data) {
  $("#lightweight-chart").empty();
  
    chart = createChart(chartID, { 
      width: self.width(), 
      height: self.height,
      layout: {
        backgroundColor: '#1D1D1D',
        textColor: '#d1d4dc',
      },
       });
    const series = chart.addAreaSeries();
    chart.applyOptions({
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

    data.forEach(kline => {
        let utcTimestamp = Number(kline.closeTime) / 1000;
        series.update({ time: utcTimestamp, value: kline.close });
    });

    chart.timeScale().fitContent();
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
