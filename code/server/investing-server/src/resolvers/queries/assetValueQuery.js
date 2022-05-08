const date = require('date-and-time');
const technicalAnalysisService = require('../../service/risk/technicalAnalysisService');

async function bars(parent, args, context, info) {

    let periodCount = args.periods ?? 30;
    let chunkCount = 20;

    let bars = [];
    if (['1m', '1h', '1d'].includes(args.interval)) {
        bars = await context.prisma.assetvalue.findMany({
            where: {
                AND: [
                    { symbol: args.symbol },
                    { interval: args.interval }
                ]
            },
            orderBy: { openTime: 'desc' },
            take: periodCount
        });
    
        bars.forEach(value => {
            value.datetime = new Date(value.openTime);
        })
        bars = bars.reverse();
    } else {
        let interval = args.interval ?? '1m';
        let queryInterval = undefined;

        let timeframeNum = interval.slice(0, -1);
        let timeframeUnit = interval.slice(-1);

        let totalTime = timeframeNum * periodCount;;
        let addTimeframeUnit = undefined;
        if (timeframeUnit == 'm') {
            queryInterval = '1m';
            addTimeframeUnit = date.addMinutes;
            if (args.start && args.end) totalTime = date.subtract(end - start).toMinutes();
        } else if (timeframeUnit == 'h') {
            queryInterval = '1h';
            addTimeframeUnit = date.addHours;
            if (args.start && args.end) totalTime = date.subtract(end - start).toHours();
        } else if (timeframeUnit == 'd') {
            queryInterval = '1d';
            addTimeframeUnit = date.addDays;
            if (args.start && args.end) totalTime = date.subtract(end - start).toDays();
        } else if (timeframeUnit == 'w') {
            queryInterval = '1w';
            addTimeframeUnit = date.addDays;
            timeframeNum = timeframeNum * 7;
            if (args.start && args.end) totalTime = date.subtract(end - start).toDays();
        } else if (timeframeUnit == 'M') {
            queryInterval = '1M';
            addTimeframeUnit = date.addMonths;
            // Candles returned might not be in exact range because of different month sizes
            if (args.start && args.end) totalTime = date.subtract(end - start).toDays();
            timeframeNum = timeframeNum * 30;
        }

        let chunkLength = totalTime / chunkCount; // Ex. 6mins

        let end = args.end ?? new Date((new Date()).setSeconds(0));
        let start = args.start ?? addTimeframeUnit(end, -totalTime);
        end = addTimeframeUnit(start, chunkLength);

        let promises = [];
        for (let i = 0; i < chunkCount; i++) {
            promise = context.prisma.assetvalue.findMany({
                where: {
                    AND: [
                        { symbol: args.symbol },
                        { interval: queryInterval },
                        { openTime: { gte: start } },
                        { openTime: { lt: end } }
                    ]
                },
                orderBy: { openTime: 'asc' }
            });
            promises.push(promise);

            start = end;
            end = addTimeframeUnit(start, chunkLength);
        }

        let assetValues = [];
        await Promise.all(promises).then(values => assetValues = values.flat());
        assetValues = assetValues.sort((a, b) => b.datetime - a.datetime);

        let openTime = new Date(assetValues[0].openTime.toJSON());
        let closeTime = date.addSeconds(addTimeframeUnit(openTime, timeframeNum), -1);
        let open = assetValues[0].open;

        let bar = { openTime, open, high: open, low: undefined, close: 0, volume: 0, closeTime };
        bars.push(bar);

        assetValues.forEach(av => {
            if (av.openTime < closeTime) {
                bar.high = (bar.high < av.high) ? av.high : bar.high
                bar.low = (!bar.low || bar.low > av.low) ? av.low : bar.low
                bar.close = av.close
                bar.volume += av.volume;
            } else {
                openTime = addTimeframeUnit(openTime, timeframeNum);
                closeTime = date.addSeconds(addTimeframeUnit(openTime, timeframeNum), -1);

                bar = { openTime, open: av.open, high: av.high, low: av.low, close: av.close, volume: av.volume, closeTime };
                bars.push(bar);
            }
        });

        console.log(`Retrieved ${args.symbol} bars for ${args.interval} interval`);
    }

    // technicalAnalysisService.pivotPoints(bars, args, context);
    technicalAnalysisService.getAverageTrueRange(bars);

    return bars;
}

async function bars2(parent, args, context, info) {

    let periodCount = args.periods ?? 30;
    let interval = args.interval ?? '1m';

    let timeframeNum = interval.slice(0, -1);
    let timeframeUnit = interval.slice(-1);

    let queryInterval =  `1${timeframeUnit}`;

    let assetValues = await context.prisma.assetvalue.findMany({
        where: {
            AND: [
                { openTime: { gte: new Date(args.start) }},
                { openTime: { lte: new Date(args.end) }},
                { symbol: args.symbol },
                { interval: queryInterval }
            ]
        },
        orderBy: { openTime: 'asc' },
        take: periodCount
    });
    
    assetValues.forEach(value => {
        value.datetime = (new Date(value.openTime)).toJSON();
    });

    if (['1m', '1h', '1d'].includes(args.interval)) {
        return assetValues;
    } else {
        let addTimeframeUnit = undefined;
        if (timeframeUnit == 'm') {
            addTimeframeUnit = date.addMinutes;
        } else if (timeframeUnit == 'h') {
            addTimeframeUnit = date.addHours;
        } else if (timeframeUnit == 'd') {
            addTimeframeUnit = date.addDays;
        } else if (timeframeUnit == 'w') {
            addTimeframeUnit = date.addDays;
            timeframeNum = timeframeNum * 7;
        } else if (timeframeUnit == 'M') {
            addTimeframeUnit = date.addMonths;
            timeframeNum = timeframeNum * 30;
        }

        let bars = [];
        let openTime = new Date(assetValues[0].openTime.toJSON());
        let closeTime = date.addSeconds(addTimeframeUnit(openTime, timeframeNum), -1);
        let open = assetValues[0].open;

        let bar = { datetime: (new Date(openTime)).toJSON(), openTime, open, high: open, low: undefined, close: 0, volume: 0, closeTime };
        bars.push(bar);

        assetValues.forEach(av => {
            if (av.openTime < closeTime) {
                bar.high = (bar.high < av.high) ? av.high : bar.high
                bar.low = (!bar.low || bar.low > av.low) ? av.low : bar.low
                bar.close = av.close
                bar.volume += av.volume;
            } else {
                openTime = addTimeframeUnit(openTime, timeframeNum);
                closeTime = date.addSeconds(addTimeframeUnit(openTime, timeframeNum), -1);

                bar = { datetime: (new Date(openTime)).toJSON(), openTime, open: av.open, high: av.high, low: av.low, close: av.close, volume: av.volume, closeTime };
                bars.push(bar);
            }
        });

        console.log(`Retrieved ${args.symbol} bars for ${args.interval} interval`);

        return bars;
    }
}
  
module.exports = {
    bars,
}