<template>
    <div class="contract row g-0">
        <div class="col">
            <div class="row g-0">
                <div class="col">
                    <contract-chart type="area"></contract-chart>
                </div>
            </div>
            <div class="row g-0">
                <div class="col">
                    <contract-info  :address='"0x248c45af3b2f73bc40fa159f2a90ce9cad7a77ba"'></contract-info>
                </div>
            </div>
            <div class="row g-0">
                <div class="col">
                    <transfer-table :txFromAddress='"0xfd345014ed667bb07eb26345e66addc9e8164b3b"'></transfer-table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import ContractChart from './chart/ContractChart.vue';
import ContractInfo from './info/ContractInfo.vue';
import TransferTable from './TransferTable.vue';

export default {
    components: { ContractChart, ContractInfo, TransferTable },
    name: "Contract",
}

</script>

<style scoped>
    .contract {
        color: rgb(91, 91, 91);
    }
</style>