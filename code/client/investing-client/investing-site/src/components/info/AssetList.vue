<template>
    <div class="d-flex flex-row justify-content-start align-items-center" :style="{'height': '100%'}">
        <AssetInfo v-for="(asset, index) in assets" :key="index" :asset="asset" @onAssetClicked="onAssetClicked"></AssetInfo>
    </div>
</template>

<script>
import AssetInfo from "./AssetInfo.vue";
import gql from 'graphql-tag';
0
export default {
  name: "AssetList",
  components: {
    AssetInfo
  },
  apollo: {
    assets: {
      query: gql`query assets {
        assets {
          name
          symbol
          balance
          balances {
            balance
            timeframe
          }
          price
          prices {
            price
            timeframe
          }
          timeframes {
            balance
            change {
              balance
              balancePercent
              value
              valuePercent
            }
            price
            timeframe
            value
          }
          value
        }
      }`,
      update: data => {
        data.assets.forEach(asset => {
            asset.timeframe = asset.timeframes[2];
        });
        return data.assets;
      },
      pollInterval: 30000
    }
  },
  data: function () {
    return {
      assets: null
    };
  },
  methods: {
    onAssetClicked: function(asset) {
        this.$emit('onAssetClicked', asset);
    }
  },
};
</script>

<style>
#app {
  font-family: SF Pro, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>