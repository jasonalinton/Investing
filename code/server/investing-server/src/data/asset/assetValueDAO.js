const date = require('date-and-time');
const { formatDate, addMinute } = require('../../utility/timeUtility');

class AssetValueDAO {
    prisma;

    initialize(prisma) {
        this.prisma = prisma;
    }

    async bars(symbol, interval, periods, start, end) {

        let periodCount = periods ?? 30;
        let chunkCount = 20;

        let bars = [];
        if (['1m', '1h', '1d'].includes(interval)) {
            bars = await this.prisma.assetvalue.findMany({
                where: {
                    AND: [
                        { symbol: symbol },
                        { interval: interval }
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
    
            interval = interval ?? '1m';
            let queryInterval = undefined;
        
            let timeframeNum = interval.slice(0, -1);
            let timeframeUnit = interval.slice(-1);
        
            let totalTime = timeframeNum * periodCount;;
            let addTimeframeUnit = undefined;
            if (timeframeUnit == 'm') {
                queryInterval = '1m';
                addTimeframeUnit = date.addMinutes;
                if (start && end) totalTime = date.subtract(end - start).toMinutes();
            } else if (timeframeUnit == 'h') {
                queryInterval = '1h';
                addTimeframeUnit = date.addHours;
                if (start && end) totalTime = date.subtract(end - start).toHours();
            } else if (timeframeUnit == 'd') {
                queryInterval = '1d';
                addTimeframeUnit = date.addDays;
                if (start && end) totalTime = date.subtract(end - start).toDays();
            } else if (timeframeUnit == 'w') {
                queryInterval = '1w';
                addTimeframeUnit = date.addDays;
                timeframeNum = timeframeNum * 7;
                if (start && end) totalTime = date.subtract(end - start).toDays();
            } else if (timeframeUnit == 'M') {
                queryInterval = '1M';
                addTimeframeUnit = date.addMonths;
                // Candles returned might not be in exact range because of different month sizes
                if (start && end) totalTime = date.subtract(end - start).toDays();
                timeframeNum = timeframeNum * 30;
            }
        
            let chunkLength = totalTime / chunkCount; // Ex. 6mins
        
            end = end ?? new Date((new Date()).setSeconds(0));
            start = start ?? addTimeframeUnit(end, -totalTime);
            end = addTimeframeUnit(start, chunkLength);
        
            let promises = [];
            for (let i = 0; i < chunkCount; i++) {
                promise = this.prisma.assetvalue.findMany({
                    where: {
                        AND: [
                            { symbol: symbol },
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
        
            console.log(`Retrieved ${symbol} bars for ${interval} interval`);
        }

        return bars;
    }

    async getLastSavedTime(baseAsset, quoteAsset, interval) {
        let assetValue = await this.prisma.assetvalue.findFirst({
            select: { openTime: true },
            where: { 
                assetpair: {
                    baseAsset: {  is: { symbol: baseAsset } },
                    quoteAsset: { is: { symbol: quoteAsset } },
                },
                interval
            },
            orderBy: { openTime: "desc" }
        });

        let lastTime;
        
        if (assetValue) {
            lastTime = new Date(assetValue.openTime);
        } else {
            /* Subtract an interval because it will get incremented an interval when getting new values */
            if (interval == '1m') {
                lastTime = new Date(2021, 11, 31, 23, 59, 0);
            } else if (interval == '1h') {
                lastTime = new Date(2020, 11, 31, 23, 0, 0);
            } else if (interval == '1d') {
                lastTime = new Date(2016, 11, 30, 0, 0, 0);
            } else if (interval == '1w') {
                lastTime = new Date(2016, 11, 25, 0, 0, 0);
            } else if (interval == '1M') {
                lastTime = new Date(2016, 11, 1, 0, 0, 0);
            }
            
            let timezoneOffset = lastTime.getTimezoneOffset();
            lastTime = addMinute(lastTime, -1 * timezoneOffset);
        }
        console.log(`${baseAsset} history last saved on ${formatDate(lastTime)} for ${interval} interval`);
        return lastTime.toJSON();
    }

    /* Get assets whose values are recorded */
    async getTrackedAssets() {
        let assets = await this.prisma.assetpair.findMany({
            where: { 
                quoteAsset: { is: { symbol: 'USD' } },
            },
            include: {
                baseAsset: {
                    select: { 
                        id: true,
                        symbol: true
                    }
                },
                quoteAsset: {
                    select: { 
                        id: true,
                        symbol: true
                    }
                },
            }
        });

        return assets;
    }

    /* Get assets whose values are recorded */
    async addAssetValue(bar) {
        let assetPair = await this.prisma.assetpair.findFirst({
            where: { 
                AND: [
                    {
                        baseAsset: {
                            is: { symbol: bar.baseAsset }
                        },
                        quoteAsset: {
                            is: { symbol: bar.quoteAsset }
                        },
                    }
                ]
            },
            include: {
                baseAsset: true,
                quoteAsset: true
            }
        });

        // let dateUTC = toUTC(bar.openTime);
        // let dateUTC = bar.openTime.toUTCString();

        let av = await this.prisma.assetvalue.create({
            data: {
                text: bar.text,
                symbol: bar.symbol,
                interval: bar.interval,
                openTime: bar.openTime,
                open: bar.open,
                high: bar.high,
                low: bar.low,
                close: bar.close,
                closeTime: bar.closeTime,
                volume: bar.volume,
                numberOfTrades: bar.numberOfTrades,
                assetpair: { connect: { id: assetPair.id } }
            },
        });

        // context.pubsub.publish('BAR_ADDED', { barAdded: av });

        if (av.id % 100 == 0)
            console.log(`Added ${bar.symbol}:${av.id} AssetValue-${bar.interval}: ${formatDate(av.openTime)} - $${av.open}`);

        return av;
    }
}

let assetValueDAO = new AssetValueDAO();
module.exports = assetValueDAO;