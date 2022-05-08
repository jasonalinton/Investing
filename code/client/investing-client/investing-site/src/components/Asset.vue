<template>
    <div class="asset row g-0">
        <div class="col">
            <div class="row g-0">
                <div class="col">
                    <asset-chart :asset="asset" :trades="trades" type="candelstick"></asset-chart>
                </div>
            </div>
            <div class="row g-0">
                <div class="col">
                    <div class="d-flex">
                        <h2>{{ asset.symbol }}: {{ currency(asset.price) }}</h2>
                        <h2></h2>
                    </div>
                </div>
            </div>
            <div class="row g-0">
                <div class="col">
                    <trade-table :asset="asset" @tradesUpdated="tradesUpdated"></trade-table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import AssetChart from './chart/AssetChart2.vue';
import TradeTable from './table/TradeTable.vue';
import { currency } from '../service/utility'

export default {
    components: { AssetChart, TradeTable },
    name: "Asset",
    props: { asset: Object },
    data: function() {
        return {
            trades: []
        }
    },
    created: function() {
        
    },
    methods: {
        currency(number) {
            if (this.asset.symbol == "SHIB")
                return new Intl.NumberFormat([ ], { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', minimumSignificantDigits: 4 }).format(number);
            else
                return currency(number);
        },
        tradesUpdated: function(trades) {
            this.trades = trades;
        },
    }
}
</script>

<style scoped>
    .asset {
        color: rgb(190, 190, 190);
    }
</style>