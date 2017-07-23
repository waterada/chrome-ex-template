/**
 * @param path - テストで使う message.json のパス (例: "../src/_locales/ja/messages.json")
 */
chrome.initLocaleMessages = function (path) {
    chrome.i18n = {};
    chrome.i18n.__msg = {};
    $.getJSON(path, {}, function (data) {
        chrome.i18n.__msg = data;
    });
    chrome.i18n.getMessage = key => chrome.i18n.__msg[key].message;
};

chrome.storage = {};
chrome.storage.local = {};
chrome.storage.local.get = function (key, callback) {
    let data = JSON.parse(sessionStorage.getItem(key));
    let base = {};
    base[key] = data;
    callback(base);
};
chrome.storage.local.set = function (base, afterSave) {
    for (let key of Object.keys(base)) {
        sessionStorage.setItem(key, JSON.stringify(base[key]));
        console.log('[storage-save] %s : %o', key, base[key]);
    }
    if (afterSave) afterSave();
};
chrome.storage.local.remove = function (key, afterSave) {
    sessionStorage.removeItem(key);
    if (afterSave) afterSave();
};

function example(testId, callback) {
    $(function () {
        let $test = $(`#${testId}`);
        let params = ChEx.urlParams();
        let text;
        if (callback) {
            let on = (params.on === '1' && params['#'] === testId);
            params.on = (on ? '0' : '1');
            params.test = testId;
            if (on) callback($test);
            text = `拡張を${on ? '無' : '有'}効化`;
        } else {
            delete params.on;
            delete params.test;
            text = 'リンク';
        }
        params['#'] = testId;
        $test.find('h2').append(
            $(`<a href="${ChEx.makeUrl(params)}">${text}</a>`).css({
                marginLeft: '20px',
                fontSize: 'smaller',
                fontWeight: 'normal'
            })
        );
    });
}

let __error = null;
ChEx.error = function (msg) {
    __error = msg;
};


function unitTest($appendTo, callback) {
    let $parent = $('<ul></ul>');
    $appendTo.append(
        $('<pre></pre>').append(
            $parent
        )
    );
    const test = (title, callback) => {
        let $result;
        let $case = $(`<li style="color: red;"></li>`).append(
            ChEx.h(title),
            ' ... ',
            $result = $('<span></span>')
        );
        $parent.append($case);
        let $sandbox = $('<div></div>').appendTo($case).hide();
        const assert = (actual, expected) => {
            if (actual === expected) {
                $case.css('color', 'green');
                $result.text('OK');
            } else {
                $result.text(`Error! Expected '${expected}', but '${actual}'`);
            }
            $sandbox.remove();
        };
        try {
            callback(assert, $sandbox);
        } catch (e) {
            $result.text(e.message);
            $sandbox.remove();
        }
    };
    callback(test);
}

