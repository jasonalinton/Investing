const { ApolloServer, PubSub } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');
const initMiddleware = require('./resolvers/middleware');
const moment = require("moment");
const WatcherService = require('./service/watcher/watcherService');
const assetValueDAO = require('./data/asset/assetValueDAO');
const taService = require('../src/service/risk/technicalAnalysisService');

const fs = require('fs');
const path = require('path');

const QueryFile = require('./resolvers/Query')
const MutationFile = require('./resolvers/Mutation')
const SubscriptionFile = require('./resolvers/Subscription')
const BogeLiquidityMutation = require('./resolvers/mutations/bogeLiquidityMutation')
const AssetInfoMutation = require('./resolvers/mutations/assetInfoMutation')
const InitializationMutation = require('./resolvers/mutations/initializationMutation')
const PortfolioQuery = require('./resolvers/queries/portfolioQuery')
const AssetListQuery = require('./resolvers/queries/assetListQuery')
const AssetValueQuery = require('./resolvers/queries/assetValueQuery')
const TechnicalAnalysisQuery = require('./resolvers/queries/technicalAnalysisQuery')

const Query = {
  ...QueryFile,
  ...PortfolioQuery,
  ...AssetListQuery,
  ...AssetValueQuery,
  ...TechnicalAnalysisQuery
}

const Mutation = {
  ...MutationFile,
  ...BogeLiquidityMutation,
  ...AssetInfoMutation,
  ...InitializationMutation,
}

const Subscription = {
  ...SubscriptionFile
}

const pubsub = new PubSub();

const resolvers = {
  Query,
  Mutation,
  Subscription
}

const prisma = new PrismaClient()
const server = new ApolloServer({
  typeDefs: fs.readFileSync(
    path.join(__dirname, '/schema.graphql'),
    'utf8'
  ),
  resolvers,
  context: ({ req }) => {
    return {
      ...req,
      prisma,
      pubsub
    };
  }
});
Date.prototype.toJSON = function(){ return moment(this).format(); }
// initMiddleware(prisma);

server.listen()
  .then(({ url }) => {
      console.log(`Server is running on ${url}`);

      initDAOs();
      initWatcher();
      // taService.getMorningStar();
      // taService.thirthEightPointTwo();
  }
);

function initDAOs() {
  assetValueDAO.initialize(prisma);
}

function initWatcher() {
  let watcherService = new WatcherService(prisma);
  watcherService.start();
}