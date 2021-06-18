<template>
    <div class="asset row g-0">
        <div class="col">
            <div class="row g-0">
                <div class="col">
                    <asset-chart :asset="asset" type="candelstick"></asset-chart>
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
                    <trade-table :asset="asset"></trade-table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import AssetChart from './chart/AssetChart.vue';
import TradeTable from './table/TradeTable.vue';
import { currency } from '../service/utility'

export default {
    components: { AssetChart, TradeTable },
    name: "Asset",
    props: { asset: Object },
    created: function() {
        
    },
    methods: {
        currency: (number) => {
            return currency(number);
        }
    }
}
</script>

<style scoped>
    .asset {
        color: rgb(190, 190, 190);
    }
</style>