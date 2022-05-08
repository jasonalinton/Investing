<template>
    <div class="d-flex flex-row justify-content-start align-items-center" :style="{'height': '100%'}">
        <div v-for="(asset, index) in assets" :key="index" :asset="asset">
            <div class="asset" @click="onAssetClicked(asset)">{{ asset.symbol }}</div>
        </div>
    </div>
</template>

<script>
import gql from 'graphql-tag';
export default {
  name: "Assets",
  components: {
      
  },
  apollo: {
    assets: {
      query: gql`query assets {
        assets {
            id
            text
            symbol
        }
      }`,
      update: data => {
        return data.assets;
      },
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
.asset {
    padding: 10px;
    color: white;
}
</style>