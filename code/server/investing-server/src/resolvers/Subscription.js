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

module.exports = {
    barAdded
}