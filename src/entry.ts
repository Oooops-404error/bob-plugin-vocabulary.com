import * as Bob from "@bob-plug/core";
import { load, CheerioAPI } from 'cheerio';

function translate(query) {
    if (query.detectFrom != "en") {
        query.onCompletion({
            error: {
                type: "unsupportedLanguage",
                message: "This language is not supported",
            },
        });
        return;
    }
    const apiUrl = `https://www.vocabulary.com/dictionary/definition.ajax?search=${query.text}&lang=en`;
    Bob.api.$http.get({
        url: apiUrl,
        handler: (resp) => {
            const dict = parseResult(query, resp.data);
            query.onCompletion({
                result: {
                    toDict: dict
                },
            });
        }
    });

}

function getParts($: CheerioAPI) {
    const results: { part: string; means: string[] }[] = [];
    $('body > div > div > div:first-child > div:first-child > div:first-child > div:nth-child(2) > ol > li').each(function () {
        const div = $(this).find('div').first();
        const divText = div.find("div").text().trim();
        const siblingText = div.contents().filter(function () {
            return this.type === 'text';
        }).text().trim();
        results.push({
            part: divText,
            means: [siblingText]
        });
    });
    return results;
}

function getExchanges($) {
    const forms = $('html > body > div > div > div:first-child > div:first-child >  div:first-child > div:first-child > p:nth-of-type(1) > b').text().trim();
    const words = forms.split(';').map((s: string) => s.trim());
    return [{
        name: "Other forms",
        words: words
    }]
}

function getRelatedWordParts() {
    return [{
        words: [{
            None: "",
        }]
    }]
}

function getAdditions($) {
    const short = $('html > body > div > div > div:first-child > div:first-child >  div:first-child > div:first-child > p:nth-of-type(2)').text().trim();
    const long = $('html > body > div > div > div:first-child > div:first-child >  div:first-child > div:first-child > p:nth-of-type(3)').text().trim();
    return [{
        name: "short explanation",
        value: short
    }, {
        name: "long explanation",
        value: long
    }]
}

function getPhonetics($) {
    const usPhonetics = $('html > body > div > div > div:first-child > div:first-child > div:first-child > div:first-child > div > div:first-child > span > h3').text()
    const ukPhonetics = $('html > body > div > div > div:first-child > div:first-child > div:first-child > div:first-child > div > div:nth-child(2) > span > h3').text()
    return [
        { type: "us", value: usPhonetics, },
        { type: "uk", value: ukPhonetics, },
    ]
}

function parseResult(query, data) {
    const $ = load(data);
    if ($('.wordnotfound-wrapper').length > 0) {
        query.onCompletion({
            error: {
                type: "notFound",
                message: `words are illegal`,
            },
        });
    } else {
        return {
            word: query.text,
            phonetics: getPhonetics($),
            parts: getParts($),
            exchanges: getExchanges($),
            relatedWordParts: getRelatedWordParts(),
            additions: getAdditions($),
        }
    }
}

function supportLanguages() {
    return ['auto', 'en', 'zh-Hans'];
}