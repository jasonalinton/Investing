<template>
  <div class="portfolio d-flex flex-row align-items-center">
    <!-- Numbers -->
    <div class="numbers d-flex flex-column">
      <div class="value">{{ portfolio.value }}</div>
      <div class="d-flex flex-row">
        <span class="change">
          {{ portfolio.change.price }} / {{ portfolio.change.percent }}
        </span>
        <!-- Timeframe -->
        <div class="timeframe">{{ portfolio.change.timeframe }}</div>
      </div>
    </div>
    <!-- Logo -->
    <img class="logo" src="/boge-transparent.png" width="55" height="60" />
  </div>
</template>

<script>
export default {
  name: "BalanceInfo",
  data: function () {
    return {
      portfolio: {
        value: "$ " + (9420.69).toLocaleString(),
        change: {
          price: "$" + (1806.48).toLocaleString(),
          percent: (24.4).toLocaleString() + "%",
          timeframe: "24hrs",
        },
      },
    };
  },
};
</script>

<style>
.portfolio {
  margin-top: 12px;
  margin-left: 12px;
  margin-bottom: 12px;
}

.portfolio .value {
  font-size: 48px;
  line-height: 58px;
  color: #4df832;
}

.portfolio .change {
    font-size: 20px;
    line-height: 24px;
    color: #999999;
    margin-left: 4px;
}

.portfolio .timeframe {
  margin-left: 5px;
  width: 48px;
  height: 24px;
  font-size: 14px;
  line-height: 16px;
  color: #d4d4d4;
  background-color: #565656;
  padding: 4px 5px;
  border-radius: 4px;
}

.portfolio .logo {
  margin-left: 24px;
  margin-top: 16px;
}
</style>
