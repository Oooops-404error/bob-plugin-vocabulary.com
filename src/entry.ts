import { load, CheerioAPI } from 'cheerio';
import { api } from "@bob-plug/core";

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
        api.$http.get({
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

function getPhonetics($: CheerioAPI, word: string) {
    const usPhonetics = $('body > div > div > div.definitionsContainer > div.definition-columns > div.col-1 > div:nth-child(4) > div.videos > div:nth-child(1) > span').text()
    const ukPhonetics = $('body > div > div > div.definitionsContainer > div.definition-columns > div.col-1 > div:nth-child(4) > div.videos > div:nth-child(2) > span').text()
    return [
        {
            type: "us",
            value: usPhonetics,
            tts: {
                type: "url",
                value: ttsSelector("us", word) // TTS URL for US pronunciation
            },
        },
        {
            type: "uk",
            value: ukPhonetics,
            tts: {
                type: "url",
                value: ttsSelector("uk", word) // TTS URL for UK pronunciation
            },
        },
    ]

}

function ttsSelector(type: string, word: string) {
    const source = api.getOption("ttsType");
    if (type == "us") {
        switch (source) {
            case "google":
                return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${word}}`;
            case "youDao":
                return `https://dict.youdao.com/dictvoice?audio=${word}&type=2`;
            default:
                return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${word}}`;
        }
    }else if (type == "uk"){
        switch (source) {
            case "google":
                return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-uk&q=${word}`;
            case "youDao":
                return `https://dict.youdao.com/dictvoice?audio=${word}&type=1`;
            default:
                return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-uk&q=${word}`;
        }
    }
}

function parseResult(query, data) {
    const $ = load(data);
    const word = query.text; // Assuming this is the word you're querying
    if ($('.wordnotfound-wrapper').length > 0) {
        query.onCompletion({
            error: {
                type: "notFound",
                message: `words are illegal`,
            },
        });
    } else {
        return {
            word: word,
            phonetics: getPhonetics($, word),
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