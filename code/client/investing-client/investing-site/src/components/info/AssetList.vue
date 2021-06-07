<template>
    <div class="d-flex flex-row justify-content-start align-items-center" :style="{'height': '100%'}">
        <AssetInfo v-for="(asset, index) in assets" :key="index" :asset="asset"></AssetInfo>
    </div>
</template>

<script>
import AssetInfo from "./AssetInfo.vue";
import { io } from "socket.io-client";

export default {
  name: "AssetList",
  components: {
    AssetInfo
  },
  data: function () {
    return {
      assets: null
    };
  },
  created: function () {
      this.initSocket(this);
  },
  methods: {
    initSocket: (self) => {
        self.socket = io("http://localhost:3050");
        self.socket.on('asset-list', (assetList) => {
            assetList.forEach(asset => {
                asset.timeframe = asset.timeframes[2];
            });

            self.assets = assetList;
        });
    },
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