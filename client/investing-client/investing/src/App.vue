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
          <BalanceInfo></BalanceInfo>
        </div>
        <div class="col">
          <div class="btn-group" role="group" aria-label="Basic radio toggle button group">
            <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" checked>
            <label class="btn btn-outline-primary" for="btnradio1">Radio 1</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off">
            <label class="btn btn-outline-primary" for="btnradio2">Radio 2</label>

            <input type="radio" class="btn-check" name="btnradio" id="btnradio3" autocomplete="off">
            <label class="btn btn-outline-primary" for="btnradio3">Radio 3</label>
          </div>
        </div>
      </div>
      <!-- Chart -->
      <div class="row g-0">
        <div class="col">
          <Chart v-if="showChart"></Chart>
          <!-- <MyChart v-if="showChart"></MyChart> -->
        </div>
      </div>
      <!-- Tables -->
        <TransferTable :txFromAddress='"0xfd345014ed667bb07eb26345e66addc9e8164b3b"'> </TransferTable>
        <!-- <TransferTable :tableHeight="tableHeight"> </TransferTable> -->
    </div>
  </div>
</template>

<script>
import $ from "jquery";
import BalanceInfo from "./components/BalanceInfo.vue";
import Chart from "./components/Chart.vue";
// import MyChart from "./components/MyChart.vue";
import TransferTable from "./components/TransferTable.vue";

export default {
  name: "App",
  components: {
    BalanceInfo,
    Chart,
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
    };
  },
  computed: {
    tableHeight: function () {
      return $(window).height() - 106 - 600 + "px";
    },
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
