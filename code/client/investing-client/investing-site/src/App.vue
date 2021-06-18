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
            <PortfolioInfo></PortfolioInfo>
          </div>
        </div>
        <div class="col-auto d-flex align-items-center">
            <img class="logo" src="/boge-transparent.png" width="55" height="60" @click="onContractClicked"/>
        </div>
        <div class="col" :style="{'overflow': 'scroll'}">
          <AssetList @onAssetClicked="onAssetClicked"></AssetList>
        </div>
      </div>
      <asset v-if="chartType == 'asset' && renderAsset" :asset="asset"></asset>
      <contract v-if="chartType == 'contract' && renderContract"></contract>
    </div>
  </div>
</template>

<script>
import $ from "jquery";

import PortfolioInfo from "./components/info/PortfolioInfo.vue";
import AssetList from "./components/info/AssetList.vue";
import Asset from './components/Asset.vue';
import Contract from './components/Contract.vue';
import { clone } from './service/utility'

export default {
  name: "App",
  components: {
    PortfolioInfo,
    AssetList,
    Asset,
    Contract
  },
  data: function () {
    return {
      chartType: 'contract',
      renderAsset: true,
      renderContract: true,
      asset: {},
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
    bodyStyle: function () {
      let height = $(window).height() - $('#app-header').height() - $('#app-chart').height();
      return { 'height': height };
    },
    getChartHeight: function () {
      return this.style.chartHeight;
    },
    getBodyHeight: function () {
      return $(window.top).height() - $('#app-header').height() - $('#app-chart').height();
    },
    onAssetClicked: function(asset) {
      this.asset = clone(asset);
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
