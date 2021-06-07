<template>
    <div class="asset info d-flex flex-row justify-content-between" :style="{'padding-left': '4px'}">
        <div class="d-flex flex-column justify-content-between" :style="{'padding': '8px'}">
            <div class="symbol">{{ asset.symbol }}</div>
            <div class="change" :class="changeClass()">{{ `$${formatNum(asset.timeframe.change.value)} (${formatNum(asset.timeframe.change.valuePercent)}%)` }}</div>
        </div>
        <div class="d-flex flex-column justify-content-between" :style="{'padding': '8px'}">
            <div class="value" :class="changeClass()">{{ currency(asset.value) }}</div>
            <div class="balance">{{ formatNum(asset.balance) }}</div>
        </div>
        <div class="d-flex" :style="{'padding': '8px'}">
            <div :id="`${asset.symbol}-info-chart`"></div>
        </div>
    </div>
</template>

<script>
import { createChart } from "lightweight-charts";

export default {
    name: "AssetInfo",
    props: {
        asset: Object
    },
    data: function () {
        return {
            // name: this.asset_in.name,
            // symbol: this.asset_in.symbol,
            // balance: this.asset_in.balance,
            // value: this.asset_in.value,
            // kLines: this.asset_in.kLines,
            // address: this.asset_in.address,
            // timeframe: this.asset_in.timeframes[1],
            // timeframes: this.asset_in.timeframes,
        };
    },
    mounted: function() {
        // this.chart(this);
    },
    methods: {
        chart: (self) => {
            const chart = createChart(`${self.symbol}-info-chart`, {
                width: 120,
                height: 40,
                priceScale: {
                    position: 'none',
                    drawTicks: false,
                    borderColor: "#fff"
                },
                rightPriceScale: {
                    visible: false,
                },
                leftPriceScale: {
                    visible: false,
                },
                timeScale: {
                    visible: false,
                    fixLeftEdge: true
                },
                crosshair: {
                    horzLine: {
                        visible: false,
                    },
                    vertLine: {
                        visible: false,
                    },
                },
                layout: {
                    backgroundColor: '#262626',
                },
                grid: {
                    vertLines: {
                        visible: false
                    },
                    horzLines: {
                        visible: false
                    },
                },
                handleScroll: false,
                handleScale: false,
            });

            var areaSeries = chart.addLineSeries({
                color: self.changeColor(),
                lineWidth: 2,
                priceLineVisible: false,
                crosshairMarkerVisible: false,
            });

            areaSeries.setData(self.change.series);

            chart.timeScale().fitContent();
        },
        changeClass: function () {
            if (this.asset.timeframe.change.value >= 0)
                return "green";
            else if (this.asset.timeframe.change.value < 0)
                return "red";
        },
        changeColor: function () {
            if (this.asset.timeframe.change.value >= 0)
                return "#4DF832";
            else if (this.asset.timeframe.change.value < 0)
                return "#FF0F23";
        },
        formatNum: function(number) {
            return Number(number.toFixed(2)).toLocaleString();
        },
        currency: function(number) {
            return new Intl.NumberFormat([ ], { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' }).format(number);
        }
    }
};
//
</script>

<style>
    .asset.info {
        background-color: #262626;
        border-radius: 4px;
        font-family: SF Pro;
        height: 60px;
        margin: 0 4px;
        white-space: nowrap;
    }

    .asset.info .symbol {
        color: #D4D4D4;
        font-size: 20px;
        line-height: 24px;
    }

    .asset.info .change {
        font-size: 14px;
        line-height: 16px;
        font-weight: 200;
        letter-spacing: .5px;
    }

    .asset.info .value {
        font-size: 20px;
        font-size: 20px;
        line-height: 24px;
        font-weight: 300;
        letter-spacing: 1px;
    }

    .asset.info .balance {
        color: #999999;
        font-size: 14px;
        line-height: 16px;
        /* text-align: center; */
        margin-left: 12px
    }

    .asset.info .green {
        color: #4DF832;
    }

    .asset.info .red {
        color: #FF0F23;
    }
</style>