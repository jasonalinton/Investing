<template>
  <div class="row g-0">
    <div class="col">
      <!-- Toolbar -->
      <div class="row g-0">
        <div class="col">
          <div class="d-flex flex-row align-items-center flex-wrap">
            <!-- Interval Buttons -->
            <div class="btn-group" role="group" aria-label="Timeframes">
              <button v-for="(interval, index) in intervals" :key="index" @click.exact="intervalClicked(interval)" @click.ctrl="intervalCtrClicked(interval)" type="button" :class="{ active: config.interval == interval }" class="btn btn-sm btn-outline-primary">{{ interval }}</button>
            </div>
            <!-- End - Interval Buttons -->
            <input class="periods" type="number" v-model.number.lazy="config.periods" min="1" size="5"/>
            <button class="now btn btn-sm btn-secondary" type="button" @click="scrollToRealTime">Now</button>
            <button class="fit btn btn-sm btn-secondary" type="button" @click="fitContent">Fit</button>
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
import axios from 'axios';
import date from 'date-and-time';
import { createChart  } from "lightweight-charts";
import { toISODate, getDateInTimezone, timezoneTimestamp, replaceItem } from '../../service/utility'
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
        interval: '1m',
        periods: 60
      },
      bars: [],
      chart: {},
      series: [],
      height: 500,
      data: {},
      intervals: [ '1m', '3m', '5m', '15m', '30m', 
                   '1h', '2h','4h', '6h', '8h', '12h',
                   '1d', '3d', '1w', '1M' ],
    };
  },
  apollo: {
    bars: {
        query: gql`query bars($symbol: String!, $interval: String, $periods: Int) {
          bars(symbol: $symbol, interval: $interval, periods: $periods) {
            openTime
            open
            high
            low
            volume
            close
          }
        }`,
        variables() {
          return {
            symbol: this.asset.symbol,
            interval: this.config.interval,
            periods: this.config.periods
          }
        },
        update: function(data) {
          this.bars = data.bars;
          this.initChart(this);
          return data.bars;
        },
        fetchPolicy: 'network-only',
        subscribeToMore: {
          document: gql`subscription barAdded($symbol: String!, $interval: String!) {
            barAdded(symbol: $symbol, interval: $interval) {
              openTime
              open
              high
              low
              volume
              close
            }
          }`,
          variables() {
            return {
              symbol: this.asset.symbol,
              interval: this.config.interval
            }
          },
          updateQuery: function(previousResult, { subscriptionData }) {
            // returns bars info in current visible range
            const barsInfo = this.series.barsInLogicalRange(this.chart.timeScale().getVisibleLogicalRange());
            console.log(barsInfo);

            barsInfo.fromDate = getDateInTimezone(new Date(Number(barsInfo.from)));
            barsInfo.toDate = getDateInTimezone(new Date(Number(barsInfo.to)));

            let bar = subscriptionData.data.barAdded;

            bar.datetime = new Date(Number(bar.openTime));
            bar.time = timezoneTimestamp(new Date(Number(bar.openTime)));

            let exists = replaceItem(bar, this.bars, "openTime");
            if (!exists) this.bars.push(bar);

            this.series.update(bar);
          },
            
        }
    }
  },
  created: function () {
    window.addEventListener('resize', this.onResize);
  },
  methods: {
    initChart: initChart,
    createCandelstickChart: createCandelstickChart,
    createAreaChart: createAreaChart,
    intervalClicked(interval) {
      this.config.interval = interval
    },
    scrollToRealTime() {
      this.chart.timeScale().scrollToRealTime();
    },
    fitContent() {
      this.chart.timeScale().fitContent();
    },
    onResize() {
        this.chart.resize(this.width(), this.height);
    },
    width: function () {
      return $(window).width() - 20;
    },
    toISODate,
    initInfiniteScroll,
    getBarsInRange
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
    grid: {
        vertLines: {
            color: 'rgb(15, 15, 15)',
            style: 4,
            visible: true,
        },
        horzLines: {
            color: 'rgb(15, 15, 15)',
            style: 4,
            visible: true,
        },
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
      // fixLeftEdge: true,
      timeVisible: true,
      fitContent: true
    }
  });

  self.bars.forEach(bar => {
    bar.datetime = new Date(Number(bar.openTime));
    bar.time = timezoneTimestamp(new Date(Number(bar.openTime)));
    series.update(bar);
  });

  self.chart.timeScale().fitContent();
  self.series = series;

  this.initInfiniteScroll();
}

function initInfiniteScroll() {
  let _this = this;
  let symbol = this.asset.symbol;
  let interval = this.config.interval;
  let periods = this.config.periods;

  let timeScale = this.chart.timeScale();
  let timer = null;
  timeScale.subscribeVisibleLogicalRangeChange(() => {
    if (timer !== null) {
      return;
    }
    timer = setTimeout(() => {
      var logicalRange = timeScale.getVisibleLogicalRange();
      if (logicalRange !== null) {
        var barsInfo = _this.series.barsInLogicalRange(logicalRange);
        if (barsInfo !== null && barsInfo.barsBefore < 50) {
          let start
          let end = _this.bars[0].datetime;

          let timeframeNum = interval.slice(0, -1);
          let timeframeUnit = interval.slice(-1);

          if (timeframeUnit == 'm') {
            start = date.addMinutes(end, -(periods * timeframeNum));
          } else if (timeframeUnit == 'h') {
            start = date.addHours(end, -(periods * timeframeNum));
          } else if (timeframeUnit == 'd') {
            start = date.addDays(end, -(periods * timeframeNum));
          } else if (timeframeUnit == 'w') {
            start = date.addDays(end, -(periods * timeframeNum * 7));
          } else if (timeframeUnit == 'M') {
            start = date.addMonths(end, -(periods * timeframeNum * 30));
          }
          end = date.addSeconds(end, -1);

          _this.getBarsInRange(start, end, symbol, interval, periods)
            .then(res => {
              res.data.data.barsInRange.forEach(_bar => {
                _bar.datetime = new Date(_bar.datetime)
                _bar.time = timezoneTimestamp(new Date(Number(_bar.openTime)));
              });
              _this.bars = [ ...res.data.data.barsInRange, ..._this.bars];
              _this.series.setData(_this.bars);
            });
        }
      }
      timer = null;
    }, 50);
  });
}

async function getBarsInRange(start, end, symbol, interval, periods) {
    var data = {
        query: `
        query {
          barsInRange(start: "${start.toJSON()}" end: "${end.toJSON()}" symbol: "${symbol}" interval: "${interval}" periods: ${periods}) {
            datetime
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
input.periods {
  width: 70px;
}

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
