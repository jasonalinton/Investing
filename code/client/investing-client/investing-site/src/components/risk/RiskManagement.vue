<template>
    <div class="risk-management row g-0">
        <div class="col">
            <h1>Risk Management</h1>
            <h2>{{ symbol }}</h2>
            <h3 v-if="price">{{ currency(price) }}</h3>
        </div>
    </div>
</template>

<script>
import { currency } from '../../service/utility'
import talib  from 'talib'

export default {
    name: "RiskManagement",
    props: {
        symbol: String
    },
    data: function() {
        return {
            config: {
                interval: '1m',
                periods: 300
            },
            functions: [],
            errorMessage: "",
        }
    },
    created: function() {
        console.log("TALib Version: " + talib.version);
        // this.functions = talib.functions;
        // functions.foreach(func => {
        //     this.functions.push(func.name)
        // })
        
    },
    apollo: {
        bars: {
            query() { return require('../../graphql/query/QueryBars.gql')},
            variables() {
                return {
                    symbol: this.symbol,
                    interval: this.config.interval,
                    periods: this.config.periods
                }
            },
            error: function(error) {
                this.errorMessage = 'Error occurred while loading query'
                console.log(this.errorMessage, error);
            },
            update(data) { 
                return data.bars;
            },
            // subscribeToMore: [
            //     {
            //         document: require('../../../../graphql/subscription/todo/IterationAdded.gql'),
            //         updateQuery: (previousResult, { subscriptionData: { data: { iterationAdded }} }) => {
            //             previousResult.todoIterations.splice(0, 0, iterationAdded);
            //             return previousResult;
            //         },
            //     },
            // ]
        },
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