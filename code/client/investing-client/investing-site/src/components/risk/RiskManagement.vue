<template>
    <div class="risk-management row g-0">
        <div class="col">
            <h1>Risk Management</h1>
            <h2>{{ asset.symbol }}</h2>
            <h3>{{ currency(asset.price) }}</h3>
        </div>
    </div>
</template>

<script>
import { currency } from '../../service/utility'

export default {
    name: "RiskManagement",
    props: {
        asset: Object
    },
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
    .risk-management {
        color: white;
    }
</style>