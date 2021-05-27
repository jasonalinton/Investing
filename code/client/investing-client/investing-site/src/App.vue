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
      <div class="row g-0">
        <div class="col">
          <div class="d-flex flex-row justify-content-between">
            <ContractInfo :address='"0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba"'></ContractInfo>
            <BalanceInfo :address='"0xfd345014ed667bb07eb26345e66addc9e8164b3b"'></BalanceInfo>
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
import ContractChart from "./components/chart/ContractChart.vue";
// import Chart from "./components/Chart.vue";
// import MyChart from "./components/MyChart.vue";
import TransferTable from "./components/TransferTable.vue";

export default {
  name: "App",
  components: {
    ContractInfo,
    BalanceInfo,
    ContractChart,
    // MyChart,
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
      assetInfo: {
          name: "Cardano",
          symbol: "ADA",
          balance: 376.7509,
          value: 655.5,
          kLines: [],
          address: "",
          change: {},
          changes: [
              { timeframe: "24hrs", balance: null, amount: 585, percent: 18 },
              { timeframe: "1w", balance: null, amount: null, percent: null },
              { timeframe: "30d", balance: null, amount: null, percent: null },
              { timeframe: "1hr", balance: null, amount: null, percent: null }
          ]
      }
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
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
