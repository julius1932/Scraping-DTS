var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var jsonfile = require('jsonfile');

var START_URL = 'https://www.croma.com/gaming/gaming-consoles/c/63';

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = jsonfile.readFileSync('links.json');
var pagesUrls = [];
var numItems = 0;
var allData = [];
const urll = new URL(START_URL);
const baseUrl = urll.protocol + "//" + urll.hostname;
//pagesToVisit = ["https://www.croma.com/vivo-y17-blue/p/217892"];

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
    item.name_small = $('.product_name_small').text().trim();

    /*item.model = "";
    var r = 
    
    model = model.split(" ");
    for (var k = 0; k < model.length; k++) {
        if (/\d+/.test(model[k].trim()) && /^[a-zA-Z]+/.test(model[k].trim())) {
            item.model = model[k].trim();
            break;
        }
    }*/
    item.price = $(".pdpPrice").text().trim();
    var keyFeatures = [];
    $(".col-xs-6.col-sm-6.col-md-6.col-lg-6 li").each(function(i, ele) {
        var txt = $(this).text().trim();
        console.log("ppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp");
        keyFeatures.push(txt);
    });
    item["Key features"] = keyFeatures.join(" ; ");

    $(".product-classifications .headline").each(function(i, ele) {
        var key = $(this).text().trim();
        // console.log(i + "  " + key);
        var innerItem = {};
        $(".product-classifications ul").eq(i).find("li").each(function() {
            var innerKey = $(this).find(".attrib").text().trim();
            var innerValue = $(this).find(".attribvalue").text().trim();
            innerValue = innerValue.split("\n").filter(function(elmm) { return elmm.trim(); });
            for (var k = 0; k < innerValue.length; k++) {
                innerValue[k] = innerValue[k].trim();
            }
            innerValue = innerValue.join(" ");
            innerItem[innerKey] = innerValue;
        });
        item[key] = innerItem;
    });
    item.category = "consoles gaming";
    item.url = url;
    var description = $(".tab-container.descriptioncheck.pdpDescTabBot").text().trim();
    if (description) {
        description = description.split("\n").filter(function(elmm) { return elmm.trim(); });
        for (var k = 0; k < description.length; k++) {
            description[k] = description[k].trim();
        }
        description = description.join(" ");
    }


    item.description = description;
    allData.push(item);
    numItems++;
    console.log(item);
    saveJson('data.json', allData);
}

function saveJson(name, data) {
    jsonfile.writeFile(name, data, { spaces: 2 }, function(err) {
        console.error(err)
    });
}
crawl();