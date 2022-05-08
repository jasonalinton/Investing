const assetValueDAO = require('../../data/asset/assetValueDAO');
const talib = require('talib');
const { timezoneTimestamp, toString } = require('../../utility/timeUtility');
// // load the module and display its version
// console.log("TALib Version: " + talib.version);

class Bar {
    bar;

    constructor(bar) {
        this.bar = bar;
    }

    get price() {
        return this.bar.close;
    }
}

class TAService {
    pivotPoints(bars, args, context) {
        setTimeout(() => {
            let supports = [];
            let resistances = [];
            let levels = [];

            // let lengths = [];
            // let total = 0;

            // bars.forEach(bar => lengths.push(bar.high - bar.low));
            let lengths = bars.map(bar => bar.high - bar.low);
            let avBarLength = lengths.reduce((a, b) => a + b) / lengths.length;

    
            for (let i = 0; i < bars.length - 5; i++) {
                let _bars = bars.slice(i, i+5);
                let marker = _bars[2];
                let price = marker.low;

                let isSupport = this.isSupport(_bars);
                if (isSupport) {
                    if (!supports.some(x => Math.abs(x - price) < avBarLength)) {
                        
                        supports.push(price);
                        levels.push(marker);
                        this.publishHighLow(_bars[2], 'support', args, context);
                    }
                }
    
                let isResistance = this.isResistance(_bars);
                if (isResistance && !resistances.includes(x => price < x + avBarLength && price > x - avBarLength)) {
                    resistances.push(price);
                    levels.push(marker);
                    this.publishHighLow(_bars[2], 'resistance', args, context);
                }
            }
            return levels;
        })
    }

    isSupport(bars) {
        if (bars[0].low > bars[1].low &&
            bars[1].low > bars[2].low &&
            bars[2].low < bars[3].low &&
            bars[3].low < bars[4].low)
            return true
        else
            return false
    }

    isResistance(bars) {
        if (bars[0].high < bars[1].high &&
            bars[1].high < bars[2].high &&
            bars[2].high > bars[3].high &&
            bars[3].high > bars[4].high)
            return true
        else
            return false
    }

    async highsAndLows(bars, args, context) {
        setTimeout(() => {
            let last = new Bar(bars[0]);
            let high = new Bar(bars[0]);
            let low = new Bar(bars[0]);
    
            let highs = [{id: high.id, close: high.close, datetime: toString(new Date(high.openTime))}];
            let lows = [{id: low.id, close: low.close, datetime: toString(new Date(low.openTime))}];
    
            let support = low;
            let resistance = high;
            let impulsive;
            let supports = [];
            let resistances = [];
            let impulsives = [];
    
            let downCount = 0;
            let upCount = 0;
    
            /* Determine trend */
            let trend;
            let i = 0;
            while (i >= 0) {
                if (bars[i].close < bars[i+1].close) {
                    trend = "up";
                    // high = bars[i].close;
                    i = -1;
                } else if (bars[i].close > bars[i+1].close) {
                    trend = "down"
                    // low = bars[i].close;
                    i = -1;
                } else if (bars[i].close == bars[i+1].close) {
                    i++;
                }
            }

            // for (let j = 0; j < bars.length; j++) {
            bars.forEach(_bar => {
                let bar = new Bar(_bar);
                // this.publishHighLow(bar.bar, 'index', args, context)

                if (trend == 'up') {
                    if (bar.price > last.price) {
                        downCount = 0;
                        upCount++;
                        if (bar.price < support.price * 1.02 && bar.price > low.price * 1.02) {
                            resistance = bar;
                            trend = "down";
                            high = bar;
                            impulsives.push(impulsive.bar);
                            // this.publishHighLow(bar.bar, 'high', args, context);
                        } else if (bar.price > high.price) {
                            high = bar;
                        }
                    } else if (bar.price < last.price) {
                        upCount = 0;
                        downCount++;
                        if (bar.price < support.price * 1.02) {
                            impulsive = bar;
                            // this.publishHighLow(bar.bar, 'impulsive', args, context);
                        } else {
                            if (bar.price < high.price * 1.02) {
                                supports.push(support.bar);
                                support = bar;
                                highs.push(high.bar);
                                low = bar;
                                // this.publishHighLow(bar.bar, 'low', args, context)
                            } else if (bar.price < low.price) {
                                low = bar;
                            }
                        }
                    }
                } else if (trend == 'down') {
                    if (bar.price < last.price) {
                        upCount = 0;
                        downCount++;
                        if (bar.price > resistance.price * 1.02 && bar.price < high.price * 1.02) {
                            support = bar;
                            trend = "up";
                            low = bar;
                            impulsives.push(impulsive.bar);
                            // this.publishHighLow(bar.bar, 'low', args, context)
                        } else if (bar.price < low.price) {
                            low = bar;
                        }
                    } else if (bar.price > last.price) {
                        downCount = 0;
                        upCount++;
                        if (bar.price > resistance.price * 1.02) { // beat resistance
                            impulsive = bar;
                            // this.publishHighLow(bar.bar, "impulsive", args, context)
                        } else {
                            if (bar.price > low.price * 1.02) {
                                resistances.push(resistance.bar);
                                resistance = bar;
                                lows.push(low.bar);
                                high = bar;
                                // this.publishHighLow(bar.bar, "high", args, context)
                            } else if (bar.price > high.price) {
                                high = bar;
                            }
                        }
                    }
                }
                
                last = bar;
            });
    
            return { highs, lows };
        })
    }

    async publishHighLow(bar, type, args, context) {
        // setTimeout(() => {
            let marker = {
                bar: { 
                    ...bar,
                    datetime: toString(new Date(bar.openTime))
                },
                type
            }
            context.pubsub.publish('HIGHLOW_ADDED', { ...args, highLowAdded: marker });
        // })
    }

    // async highsAndLows(bars, args, context) {
    //     setTimeout(() => {
    //         let last = bars[0].close;
    //         let high = bars[0];
    //         let low = bars[0];
    
    //         let highs = [{id: high.id, close: high.close, datetime: toString(new Date(high.openTime))}];
    //         let lows = [{id: low.id, close: low.close, datetime: toString(new Date(low.openTime))}];
    
    //         let impulsive;
    //         let impulsives = [];
    
    //         let downCount = 0;
    //         let upCount = 0;
    
    //         /* Determine trend */
    //         let trend;
    //         let i = 0;
    //         while (i >= 0) {
    //             if (bars[i].close < bars[i+1].close) {
    //                 trend = "up";
    //                 // high = bars[i].close;
    //                 i = -1;
    //             } else if (bars[i].close > bars[i+1].close) {
    //                 trend = "down"
    //                 // low = bars[i].close;
    //                 i = -1;
    //             } else if (bars[i].close == bars[i+1].close) {
    //                 i++;
    //             }
    //         }
    
    //         bars.forEach(bar => {
    //             if (trend == 'up') {
    //                 if (bar.close > last) {
    //                     downCount = 0;
    //                     upCount++;
    //                     high = (bar.close > high.close) ? bar : high;
    //                     if (bar.close > highs[highs.length-1].close && !impulsive) {
    //                         impulsive = {id: bar.id, close: bar.close, datetime: toString(new Date(bar.openTime))};
    //                         impulsives.push(impulsive);
    //                     }
    //                     if (upCount >= 3 && low.close > lows[lows.length-1].close) {
    //                         lows.push({id: low.id, close: low.close, datetime: toString(new Date(low.openTime))})
    //                         this.publishHighLow(low, args, context);
    //                     }
    //                 } else if (bar.close < last) {
    //                     upCount = 0;
    //                     downCount++;
    //                     if (bar.close < lows[lows.length-1].close) {
    //                         trend = 'down'; // There's a lower low, so trend changes
    //                         impulsive = null;
    //                         low = bar; // Trend changed so there is a new low
    //                         highs.push({id: bar.id, close: high.close, datetime: toString(new Date(high.openTime))}); // Trend changed so high is locked in
    //                         this.publishHighLow(high, args, context);
    //                     }
    //                     if (downCount >= 3) {
    //                         if (high.close > highs[highs.length-1].close) {
    //                             highs.push({id: high.id, close: high.close, datetime: toString(new Date(high.openTime))});
    //                             low = bar;
    //                             this.publishHighLow(high, args, context);
    //                         }
    //                         if (bar.close < low.close)
    //                             low = bar;
    //                     }
    //                 }
    //             } else if (trend == 'down') {
    //                 if (bar.close < last) {
    //                     upCount = 0;
    //                     downCount++;
    //                     low = (bar.close < low.close) ? bar : low;
    //                     if (bar.close < lows[lows.length-1].close && !impulsive) {
    //                         impulsive = {id: bar.id, close: bar.close, datetime: toString(new Date(bar.openTime))};
    //                         impulsives.push(impulsive);
    //                     }
    //                 } else if (bar.close > last) {
    //                     if (bar.close > highs[highs.length-1].close) {
    //                         trend = 'up'; // There's a higher high, so trend changes
    //                         impulsive = null;
    //                         high = bar; // Trend changed so there is a new high
    //                         lows.push({id: bar.id, close: low.close,  datetime: toString(new Date(low.openTime))}); // Trend changed so low is locked in
    //                         this.publishHighLow(low, args, context);
    //                     }
    //                     if (upCount >= 3) {
    //                         if (low.close < lows[lows.length-1].close) {
    //                             lows.push({id: low.id, close: low.close, datetime: toString(new Date(low.openTime))});
    //                             high = bar;
    //                             this.publishHighLow(low, args, context);
    //                         }
    //                         if (bar.close > high.close)
    //                             high = bar;
    //                     }
    //                 }
    //             }
                
    //             last = bar.close;
    //         });
    
    //         return { highs, lows };
    //     }, 10000)
        
    // }

    // highsAndLows(bars) {
    //     let last = bars[0].close;
    //     let high = bars[0];
    //     let low = bars[0];

    //     let highs = [];
    //     let lows = [];

    //     let downCount = 0;
    //     let upCount = 0;

    //     /* Determine trend */
    //     let trend;
    //     let i = 0;
    //     while (i >= 0) {
    //         if (bars[i].close < bars[i+1].close) {
    //             trend = "up";
    //             // high = bars[i].close;
    //             i = -1;
    //         } else if (bars[i].close > bars[i+1].close) {
    //             trend = "down"
    //             // low = bars[i].close;
    //             i = -1;
    //         } else if (bars[i].close == bars[i+1].close) {
    //             i++;
    //         }
    //     }

    //     bars.forEach(bar => {
    //         if (trend == 'up') {
    //             if (bar.close > last) {
    //                 high = (bar.close > high.close) ? bar : high;
    //             } else if (bar.close < last) {
    //                 if (bar.close < low.close) {
    //                     trend = 'down'; // There's a lower low, so trend changes
    //                     low = bar; // Trend changed so there is a new low
    //                     highs.push({id: bar.id, datetime: toString(new Date(high.openTime))}); // Trend changed so high is locked in
    //                 }
    //             }
    //         } else if (trend == 'down') {
    //             if (bar.close < last) {
    //                 low = (bar.close < low.close) ? bar : low;
    //             } else if (bar.close > last) {
    //                 if (bar.close > high.close) {
    //                     trend = 'up'; // There's a higher high, so trend changes
    //                     high = bar; // Trend changed so there is a new high
    //                     lows.push({id: bar.id, datetime: toString(new Date(low.openTime))}); // Trend changed so low is locked in
    //                 }
    //             }
    //         }
            
    //         last = bar.close;
    //     });

    //     return { highs, lows };
    // }

    thirthEightPointTwo(bars) {
        let hammers = [];
        bars.forEach(bar => {
            let range = Math.abs(bar.high - bar.low);

            let close = bar.close - bar.low;
            let closePercent = close / range;

            let open = bar.open - bar.low;
            let openPercent = open / range;

            if (closePercent > .618 && openPercent > .618) {
                hammers.push({
                    id: bar.id,
                    datetime: toString(new Date(bar.openTime)),
                    direction: 'up'
                });
                // hammers[hammers.length - 1].direction = 'up';
                console.log(`Hammer ${bar.id} open-${bar.open} close ${bar.close} ${bar.datetime}`);
            } else if (closePercent < .382 && openPercent < .382) {
                hammers.push({
                    id: bar.id,
                    datetime: toString(new Date(bar.openTime)),
                    direction: 'down'
                });
                // hammers[hammers.length - 1].direction = 'down';
                console.log(`Inverted Hammer ${bar.id} open-${bar.open} close ${bar.close} ${bar.datetime}`);
            }
        });
        return hammers;
    }

    // async highsAndLows() {
    //     assetValueDAO.bars('ADA', '1h', 300)
    //         .then(response => {
    //             let first = bars[0].close;
    //             let high = bars[0].close;
    //             let low = bars[0].close;
    //             let last = bars[0].close;

    //             let highs = [];
    //             let lows = [];

    //             /* Determine trend */
    //             let trend;
    //             let i = 0;
    //             while (i >= 0) {
    //                 if (bars[i] < bar[i+1]) {
    //                     trend = "up";
    //                     i = -1;
    //                 } else if (bars[i] > bar[i+1]) {
    //                     trend = "down"
    //                     i = -1;
    //                 } else if (bars[i] == bar[i+1]) {
    //                     i++;
    //                 }
    //             }

    //             response.forEach(bar => {
    //                 // Find high
    //                 if (bar.close > bar.last) {

    //                 }

    //                 if (bar.close > high)
    //                     high = bar.close;
    //                 else if (bar.low) {

    //                 }
                    
    //                 last = bar.close;
    //             })
    //         });
    // }

    // async thirthEightPointTwo() {
    //     assetValueDAO.bars('ADA', '1h', 300)
    //         .then(response => {
    //             response.forEach(bar => {
    //                 let range = Math.abs(bar.high - bar.low);

    //                 let close = bar.close - bar.low;
    //                 let closePercent = close / range;

    //                 let open = bar.open - bar.low;
    //                 let openPercent = open / range;

    //                 if (closePercent > .618 && openPercent > .618) {
    //                     console.log(`${bar.id} open-${bar.open} close ${bar.close} ${bar.datetime}`)
    //                 }
    //             })
    //         });
    // }

    async getMorningStar() {
        let bars = { };
        let candles = [];
    
        assetValueDAO.bars('ADA', '1h', 300)
            .then(response => {
                candles = response;
                candles.forEach(candle => candle.datetime = new Date(Number(candle.openTime)));
                
                bars.open = candles.map(candle => candle.open);
                bars.high = candles.map(candle => candle.high);
                bars.low = candles.map(candle => candle.low);
                bars.close = candles.map(candle => candle.high);
                
                let open = candles.map(candle => candle.open);
                let high = candles.map(candle => candle.high);
                let low = candles.map(candle => candle.low);
                let close = candles.map(candle => candle.high);
                
                // let indicator = "CDLHAMMER";
                // let indicator = "CDLINVERTEDHAMMER";
                // let indicator = "CDLMORNINGSTAR";
                // let indicator = "MINMAXINDEX";
                // let indicator = "CDLENGULFING";
                let indicator = "ADX";
        
                var function_desc = talib.explain(indicator);
                console.dir(function_desc);
        
                //let hi = talib.CDLMORNINGSTAR(open, high, low, close, 0);
        
        
                talib.execute({
                    name: indicator,
                    startIdx: 0,
                    endIdx: bars.close.length - 1,
                    penetration: 0,
                    open: bars.open,
                    high: bars.high,
                    low: bars.low,
                    close: bars.close,
                    // optInPenetration: 0,
                    optInTimePeriod: 14
                }, function (err, result) {
                    if (!err) {
                        console.log(`${indicator} Function Results:`);
                        console.log(result);
                        let res = result.result.outInteger
                        for (let i = 0; i < res.length; i++) {
                            // if (res[i] == '100')
                                console.log(`${candles[i].id} open-${candles[i].open} close ${candles[i].close} ${candles[i].datetime}     ${res[i]}`)
                        }
                        console.log(``);
                    } else {
                        console.log(err);
                    }
                });
            }, this.logErrors)
            .catch(this.logErrors);
    }

    async getAverageTrueRange(candles) {
        let bars = { };
    
        candles.forEach(candle => candle.datetime = new Date(Number(candle.openTime)));
        
        bars.open = candles.map(candle => candle.open);
        bars.high = candles.map(candle => candle.high);
        bars.low = candles.map(candle => candle.low);
        bars.close = candles.map(candle => candle.high);

        let indicator = "ATR";

        var function_desc = talib.explain(indicator);
        console.dir(function_desc);

        //let hi = talib.CDLMORNINGSTAR(open, high, low, close, 0);


        talib.execute({
            name: indicator,
            startIdx: 0,
            endIdx: bars.close.length - 1,
            penetration: 0,
            open: bars.open,
            high: bars.high,
            low: bars.low,
            close: bars.close,
            // optInPenetration: 0,
            optInTimePeriod: 14
        }, function (err, result) {
            if (!err) {
                console.log(`${indicator} Function Results:`);
                console.log(result);
                let res = result.result.outReal
                for (let i = 0; i < res.length; i++) {
                    console.log(`${res[i]}`)
                }
                console.log(``);
            } else {
                console.log(err);
            }
        });
    }

    logErrors(err) {
        err.response.data.errors.forEach(error => {
            console.error(error.message);
        })
    }
}


// Display all available indicator function names
// var functions = talib.functions;
// for (i in functions) {
// 	console.log(functions[i].name);
// }

let taService = new TAService();

module.exports = taService;

