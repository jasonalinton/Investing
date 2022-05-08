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
import moment from 'moment';
import { createChart  } from "lightweight-charts";
import { toISODate, timezoneTimestamp, getDateInTimezone } from '../../service/utility'
// import { toISODate, timezoneTimestamp, getDateInTimezone, replaceItem } from '../../service/utility'
import gql from 'graphql-tag'

export default {
  name: "AssetChart",
  props: {
      asset: Object,
      trades: Array,
      type: String,
  },
  data: function () {
    return {
      initialized: false,
      config: {
        interval: '1h',
        periods: 300
      },

      bars: [],
      chart: {},
      series: {
        setMarkers() { }
      },
      markers: [],
      height: 500,
      data: {},
      intervals: [ '1m', '3m', '5m', '15m', '30m', 
                   '1h', '2h','4h', '6h', '8h', '12h',
                   '1d', '3d', '1w', '1M' ],
    };
  },
  apollo: {
    $subscribe: {
      highlow: {
        query: gql`subscription highLowAdded($symbol: String!, $interval: String, $periods: Int) {
          highLowAdded(symbol: $symbol, interval: $interval, periods: $periods) {
            bar {
              id
              datetime
              openTime
              open
              high
              low
              volume
              close
            }
            type
          }
        }`,
        variables() {
          return {
            symbol: this.asset.symbol,
            interval: this.config.interval,
            periods: this.config.periods
          }
        },
        result ({ data }) {
          let bar = data.highLowAdded.bar;

          let time = getDateInTimezone(new Date(bar.datetime));
          let marker = {
            id: bar.id,
            datetime: bar.datetime,
            time: Math.floor((time.getTime() / 1000) - 60)
          }

          let type = data.highLowAdded.type;
          if (type == "index") {
            marker.type = "index";
            marker.position = "aboveBar";
            marker.shape = "circle";
            marker.color = "blue";
          } else if (type == "high") {
            marker.type = "high";
            marker.position = "aboveBar";
            marker.shape = "arrowDown";
            marker.color = "green";
          } else if (type == "low") {
            marker.type = "low";
            marker.position = "belowBar";
            marker.shape = "arrowUp";
            marker.color = "red";
          } else if (type == "resistance") {
            marker.type = "resistance";
            marker.position = "aboveBar";
            marker.shape = "arrowDown";
            marker.color = "green";
          } else if (type == "support") {
            marker.type = "support";
            marker.position = "belowBar";
            marker.shape = "arrowUp";
            marker.color = "red";
          } else if (type == "impulsive") {
            marker.type = "impulsive";
            marker.position = "belowBar";
            marker.shape = "arrowUp";
            marker.color = "orange";
          }

          let index = this.markers.findIndex(marker => marker.type == "index");
          if (index != -1)
            this.markers.splice(index, 1);
          
          this.markers.push(marker);
          this.series.setMarkers(this.markers);
        },
        // result ({ data }) {
        //   // this.tags = data.tags;
        //   let bar = data.highLowAdded;
        //   let time = getDateInTimezone(new Date(bar.datetime));
        //     let marker = {
        //       id: bar.id,
        //       datetime: bar.datetime,
        //       time: Math.floor((time.getTime() / 1000) - 60),
        //       position: 'aboveBar',
        //       shape: 'arrowDown',
        //       color: 'green'
        //     }
        //     this.markers.push(marker);
        //     this.series.setMarkers(this.markers);
        // },
      },
    },
    // thirtyEightTwo: {
    //     query: gql`query thirtyEightTwo($symbol: String!, $interval: String, $periods: Int) {
    //       thirtyEightTwo(symbol: $symbol, interval: $interval, periods: $periods) {
    //         id
    //         datetime
    //         time
    //         direction
    //       }
    //     }`,
    //     variables() {
    //       return {
    //         symbol: this.asset.symbol,
    //         interval: this.config.interval,
    //         periods: this.config.periods
    //       }
    //     },
    //     update: function(data) {
    //       data.thirtyEightTwo.forEach(hammer => {
    //         let time = getDateInTimezone(new Date(hammer.datetime));
    //         let marker = {
    //           id: hammer.id,
    //           datetime: hammer.datetime,
    //           time: Math.floor((time.getTime() / 1000) - 60),
    //           position: 'aboveBar',
    //           shape: (hammer.direction == 'up') ? 'arrowUp' : 'arrowDown',
    //           color: (hammer.direction == 'up') ? 'green' : 'red'
    //         }
    //         this.markers.push(marker);
    //       })

    //       // this.markers = this.markers.concat(data.thirtyEightTwo);
    //       this.series.setMarkers(this.markers);
    //       return data.thirtyEightTwo;
    //     },
    //     fetchPolicy: 'network-only',
    // },
    // highsAndLows: {
    //     query: gql`query highsAndLows($symbol: String!, $interval: String, $periods: Int) {
    //       highsAndLows(symbol: $symbol, interval: $interval, periods: $periods) {
    //           highs {
    //             id
    //             datetime
    //           }
    //           lows {
    //             id
    //             datetime
    //           }
    //       }
    //     }`,
    //     variables() {
    //       return {
    //         symbol: this.asset.symbol,
    //         interval: this.config.interval,
    //         periods: this.config.periods
    //       }
    //     },
    //     update: function(data) {
    //       data.highsAndLows.highs.forEach(high => {
    //         let time = getDateInTimezone(new Date(high.datetime));
    //         let marker = {
    //           id: high.id,
    //           datetime: high.datetime,
    //           time: Math.floor((time.getTime() / 1000) - 60),
    //           position: 'aboveBar',
    //           shape: 'arrowDown',
    //           color: 'green'
    //         }
    //         this.markers.push(marker);
    //       });

    //       data.highsAndLows.lows.forEach(low => {
    //         let time = getDateInTimezone(new Date(low.datetime));
    //         let marker = {
    //           id: low.id,
    //           datetime: low.datetime,
    //           time: Math.floor((time.getTime() / 1000) - 60),
    //           position: 'belowBar',
    //           shape: 'arrowUp',
    //           color: 'red'
    //         }
    //         this.markers.push(marker);
    //       });

    //       // this.markers = this.markers.concat(data.thirtyEightTwo);
    //       this.series.setMarkers(this.markers);
    //       return data.thirtyEightTwo;
    //     },
    //     fetchPolicy: 'network-only',
    // },
    bars: {
        query: gql`query bars($symbol: String!, $interval: String, $periods: Int) {
          bars(symbol: $symbol, interval: $interval, periods: $periods) {
            id
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
          // this.getHighLows(this.asset.symbol, this.config.interval, this.config.periods);
          return data.bars;
        },
        fetchPolicy: 'network-only',
        // subscribeToMore: {
        //   document: gql`subscription highLowAdded($symbol: String!, $interval: String, $periods: Int) {
        //     highLowAdded(symbol: $symbol, interval: $interval, periods: $periods) {
        //       id
        //       openTime
        //       open
        //       high
        //       low
        //       volume
        //       close
        //     }
        //   }`,
        // variables() {
        //   return {
        //     symbol: this.asset.symbol,
        //     interval: this.config.interval,
        //     periods: this.config.periods
        //   }
        // },
        //   updateQuery: function(previousResult, { subscriptionData }) {

        //     let bar = subscriptionData.data.highLowAdded;
            
        //     let time = getDateInTimezone(new Date(bar.datetime));
        //     let marker = {
        //       id: bar.id,
        //       datetime: bar.datetime,
        //       time: Math.floor((time.getTime() / 1000) - 60),
        //       position: 'aboveBar',
        //       shape: 'arrowDown',
        //       color: 'green'
        //     }
        //     this.markers.push(marker);
        //   },
            
        // }
    }
  },
  created: async function () {
    window.addEventListener('resize', this.onResize);
    // await this.getAssetHistory();
  },
  watch: {
    trades: function(trades) {
      trades.forEach(trade => {
        let datetime = getDateInTimezone(trade.datetime);
        this.markers.push({
          id: `${trade.id}`,
          // time: timezoneTimestamp(trade.datetime),
          datetime: datetime,
          time: Math.floor((datetime.getTime() / 1000) - 60),
          position: (trade.type == 'buy') ? 'belowBar' : 'aboveBar',
          color: (trade.type == 'buy') ? 'green' : 'red',
          shape: (trade.type == 'buy') ? 'arrowUp' : 'arrowDown',
          // text: (trade.type == 'buy') ? `Bought ${trade.price_Subtotal}` : `Sold ${trade.price_Subtotal}`,
          text: (trade.type == 'buy') ? `Bought ${trade.price_Total}` : `Sold ${trade.price_Total}`,
        });
      });
      this.series.setMarkers(this.markers)
    }
  },
  methods: {
    initChart: initChart,
    createCandelstickChart,
    createAreaChart,
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
    getBarsInRange,
    getAssetHistory() {
        let _this = this;
        let datetime = moment(new Date()).add( -1000, 'hour').toDate();
        let barInterval = '1h';
        axios.get(`https://api.binance.us/api/v3/klines?symbol=${this.asset.symbol}USD&limit=${1000}&interval=${barInterval}&startTime=${datetime.getTime()}`)
            .then(res => {
                _this.bars = _this.createBars(res);
                _this.initChart(_this);
                return;
            })
    },
    createBars(res) {
        let bars = [];
        res.data.forEach(bar => {
            let bar_New = {
                time: new Date(bar[0]).toJSON(),
                value: Number(bar[1]),
                openTime: bar[0],
                open: Number(bar[1]),
                high: Number(bar[2]),
                low: Number(bar[3]),
                close: Number(bar[4]),
                volume: Number(bar[5]),
                closeTime: new Date(bar[6]).toJSON(),
                quoteAssetVolume: Number(bar[7]),
                numberOfTrades: Number(bar[8]),
                takerBuyBaseAssetVolume: Number(bar[9]),
                takerBuyQuoteAssetVolume: Number(bar[10])
            };
            bars.push(bar_New);
        });
        return bars;
    },
    getHighLows
  },
};


function initChart(self) {
    if (self.type == "candelstick") {
        self.createCandelstickChart(self);
    } else if (self.type == "area") {
        self.createAreaChart(self);
    }

    self.initialized = true;
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
    // priceFormat: {
    //   precision: 8,
    //   // formatter: price => '$' + price.toFixed(8),
    //   // formatter: price => '$' + price,
    // }
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
    // bar.time = bar.datetime.getTime() / 1000;
    bar.time = timezoneTimestamp(new Date(Number(bar.openTime)));
    if (self.asset.symbol == "SHIB" && !self.initialized) {
      bar.close = bar.close * 10000;
      bar.high = bar.high * 10000;
      bar.low = bar.low * 10000;
      bar.open = bar.open * 10000;
    }
    series.update(bar);
  });

  self.chart.timeScale().fitContent();
  self.series = series;

  // this.initInfiniteScroll();
}

function initInfiniteScroll() {
  let _this = this;
  let symbol = this.asset.symbol;
  let interval = this.config.interval;
  let periods = 100;

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
        if (barsInfo !== null && barsInfo.barsBefore < 10) {
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

              if (_this.asset.symbol == 'SHIB') {
                _bar.close = _bar.close * 10000;
                _bar.high = _bar.high * 10000;
                _bar.low = _bar.low * 10000;
                _bar.open = _bar.open * 10000;
              }
              });
              _this.bars = [ ...res.data.data.barsInRange, ..._this.bars];
              //_this.config.periods = _this.bars.length;
              _this.series.setData(_this.bars);
            });
        }
      }
      timer = null;
    }, 250);
  });
}

async function getBarsInRange(start, end, symbol, interval, periods) {
    var data = {
        query: `
        query {
          barsInRange(start: "${start.toJSON()}" end: "${end.toJSON()}" symbol: "${symbol}" interval: "${interval}" periods: ${periods}) {
            id
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

async function getHighLows(symbol, interval, periods) {
    var data = {
        query:`
        query {
          highsAndLows(symbol: "${symbol}", interval: "${interval}", periods: ${periods}) {
              highs {
                id
                datetime
              }
              lows {
                id
                datetime
              }
          }
        }`
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
