/* 日本郵政が提供する全国市町村データのCSVから市を抽出するコード */

const fs = require("fs")
const path = require("path")
const {parse} = require("csv-parse/sync")
const iconv = require("iconv-lite");

const data_path = path.join(__dirname, "ken_all_data.csv");
// csvをパースする
const rows = parseCSV(data_path);
// 市のみ抽出する
const unique_data = exportCitiesData(rows);
// CSVを出力する
exportCSV(unique_data, "unique_city_data.csv");

/* 抽出した市リストをCSV形式で出力する関数 */
function exportCSV(data, filename) {
    let str_data = "";
    let city_count = {};
    for (const row of data) {
        let csv_row = '"' + row[0] + '",' + '"' + row[1] + '"\r\n';
        // 都道府県別の市の数のカウント
        if(row[0] in city_count) {
            city_count[row[0]] += 1;
        } else {
            city_count[row[0]] = 1;
        }
        //let csv_row = '"' + row + '"\r\n';
        str_data += csv_row;
    }
    let tb = "";
    for (const pref in city_count) {
        tb += pref + " & " + city_count[pref] + " \\\\\r\n";
    }

    fs.writeFileSync(filename, str_data);
    console.info(city_count);
    console.info(tb);
}

/* 読み込んだ全市町村データから市のみを抽出する関数 */
function exportCitiesData(rows) {
    const cities = [];
    const stop_cities = [];
    // 東京都以外の政令指定都市の特別区にマッチ
    const reg1 = /市.*区/;
    // 東京都の特別区，町，村にマッチ
    const reg2 = /(^.*区|.*町$|.*村$)/;
    for (let row of rows) {
        let pref = row[6].toString();
        let city = row[7].toString();
        // 東京都以外の特別区を置換
        city = city.replace(reg1, "市");
        if (reg2.test(city)) {
            // 東京都の特別区，町，村を除去
            console.info("除去: " + pref + ", " + city);
            stop_cities.push(city);
        } else {
            // それ以外を格納
            //cities.push([pref, city])
                cities.push([pref, city]);
        }
    }
    // Set型に変換することで重複を除去
    let cities_set = cities.filter(function (i) {
        if(!this[i[1]]) {
            return this[i[1]] = true;
        }
    })
    //const cities_set = new Set(cities);
    //console.info("市の合計数: " + cities_set.size);
    return cities_set;
}

/* CSVをパースする関数 */
function parseCSV(path) {
    const buffer = fs.readFileSync(data_path);
    const encoded_buffer = encodeUTF8(buffer);
    const options = {escape: '\\'};
    const rows = parse(encoded_buffer, options);
    console.info(typeof rows);
    return rows;
}

/* 読み込んだCSVをUTF-8に変換する */
function encodeUTF8(buffer) {
    const decoded = iconv.decode(buffer,"SJIS");
    return iconv.encode(decoded, "UTF-8");
}
