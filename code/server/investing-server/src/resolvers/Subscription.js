const { PubSub, withFilter } = require('apollo-server');
const pubsub = new PubSub();

let barAdded = {
    subscribe: withFilter(
    (_, __, { pubsub }) => pubsub.asyncIterator(['BAR_ADDED']),
    (payload, variables) => {
        return payload.barAdded.symbol == variables.symbol &&
               payload.barAdded.interval == variables.interval
    })
}

let priceUpdated = {
    subscribe: withFilter(
    (_, __, { pubsub }) => pubsub.asyncIterator(['PRICE_UPDATED']),
    (payload, variables) => {
        return payload.priceUpdated.symbol == variables.symbol
    })
}

let highLowAdded = {
    subscribe: withFilter(
    (_, __, { pubsub }) => pubsub.asyncIterator(['HIGHLOW_ADDED']),
    (payload, variables) => {
        return (payload.symbol == variables.symbol && payload.interval == variables.interval && payload.period == variables.period)
    })
}

module.exports = {
    barAdded,
    priceUpdated,
    highLowAdded
}