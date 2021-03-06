<template>
  <div>
    <div v-if="type == 'navbar'" class="contract info d-flex flex-column align-items-center">
      <img class="logo m-auto" src="/boge-transparent.png" width="40" height="45" />
      <div class="price">{{ currency(bogePrice) }}</div>
    </div>

    <div v-if="type == 'header'" class="contract info d-flex flex-row align-items-center">
      <!-- Logo -->
      <img class="logo" src="/boge-transparent.png" width="55" height="60" />
      <!-- Numbers -->
      <div class="numbers d-flex flex-column">
          <div class="price">{{ currency(bogePrice) }}</div>
          <div v-if="timeframe" class="d-flex flex-row">
          <span class="change">
              {{ timeframe.change.price.toFixed(2) }} / {{ timeframe.change.percent.toFixed(1) }}%
          </span>
          <!-- Timeframe -->
          <div class="timeframe" @click="toggleTimeframe" :style="{'text-align': 'center'}">{{ timeframe.text }}</div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import date from 'date-and-time';
import gql from 'graphql-tag';
import { currency } from '../../service/utility';

export default {
  name: "ContractInfo",
  props: {
    address: String,
    type: String
  },
  apollo: {
    bogePrice: gql`query {
      bogePrice
    }`
  },
  data: function () {
      return {
          bogePrice: '',
          price: 0,
          timeframe: null,
          timeframes: [
          { text: "24hrs", getDate: dayAgo, balance: null, change: { balance: null, percent: null } },
          { text: "1w", getDate: weekAgo, balance: null, change: { balance: null, percent: null } },
          { text: "1m", getDate: monthAgo, balance: null, change: { balance: null, percent: null } },
          { text: "1hr", getDate: hourAgo, balance: null, change: { balance: null, percent: null } },
          ],
      };
  },
  created: function() {
      const self = this;
      setContractPrice(self);
      setInterval(setContractPrice, 60000, self);
  },
  methods: {
    onContractClicked: function() {
        this.$emit('onContractClicked');
    },
    currency
  }
};

function setContractPrice(self) {
    getContractPrice()
            .then(
                res => { getContractPrice_Resolve(self, res) },
                err => { getContractPrice_Reject(err)}
            );
}

function getContractPrice() {
    var data = {
        query: `
        query {
            getBogePrice
        }
        `
    }
    return axios.post('http://localhost:4000/graphql', data);
}

function getContractPrice_Resolve(self, response) {
    self.price = response.data.data.getBogePrice;
}

function getContractPrice_Reject(error) {
    console.log(error);
}

function hourAgo() {
  return date.addHours(new Date(), -1);
}

function dayAgo() {
  return date.addDays(new Date(), -1);
}

function weekAgo() {
  return date.addDays(new Date(), -7);
}

function monthAgo() {
  return date.addMonths(new Date(), -1);
}
//
</script>

<style>
.contract.info {
  margin-top: 12px;
  margin-left: 12px;
  margin-bottom: 12px;
}

.contract.info .price {
  font-size: 20px;
  color: #25a811;
  z-index: 10;
  margin-top: -17px;
}

.contract.info .change {
    font-size: 20px;
    line-height: 24px;
    color: #999999;
    margin-left: 4px;
}

.contract.info .timeframe {
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

.contract.info .logo {
  margin-right: 12px;
}
</style>
