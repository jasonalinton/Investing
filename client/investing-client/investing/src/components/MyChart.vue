<template>
  <div id="lightweight-chart"></div>
</template>

<script>
import $ from "jquery";
import { createChart  } from "lightweight-charts";

export default {
  name: "MyChart",
    props: {
        bnbKlines: Array,
    },
  data: function () {
    return {
      bnbHistory: {
        payloadSize: 10,
        bnbKlines: [],
        bnbKlines_Saved: [],
        saveCount: 0,
      },
      chart: {
        chart: {},
        width: $(window).width() - 20,
        height: 500
      }
    };
  },
  mounted: function () {
    let self = this;
    this.initChart(self);
    window.addEventListener('resize', this.onResize);
  },
  methods: {
    initChart: initChart,
    createLightweightChart: createLightweightChart,
    onResize() {
        this.chart.chart.resize(this.chart.width, this.chart.height);
    },
  },
};

function initChart(self) {
  self.createLightweightChart(self);
}

function createLightweightChart(self) {
  $("#lightweight-chart").empty();

//   for (var i = 0; i < self.bnbHistory.bnbKlines.length; i++) {
//     areaSeries.update({ time: self.bnbKlines[i].date, value: self.bnbKlines[i].valueInBNB});
//   }

//   for (var i = 0; i < self.bnbKlines.length; i++) {
//     candleSeries.update({ time: self.bnbKlines[i].date, open: self.bnbKlines[i].valueInBNB, 
//                                                     high: self.bnbKlines[i].valueInBNB, 
//                                                     low: self.bnbKlines[i].valueInBNB, 
//                                                     close: self.bnbKlines[i].valueInBNB });
//   }

    self.chart.chart = createChart("lightweight-chart", { 
      width: self.chart.width, 
      height: self.chart.height,
      layout: {
        backgroundColor: '#1D1D1D',
        textColor: '#d1d4dc',
      },
       });
    const series = self.chart.chart.addAreaSeries();
    // const series = self.chart.chart.addCandlestickSeries({
    //   upColor: '#35b522',
    //   downColor: '#ff0f23',
    //   borderDownColor: '#ff0f23',
    //   borderUpColor: '#35b522',
    //   wickDownColor: '#ff0f23',
    //   wickUpColor: '#35b522',
    // });
    self.chart.chart.applyOptions({
      priceScale:{
        autoScale: true,
        position: 'right',
        // mode: PriceScaleMode.Logarithmic
      },
      timeScale: {
        fixLeftEdge: true,
        timeVisible: true
      }
      // priceRange: {
      //   minValue: 0,
      //   maxValue: 5
      // }
    });

    let index = 0;
    while (index < self.bnbKlines.length) {
      let kline = self.bnbKlines[index++];
        let utcTimestamp = getUTCTimestamp(kline.datetime);
        series.update({ time: utcTimestamp, value: kline.portfolioValue });
        // let utcTimestamp = getUTCTimestamp(kline.closeTime);
        // series.update({ time: utcTimestamp, value: kline.average });
        // series.update({ time: utcTimestamp, open: kline.open, high: kline.high, 
        //                 low: kline.low, close: kline.close });
    }

    self.chart.chart.timeScale().fitContent();






  //   var series = []
  // // var time = getISODate(self.bnbKlines[0].datetime);
  // for (var i = 0; i < 100; i++) {
  //     let datetime = self.bnbKlines[i].datetime;
  //     datetime = getUTCTimestamp(datetime);
  //     //var date = "" + datetime.getFullYear() + "-" + datetime.getMonth() + "-" + datetime.getDate();
  //     // if (!time) time = date;
  //     // if (!time && time != date) {
  //     //   if (!time) time = date;
  //     // }
  //     // if (time != getISODate(self.bnbKlines[i].datetime)) {
  //     //   series.push({ time: time, value: self.bnbKlines[i].priceUnit });
  //     //   time = getISODate(self.bnbKlines[i].datetime);
  //     // }
  //     var data = { time: datetime, value: self.bnbKlines[i].priceUnit };
  //       series.push(data);
  //       console.log({ time: self.bnbKlines[i].datetime.toJSON(), value: self.bnbKlines[i].priceUnit });
  //   //lineSeries.update({ time: date, value: self.bnbKlines[i].valueInBNB });
  // }
  //   lineSeries.setData(series);

//   console.log(series);
}

function getUTCTimestamp(datetime) {
  //return (datetime.getTime() + datetime.getTimezoneOffset() * 60 * 1000) / 1000;
  return datetime.getTime() / 1000;
}

// function getISODate(datetime) {
//   return datetime.toISOString().split("T")[0]
// }

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
