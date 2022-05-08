<template>
  <div
    class="row g-0"
    :style="{
      'background-color': '#1D1D1D',
      'padding-left': style.windowPadding.left + 'px',
      'padding-right': style.windowPadding.right + 'px',
    }"
  >
    <div class="col">
      <!-- Header -->
      <div id="app-header" class="row gx-4">
        <div class="col-auto">
          <div class="d-flex flex-row justify-content-start">
            <!-- <PortfolioInfo></PortfolioInfo> -->
          </div>
        </div>
        <div class="col-auto d-flex align-items-center">
            <!-- <ContractInfo type="navbar"></ContractInfo> -->
        </div>
        <div class="col" :style="{'overflow': 'scroll'}">
          <Assets @onAssetClicked="onAssetClicked"></Assets>
          <!-- <AssetList @onAssetClicked="onAssetClicked"></AssetList> -->
        </div>
      </div>
      <Asset v-if="chartType == 'asset' && renderAsset" :asset="asset"></Asset>
      <Contract v-if="chartType == 'contract' && renderContract"></Contract>
      <!-- <RiskManagement v-if="chartType == 'risk'" :symbol="'SHIB'"></RiskManagement> -->
    </div>
  </div>
</template>

<script>
import $ from "jquery";

// import PortfolioInfo from "./components/info/PortfolioInfo.vue";
// import AssetList from "./components/info/AssetList.vue";
import Assets from './components/info/Assets.vue';
import Asset from './components/Asset.vue';
import Contract from './components/Contract.vue';
// import { clone } from './service/utility'
// import ContractInfo from './components/info/ContractInfo.vue';
// import RiskManagement from './components/risk/RiskManagement.vue';

export default {
  name: "App",
  components: {
    // PortfolioInfo,
    // AssetList,
    Asset,
    Assets,
    Contract,
    // ContractInfo,
    // RiskManagement
  },
  data: function () {
    return {
      chartType: 'risk',
      renderAsset: true,
      renderContract: true,
      asset: {
        "name": "SHIBA INU",
        "symbol": "SHIB",
        "balance": 40362402,
        "balances": [
            {
                "balance": -1,
                "timeframe": "1m",
                "__typename": "AssetBalance"
            },
            {
                "balance": -1,
                "timeframe": "1h",
                "__typename": "AssetBalance"
            },
            {
                "balance": -1,
                "timeframe": "1d",
                "__typename": "AssetBalance"
            },
            {
                "balance": -1,
                "timeframe": "1w",
                "__typename": "AssetBalance"
            },
            {
                "balance": -1,
                "timeframe": "1M",
                "__typename": "AssetBalance"
            }
        ],
        "price": 0.00002388,
        "prices": [
            {
                "price": 0.00002388,
                "timeframe": "1m",
                "__typename": "AssetPrice"
            },
            {
                "price": 0.00002535,
                "timeframe": "1h",
                "__typename": "AssetPrice"
            },
            {
                "price": 0.00002402,
                "timeframe": "1d",
                "__typename": "AssetPrice"
            },
            {
                "price": 0.00000717,
                "timeframe": "1w",
                "__typename": "AssetPrice"
            },
            {
                "price": -1,
                "timeframe": "1M",
                "__typename": "AssetPrice"
            }
        ],
        "timeframes": [
            {
                "balance": null,
                "change": {
                    "balance": null,
                    "balancePercent": null,
                    "value": null,
                    "valuePercent": null,
                    "__typename": "AssetChange"
                },
                "price": 0.00002388,
                "timeframe": "1m",
                "value": null,
                "__typename": "AssetTimeframe"
            },
            {
                "balance": null,
                "change": {
                    "balance": null,
                    "balancePercent": null,
                    "value": null,
                    "valuePercent": null,
                    "__typename": "AssetChange"
                },
                "price": 0.00002535,
                "timeframe": "1h",
                "value": null,
                "__typename": "AssetTimeframe"
            },
            {
                "balance": null,
                "change": {
                    "balance": null,
                    "balancePercent": null,
                    "value": null,
                    "valuePercent": null,
                    "__typename": "AssetChange"
                },
                "price": 0.00002402,
                "timeframe": "1d",
                "value": null,
                "__typename": "AssetTimeframe"
            },
            {
                "balance": null,
                "change": {
                    "balance": null,
                    "balancePercent": null,
                    "value": null,
                    "valuePercent": null,
                    "__typename": "AssetChange"
                },
                "price": 0.00000717,
                "timeframe": "1w",
                "value": null,
                "__typename": "AssetTimeframe"
            },
            {
                "balance": null,
                "change": {
                    "balance": null,
                    "balancePercent": null,
                    "value": null,
                    "valuePercent": null,
                    "__typename": "AssetChange"
                },
                "price": null,
                "timeframe": "1M",
                "value": null,
                "__typename": "AssetTimeframe"
            }
        ],
        "value": 963.8541597599999,
        "__typename": "AssetList",
        "timeframe": {
            "balance": null,
            "change": {
                "balance": null,
                "balancePercent": null,
                "value": null,
                "valuePercent": null,
                "__typename": "AssetChange"
            },
            "price": 0.00002402,
            "timeframe": "1d",
            "value": null,
            "__typename": "AssetTimeframe"
        }
    },
      style: {
        windowPadding: {
          left: 12,
          right: 12,
          top: 0,
          bottom: 0,
        },
        bodyHeight: 0,
        chartHeight: 500
      },
    };
  },
  mounted: function() {
    this.onResize();
  },
  created: function () {
    window.addEventListener('resize', this.onResize);
  },
  methods: {
    onResize() {
      this.style.chartHeight = this.getChartHeight();
      this.style.bodyHeight = this.getBodyHeight();
    },
    // bodyStyle: function () {
    //   let height = $(window).height() - $('#app-header').height() - $('#app-chart').height();
    //   return { 'height': height };
    // },
    getChartHeight: function () {
      return this.style.chartHeight;
    },
    getBodyHeight: function () {
      return $(window.top).height() - $('#app-header').height() - $('#app-chart').height();
    },
    onAssetClicked: function(asset) {
      this.asset = asset;
      this.chartType = 'asset';
      this.renderAsset = false;
      this.$nextTick(() => this.renderAsset = true);
    },
    onContractClicked: function() {
      this.chartType = 'contract';
      this.renderContract = false;
      this.$nextTick(() => this.renderContract = true);
    }
  },
};
</script>

<style>
#app {
  font-family: SF Pro, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #56799c;
  margin-top: 60px;
}
</style>
