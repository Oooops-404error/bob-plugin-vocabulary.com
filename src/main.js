/**
 * 由于各大服务商的语言代码都不大一样，
 * 所以我定义了一份 Bob 专用的语言代码，以便 Bob 主程序和插件之间互传语种。
 * Bob 语言代码列表 https://ripperhe.gitee.io/bob/#/plugin/addtion/language
 * 
 * 转换的代码建议以下面的方式实现，
 * `xxx` 代表服务商特有的语言代码，请替换为真实的，
 * 具体支持的语种数量请根据实际情况而定。
 * 
 * Bob 语言代码转服务商语言代码(以为 'zh-Hans' 为例): var lang = langMap.get('zh-Hans');
 * 服务商语言代码转 Bob 语言代码: var standardLang = langMapReverse.get('xxx');
 */

var items = [
    ['en', 'en'],
];

var langMap = new Map(items);
var langMapReverse = new Map(items.map(([standardLang, lang]) => [lang, standardLang]));

function supportLanguages() {
    return ["en"];
}

function getParts(data) {
    return []
}

function getExchanges(data) {
    return[]
}

function parseResult(query, data) {
    const match = data.match(/We couldn't find any matches for/);
    if (match) {
        query.onCompletion({
            error: {
                type: "notFound",
                message: "No results found",
            },
        });
    }else {
        return{
            word: "word",
            phonetics: getPhonetics(data),
            parts: getParts(data),
            exchanges: getExchanges(data)
        }
    }
}

function getPhonetics(data){
    const match = [...data.match(/<span style="white-space:nowrap;"><h3>(.*?)<\/h3>/g)];
    if (match) {
        return [
            {
                type: "us",
                value: match[0][1],
            },
            {
                type: "uk",
                value: match[1][1],
            },
        ]
    }
    return [{type: "us", value: "None"}, {type: "uk", value: "None"}];
}

function translate(query) {
    if (!(query.detectTo === "en")) {
        query.onCompletion({
            error: {
                type: "unsupportedLanguage",
                message: "This language is not supported",
            },
        });
    }else{
        const apiUrl = `https://www.vocabulary.com/dictionary/definition.ajax?search=${query.text}&lang=en`;
        $http.request({
            method: "GET",
            url: apiUrl,
            handler: function(resp) {
                const dict = parseResult(query, resp.data);
                query.onCompletion({
                    result: {
                        from: query.detectFrom,
                        to: query.detectTo,
                        toDict: dict
                    },
                });
            }
        });
    }
}
