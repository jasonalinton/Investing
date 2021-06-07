<template>
  <div class="portfolio d-flex flex-row align-items-center">
    <!-- Numbers -->
    <div class="numbers d-flex flex-column ">
      <div class="value">{{ Number(balance.toFixed(2)).toLocaleString() }}</div>
      <div v-if="timeframe" class="d-flex flex-row justify-content-evenly">
        <span class="change">
          {{ timeframe.change.balance.toFixed(2) }} / {{ timeframe.change.percent.toFixed(1) }}%
        </span>
        <!-- Timeframe -->
        <div class="timeframe" @click="toggleTimeframe" :style="{'text-align': 'center'}">{{ timeframe.text }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import date from 'date-and-time';
import { io } from "socket.io-client";

export default {
  name: "BalanceInfo",
    props: {
        address: String,
    },
  data: function () {
    return {
      balance: 0,
      timeframes: [
        { text: "24hrs", getDate: dayAgo, balance: null, change: { balance: null, percent: null } },
        { text: "1w", getDate: weekAgo, balance: null, change: { balance: null, percent: null } },
        { text: "30d", getDate: monthAgo, balance: null, change: { balance: null, percent: null } },
        { text: "1hr", getDate: hourAgo, balance: null, change: { balance: null, percent: null } },
      ],
      timeframe: null,
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
  created: function() {
    let self = this;
    getWalletBalance(self)
      .then(res => {
        self.balance = res.data.data.getWalletBalance.balance;
        self.setTimeframe();
      }, () => new Promise((resolve) => {
        getWalletBalance_BSC(self, resolve);
      }, error => { console.log(error.response.data.errors) })
      .then(res => {
        self.balance = res;
        self.setTimeframe();
      }));
  },
  methods: {
    initSocket: (self) => {
        self.socket = io("http://localhost:3050");
        self.socket.on('portfolio-value', portfolioValue => {
            self.balance = portfolioValue;
        });
    },
    toggleTimeframe: function() {
      let self = this;

      let timeframe = self.timeframes.shift();
      self.timeframes.push(timeframe);

      let datetime = timeframe.getDate();
      getWalletBalance(self, datetime)
        .then(res => {
          timeframe.balance = res.data.data.getWalletBalance.balance;
          timeframe.change.balance = self.balance - timeframe.balance;
          let decimal = timeframe.change.balance / self.balance;
          timeframe.change.percent = decimal * 100; 
          self.timeframe = timeframe;
        }, () => new Promise((resolve) => {
          getWalletBalance_BSC(self, resolve);
        }, error => { console.log(error.response.data.errors) })
        .then(res => {
          timeframe.balance = res;
          timeframe.change.balance = self.balance - timeframe.balance;
          let decimal = timeframe.change.balance / self.balance;
          timeframe.change.percent = decimal * 100; 
          self.timeframe = timeframe;
        }));
    },
    setTimeframe: function() {
      this.toggleTimeframe();
    }
  }
};

function getWalletBalance(self, datetime) {
    var data = {
        query: `
        mutation {
          getWalletBalance(
            address: "${self.address}"
            datetime: ${(datetime) ? `"${datetime.toJSON()}"` : null}
          ) {
            id
            datetime
            balance
            name
            address
          }
        }
        `
    }
    return axios.post('http://localhost:4000/graphql', data);
}

async function getWalletBalance_BSC(self, resolve) {
    axios.get(`https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba&address=${self.address}&tag=latest&apikey=BG6DCTFBA1MWMYBZV7QGS831QVFMUADUB9`)
      .then(res => {
        if (res.data.result) {
          resolve(res.data.result);
        } else {
          // If no result is returned, try again, you might have thrown a too many requests error
          getWalletBalance_BSC(self, resolve);
        }
      });
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
</style>
