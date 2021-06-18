<template>
  <div class="portfolio d-flex flex-row align-items-center">
    <!-- Numbers -->
    <div class="numbers d-flex flex-column ">
      <div class="value">{{ currency(portfolioBalance.total) }}</div>
    </div>
  </div>
</template>

<script>
import gql from 'graphql-tag';
import { currency } from '../../service/utility';

export default {
  name: "PortfolioInfo",
  props: {
      address: String,
  },
  apollo: {
    portfolioBalance: gql`query {
      portfolioBalance {
        total
        binance
        boge
        bnb
      }
    }`
  },
  data: function () {
    return {
      portfolioBalance: { 
        total: 0,
        binance: 0,
        boge: 0,
        bnb: 0
      },
    };
  },
  methods: {
    currency
  }
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
</style>
