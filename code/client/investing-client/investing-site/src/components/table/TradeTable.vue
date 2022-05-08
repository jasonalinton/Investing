<template>
    <table class="trade table table-dark table-hover">
        <thead class="thead-light">
            <tr>
                <th class="d-none d-md-table-cell"></th>
                <th>Time</th>
                <th>Amount</th>
                <th>Price</th>
                <th>Fee</th>
                <th>Total</th>
                <!-- <th>feeSymbol</th>
                <th>price_Total</th> -->
            </tr>
        </thead>
        <tbody is="transition-group" name="trade-list" v-cloak>
            <tr v-for="(trade, index) in trades" :key="trade.id" :class="trade.type">
                <td class="d-none d-md-table-cell center">{{ index + 1 }}</td>
                <td>
                    <div class="d-flex flex-column">
                        <span>{{ formatDate(trade.datetime) }}</span>
                    </div>
                </td>
                
                <!-- Amount -->
                <td>
                    <div class="d-flex flex-column">
                        <span :style="{ 'margin-bottom': '2px' }">{{ Number(trade.amount_Traded.toFixed(4)).toLocaleString() }}</span>
                    </div>
                </td>

                <!-- Price Unit -->
                <td class="center">
                    {{ currency(trade.price_Unit) }}
                </td>

                <!-- Fee -->
                <td class="center">
                    {{ Number(trade.amount_Fee.toFixed(2)).toLocaleString() }} {{ trade.feeSymbol }}
                </td>

                <!-- Total -->
                <td class="center">
                    {{ currency(trade.price_Total) }}
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script>
import axios from "axios";

export default {
    name: "TradeTable",
    props: {
        tableHeight: String,
        asset: Object
    },
    data: function () {
        return {
            trades: []
        };
    },
    created: function () {
        this.getTrades(this);
    },
    computed: { },
    methods: {
        getTrades: async function(self) {
            var data = {
                query: `
                    mutation {
                        trades(symbol: "${self.asset.symbol}") {
                            id
                            datetime
                            symbol
                            feeSymbol
                            type
                            amount_Traded
                            amount_Fee
                            price_Unit
                            price_Total
                            price_Subtotal
                            orderID_Exchange
                        }
                    }
                    `
            };
            return axios.post('http://localhost:4001/graphql', data)
                .then(result => {
                    result.data.data.trades.forEach(trade => {
                        trade.datetime = new Date(Number(trade.datetime));
                        self.trades.push(trade);
                    });
                    self.$emit("tradesUpdated", self.trades);
                });
        },
        date: function (datetime) {
            return datetime.toLocaleDateString();
        },
        time: function (datetime) {
            return datetime.toLocaleTimeString();
        },
        formatDate: (date) => {
            return new Intl.DateTimeFormat([], { dateStyle: 'short', timeStyle: 'short' }).format(date);
        },
        currency: function(number) {
            if (this.asset.symbol == "SHIB")
                return new Intl.NumberFormat([ ], { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', minimumSignificantDigits: 4 }).format(number);
            else
                return new Intl.NumberFormat([ ], { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' }).format(number);
        },
    },
};
</script>

<style>

.trade-list-leave-to, .trade-list-enter {
    opacity: 0;
    transform: translateY(30px);
}

.trade-list-enter-active, .trade-list-leave-active {
    transition: all 1s;
}

td.center {
    font-size: 14px;
    vertical-align: middle;
}

table.transfer th:nth-child(1) {
    width: 20px;
}

table.trade th:nth-child(2) {
    width: 170px;
}

table.trade tr.buy {
    color: #35b522 !important;
}

table.trade tr.sell {
    color: #ff0f23 !important;
}

</style>
