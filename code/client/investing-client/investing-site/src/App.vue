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
      <div class="row g-4">
        <div class="col-auto">
          <div class="d-flex flex-row justify-content-start">
            <BalanceInfo :address='"0xfd345014ed667bb07eb26345e66addc9e8164b3b"'></BalanceInfo>
            <ContractInfo :address='"0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba"'></ContractInfo>
          </div>
        </div>
        <div class="col" :style="{'overflow': 'scroll'}">
          <div class="d-flex flex-row justify-content-start align-items-center" :style="{'height': '100%'}">
            <AssetInfo v-for="(assetInfo, index) in assetInfos" :key="index" :assetInfo="assetInfo"></AssetInfo>
          </div>
        </div>
      </div>
      <!-- Chart -->
      <div class="row g-0">
        <div class="col">
          <!-- <MyChart v-if="showChart" :bnbKlines="klines" :type="chartType"></MyChart> -->
          <ContractChart type="area"></ContractChart>
        </div>
      </div>
      <!-- Tables -->
        <TransferTable :txFromAddress='"0xfd345014ed667bb07eb26345e66addc9e8164b3b"'> </TransferTable>
        <!-- <TransferTable :tableHeight="tableHeight"> </TransferTable> -->
    </div>
  </div>
</template>

<script>
import ContractInfo from "./components/info/ContractInfo.vue";
import BalanceInfo from "./components/info/BalanceInfo.vue";
import AssetInfo from "./components/info/AssetInfo.vue";
import ContractChart from "./components/chart/ContractChart.vue";
import TransferTable from "./components/TransferTable.vue";

export default {
  name: "App",
  components: {
    ContractInfo,
    BalanceInfo,
    AssetInfo,
    ContractChart,
    TransferTable,
  },
  data: function () {
    return {
      showChart: false,
      style: {
        windowPadding: {
          left: 12,
          right: 12,
          top: 0,
          bottom: 0,
        },
      },
      assetInfos: [
        {
          name: "Cardano",
          symbol: "ADA",
          balance: 376.7509,
          value: 655.5,
          kLines: [],
          address: "",
          change: { timeframe: "24hrs", balance: null, amount: 5859.997, percent: 18, series: [
            { time: '2018-10-19', value: 219.31 },
            { time: '2018-10-22', value: 220.65 },
            { time: '2018-10-23', value: 222.73 },
            { time: '2018-10-24', value: 215.09 },
            { time: '2018-10-25', value: 219.80 },
          ] },
          changes: [
              { timeframe: "24hrs", balance: 5574, amount: 5859.997, percent: 18 },
              { timeframe: "1w", balance: 9874, amount: 1058, percent: 5 },
              { timeframe: "30d", balance: 654654, amount: 855, percent: 5.7 },
              { timeframe: "1hr", balance: 8879, amount: 585, percent: 1255 }
          ]
        },
        {
          name: "Binance Chain",
          symbol: "BNB",
          balance: 1.6300005,
          value: 1058.57,
          kLines: [],
          address: "",
          change: { timeframe: "24hrs", balance: null, amount: -432, percent: 9, series: [
            { time: '2018-12-01', value: 32.51 },
            { time: '2018-12-02', value: 31.11 },
            { time: '2018-12-03', value: 27.02 },
            { time: '2018-12-04', value: 27.32 },
            { time: '2018-12-05', value: 25.17 },
            { time: '2018-12-06', value: 28.89 },
          ] },
          changes: [
              { timeframe: "24hrs", balance: 5574, amount: 5859.997, percent: 18 },
              { timeframe: "1w", balance: 9874, amount: 1058, percent: 5 },
              { timeframe: "30d", balance: 654654, amount: 855, percent: 5.7 },
              { timeframe: "1hr", balance: 8879, amount: 585, percent: 1255 }
          ]
        },
      ]
    };
  },
  created: function () {
    
  },
  computed: {
    
  },
};
</script>

<style>
#app {
  font-family: SF Pro, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
