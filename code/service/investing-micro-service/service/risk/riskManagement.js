import axios from "axios";

// load the module and display its version
// var talib = require('./build/Release/talib');
import talib from 'talib';
console.log("TALib Version: " + talib.version);

// Display all available indicator function names
//talib.functions.forEach(func => console.log(func.name))

let getBars = async (symbol, interval) => {
    interval = interval;
    var data = {
        query: `
        mutation {
            getAssetCandles(symbol: "${symbol}", interval: "${interval}", periods: 360) {
                openTime
                open
                high
                low
                volume
                close
            }
        }
        `
    }
    console.log(data.query);
    return axios.post('http://localhost:4000/graphql', data);
};

let bars = [];
let candles = [];

getBars('ADA', '1h')
    .then(res => {
        candles = res.data.data.getAssetCandles;
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
        let indicator = "CDLMORNINGSTAR";

        var function_desc = talib.explain(indicator);
        console.dir(function_desc);

        var function_desc = talib.explain("CDLMORNINGSTAR");
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
            optInPenetration: 0
        }, function (err, result) {
            if (!err) {
                console.log(`${indicator} Function Results:`);
                console.log(result);
                let res = result.result.outInteger
                for (let i = 0; i < res.length; i++) {
                    console.log(`${candles[i].datetime}     ${res[i]}`)
                }
                console.log(``);
            } else {
                console.log(err);
            }
        });
    }, logErrors)
    .catch(logErrors);

function logErrors(err) {
    err.response.data.errors.forEach(error => {
        console.error(error.message);
    })
}