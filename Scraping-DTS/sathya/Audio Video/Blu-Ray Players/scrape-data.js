var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var jsonfile = require('jsonfile');

var START_URL = 'https://www.sathya.in/blu-ray-players';

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = jsonfile.readFileSync('blue-links.json');
var pagesUrls = [];
var numItems = 0;
var allData = [];
const urll = new URL(START_URL);
const baseUrl = urll.protocol + "//" + urll.hostname;
//pagesToVisit = ["https://www.sathya.in/intex-43-led-g4301-fhd-3"];

function crawl() {
    if (pagesToVisit.length <= 0) {
        console.log(`visited all pages. ${numItems} items scraped and saved`);

        return;
    }
    var nextPage = pagesToVisit.shift();
    console.log(`<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>> left with ${pagesToVisit.length} pages to visit`)
    if (nextPage in pagesVisited) {
        // We've already visited this page, so repeat the crawl
        crawl();
    } else {
        // New page we haven't visited
        if (nextPage == null) {
            return;
        }
        numPagesVisited++;
        visitPage(nextPage, crawl);
    }
}

function requestPage(url, callback) {
    var agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36';
    var options = {
        url: url,
        headers: {
            'User-Agent': agent
        }
    };

    return new Promise(function(resolve, reject) {
        // Do async job
        request.get(options, function(err, resp, body) {
            if (err) {
                reject(err);
                callback();
            } else {
                resolve(body);
            }
        })
    })
}

function visitPage(url, callback) {
    // Add page to our set
    pagesVisited[url] = true;
    // Make the request
    console.log("Visiting page " + url);
    var requestPag = requestPage(url, callback);
    requestPag.then(function(body) {
        var $ = cheerio.load(body);
        scrapeItem($, url);
        callback();
    }, function(err) {
        console.log(err);
        callback();
    })
}

function scrapeItem($, url) {
    var item = {}
    var model = $("form#pd-form section aside div.pd-info div.page-title h1").text().trim();
    item.strModel = model;
    model = model.split(" ");
    item.model = model[model.length-1].trim();
    item.price = $("div.pd-offer-price-container div.pd-offer-price div.pd-group div.clearfix div.pd-price-block div.pd-price").text().trim();
    item.description = $("div.more-block section#super-tech div.container p").text();
    /* "table.table.pd-specs-table tbody tr td.pd-spec-name"
     "table.table.pd-specs-table tbody tr td.pd-spec-value"*/
    $("table.table.pd-specs-table tbody tr td.pd-spec-name").each(function(i, ele) {
        var key = $(this).text().trim();
        // console.log(i + "  " + key);
        var value = $(`table.table.pd-specs-table tbody tr td.pd-spec-value`).eq(i).text().trim();
        value = value.split("\n").filter(function(ele) { return ele.trim(); });
        for (var k = 0; k < value.length; k++) {
            value[k] = value[k].trim();
        }
        value = value.join(" ; ")
        item[key] = value;
    });
    item.url=url;
    allData.push(item);
    numItems++;
    console.log(item);
    saveJson('blue-data.json', allData);
}

function saveJson(name, data) {
    jsonfile.writeFile(name, data, { spaces: 2 }, function(err) {
        console.error(err)
    });
}
crawl();