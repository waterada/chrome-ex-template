const ChEx = {};

/** 通知用基本情報の登録 */
ChEx.__info = {};
ChEx.info = function (pluginName, email, author) {
    ChEx.__info = {pluginName, email, author};
};
/** 問い合わせ先のリンク */
ChEx.inquiryLink = function () {
    return `<a href="mailto:${ChEx.__info.email}?subject=${encodeURIComponent(ChEx.__info.pluginName)}" target="_blank">${ChEx.h(`${ChEx.__info.author} <${ChEx.__info.email}>`)}</a>`;
};

/** エラーを出す。consoleだけだと見落とすのでalertも。 */
ChEx.error = function (msg) {
    console.error(msg);
    alert(msg);
};

/** きっかり１個ヒットしない場合にエラー出す。selector だけだと動かなくなった際に何が欲しかったのかわからなくなるので label も書くこと */
ChEx.findOne = function (selector, label) {
    let $item = $(selector);
    if ($item.length !== 1) {
        ChEx.error(`${selector} (${label}) が ${$item.size()} 個あります。`);
    }
    return $item;
};

/**  findOne(selector) 後、`${selector} ${subSelector}` で再検索する */
ChEx.findOneThen = function (selector, subSelector, label) {
    ChEx.findOne(selector, `${label} のTop`);
    return $(`${selector} ${subSelector}`);
};

/** html escape */
ChEx.h = function (str) {
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/"/g, "&quot;");
    str = str.replace(/'/g, "&#039;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");
    return str;
};

/**
 * ３桁区切り＆パディング＆左右寄せ
 * @param num     - 数値なら３桁区切り。文字列でもいい
 * @param length  - (省略可)この桁数までパディングする。マイナスなら左寄せ
 * @param char    - (省略可)パディングで埋める文字。デフォルトは空白
 * @param decimal - (省略可)表示させたい小数桁
 */
ChEx.padding = function (num, length, char, decimal) {
    if (!num.replace) { //文字列か
        if (decimal) {
            num = num.toLocaleString('ja-JP', { minimumFractionDigits: decimal, maximumFractionDigits: decimal });
        } else {
            num = num.toLocaleString();
        }
    }
    if (length) {
        char = char || ' ';
        if (length > 0) {
            num = char.repeat(length) + num;
            num = num.slice(-length);
        } else {
            num = num + char.repeat(-length);
            num = num.slice(0, -length);
        }
    }
    return num;
};

/** 日付フォーマット。'Y-M-D H:I:S.MS' の形式で指定 */
ChEx.dateFormat = function (date, format) {
    let str = format;
    str = str.replace(/MS/g, () => `00${date.getMilliseconds()}`.slice(-3));
    str = str.replace(/Y/g, () => date.getFullYear());
    str = str.replace(/M/g, () => `0${date.getMonth() + 1}`.slice(-2));
    str = str.replace(/D/g, () => `0${date.getDate()}`.slice(-2));
    str = str.replace(/H/g, () => `0${date.getHours()}`.slice(-2));
    str = str.replace(/I/g, () => `0${date.getMinutes()}`.slice(-2));
    str = str.replace(/S/g, () => `0${date.getSeconds()}`.slice(-2));
    return str;
};

/** DOMの出現を待つ。１秒ずつmax回試行。見つかったらnextを実行 */
ChEx.waitDom = function(selector, label, max, next, _count) {
    let $item = $(selector); //毎回取り直す必要あり
    if ($item.length) {
        next($item);
    } else {
        _count = (_count || 0) + 1;
        if (_count < max) {
            setTimeout(function () {
                ChEx.waitDom(selector, label, max, next, _count);
            }, 1000);
        } else {
            ChEx.error(`${max} 秒待ちましたが ${selector} (${label}) が見つかりませんでした。`);
        }
    }
};

/** リンクが一致したらcallbackを実行。* は [\w%+.-]+ として扱われ、(*) は callback の引数に中味が渡る。** とすると .+? として扱われる */
ChEx.matchUrl = function(condition, callback, _href) {
    let url = _href || location.href;
    condition = condition.replace(/([.?+\/])/g, '\\$1').replace(/\*\*/g, '.+?').replace(/\*/g, '[\\w%+.-]+');
    condition = new RegExp(condition);
    url.replace(condition, (hit, a, b, c, d) => {
        callback(a, b, c, d);
    });
};
ChEx.matchLink = ChEx.matchUrl; //deprecated

/** URLパラメータをマップの形で取得。hashの値も '#' というキーに入る */
ChEx.urlParams = function (_url) {
    _url = _url || location.href;
    let params = {};
    _url.replace(/(?:\?([^#]*))?(?:#(.*))?$/, (hit, search, hash) => {
        if (search) {
            for (let kv of search.split('&')) {
                let k_v = kv.split('=');
                if (k_v.length === 2 && k_v[0]) {
                    let k = decodeURIComponent(k_v[0]);
                    let v = decodeURIComponent(k_v[1]);
                    if (params[k] === undefined) {
                        params[k] = v;
                    } else if ($.isArray(params[k])) {
                        params[k].push(v);
                    } else {
                        params[k] = [params[k], v];
                    }
                }
            }
        }
        params['#'] = (hash || '');
    });
    return params;
};
/** マップの形でURLパラメータを渡すとそれに応じたURLを返す */
ChEx.makeUrl = function (params, _href) {
    let ary = [];
    let hash = '';
    for (let k of Object.keys(params)) {
        let v = params[k];
        if (k === '#') {
            hash = v;
        } else if ($.isArray(v)) {
            for (let _v of v) {
                ary.push(`${encodeURIComponent(k)}=${encodeURIComponent(_v)}`);
            }
        } else {
            ary.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        }
    }
    let url = (_href || location.href).replace(/[?#].*$/, '');
    if (ary.length) url = `${url}?${ary.join('&')}`;
    if (hash) url = `${url}#${hash}`;
    return url;
};

/** URLパラメータが一致したらcallbackを実行 */
ChEx.matchUrlParam = function(condition, callback, _href) {
    let params = ChEx.urlParams(_href);
    if (condition(params)) {
        callback(params);
    }
};

/** パラメータが指定の値ならcallbackを実行し、パラメータを反転させるリンクを返す */
ChEx.toggleUrlParamLink = function(paramKey, paramValue, trueCallback, falseCallback, _href) {
    let params = ChEx.urlParams(_href);
    if (params[paramKey] === paramValue) {
        delete params[paramKey];
        let reverseUrl = ChEx.makeUrl(params, _href);
        trueCallback(reverseUrl);
    } else {
        params[paramKey] = paramValue;
        let reverseUrl = ChEx.makeUrl(params, _href);
        falseCallback(reverseUrl);
    }
};

/**
 * @param {jQuery} opt.$targets - 書き換え可能にする対象
 * @param {string} opt.storageKey - 保存につかうキー
 * @param {function} opt.getId - 保存につかうID
 * @param {function|undefined} opt.rewritableIf - (省略可) 書き換え可能にする条件
 * @param {function|undefined} opt.onChange - (省略可) 書き換えた際に見た目など変えたい場合
 */
ChEx.rewritableTexts = function (opt) {
    //設定済みコメント読み込み
    ChEx.storage.loadLocal(opt.storageKey, {}, texts => {
        opt.$targets.each((i, target) => {
            let $target = $(target);
            let id = opt.getId($target);
            let orig = $target.text().trim();
            $target.attr('data-chrome-ex-orig', orig);
            if (texts[id]) {
                $target.text(texts[id]);
                if (opt.onChange) opt.onChange($target, orig !== texts[id]);
            }
        });
    });
    //クリックイベント設定
    opt.$targets.click(event => {
        let $target = $(event.currentTarget);
        if (opt.rewritableIf && !opt.rewritableIf($target)) { return; }
        //確認
        let text = prompt("", $target.text().trim());
        if (text === null) {
            return;
        }
        //入力値に書き換え or 空欄なら元の値に戻す
        if (text) {
            $target.text(text);
            if (opt.onChange) opt.onChange($target, true);
        } else {
            let orig = $target.attr('data-chrome-ex-orig');
            $target.text(orig);
            if (opt.onChange) opt.onChange($target, false);
        }
        //保存
        let id = opt.getId($target);
        if (text) {
            ChEx.storage.saveLocal(opt.storageKey, {}, function (texts) {
                texts[id] = text;
            });
        } else {
            ChEx.storage.saveLocal(opt.storageKey, {}, function (texts) {
                delete texts[id];
            });
        }
    });
};
ChEx.rewritableComments = ChEx.rewritableTexts; //deprecated

/** ローカルストレージ */
ChEx.storage = {};
ChEx.storage.loadLocal = function (key, defaultValue, callback) {
    if ((typeof defaultValue) === 'function') return ChEx.error('defaultValue is required.');
    //noinspection JSUnresolvedVariable
    const __local = chrome.storage.local;
    __local.get(key, (data) => {
        if (!data[key]) {
            data[key] = defaultValue;
        }
        callback(data[key]);
    });
};
ChEx.storage.__saveLocal = function (base, afterSave) {
    //noinspection JSUnresolvedVariable
    const __local = chrome.storage.local;
    if (afterSave) {
        __local.set(base, afterSave);
    } else {
        __local.set(base);
    }
};
ChEx.storage.saveLocal = function (key, defaultValue, callback, afterSave) {
    if ((typeof defaultValue) === 'function') return ChEx.error('defaultValue is required.');
    //noinspection JSUnresolvedVariable
    const __local = chrome.storage.local;
    __local.get(key, (base) => {
        if (!base[key]) {
            base[key] = defaultValue;
        }
        let save = callback(base[key]);
        if (save !== false) {
            ChEx.storage.__saveLocal(base, afterSave);
        } else {
            if (afterSave) afterSave();
        }
    });
};
ChEx.storage.saveLocalDirectly = function (key, data, afterSave) {
    if (afterSave && (typeof afterSave) !== 'function') return ChEx.error('afterSave must be function.');
    //noinspection JSUnresolvedVariable
    const __local = chrome.storage.local;
    __local.get(key, (base) => {
        base[key] = data;
        ChEx.storage.__saveLocal(base, afterSave);
    });
};
ChEx.storage.removeLocal = function (key, afterSave) {
    if (afterSave && (typeof afterSave) !== 'function') return ChEx.error('afterSave must be function.');
    //noinspection JSUnresolvedVariable
    const __local = chrome.storage.local;
    if (afterSave) {
        __local.remove(key, afterSave)
    } else {
        __local.remove(key)
    }
};

/**
 * 入力内容をテンプレートとして保存する機能
 * @param opt.storageKey
 * @param opt.init - 保存/選択するためのダイアログを開くボタン($opener)の表示を行うコールバック関数。例: $opener => $opener.appendTo('form')
 * @param opt.title
 * @param opt.inputs
 * @param opt.onAdd
 * @param opt.onApply
 */
ChEx.templateStorage = function (opt) {
    const dialog = ChEx.dialog({
        title: opt.title,
        makeBody: () => {
            let $table;
            let $root = $('<div></div>').append(
                $table = $('<table></table>'),
                $('<input type="button" value="Add Template" style="margin-top: 5px;">').click(() => {
                    let title = prompt('title');
                    if (title) {
                        let values = opt.inputs.map(selector => {
                            let $input = $(selector);
                            let type = $input.attr('type');
                            if (type === 'checkbox' || type === 'radio') {
                                return $input.filter(':checked').get().map(elem => elem.value).join(",");
                            } else if ($input.is('select') && $input.prop('multiple')) {
                                //noinspection JSValidateTypes
                                return $input.children('option:selected').get().map(elem => elem.value).join(",");
                            } else {
                                return $input.val();
                            }
                        });
                        if (opt.onAdd) opt.onAdd(values);
                        let tsv = `${title}\t${values.join("\t")}`;
                        __addRow(tsv);
                        ChEx.storage.saveLocal(opt.storageKey, [], templates => {
                            templates.push(tsv);
                        });
                    }
                })
            );
            const __addRow = function (tsv) {
                let $tr;
                $table.append(
                    $tr = $('<tr></tr>').append(
                        $('<td style="padding:0;"><input type="button" value="Select" style="background-color: lightblue;"></td>').click(() => {
                            dialog.close();
                            let values = tsv.split("\t");
                            values.shift(); //タイトル撤去
                            for (let selector of opt.inputs) {
                                let val = values.shift();
                                let $input = $(selector);
                                let type = $input.attr('type');
                                if (type === 'checkbox' || type === 'radio') {
                                    $input.prop('checked', false);
                                    val.split(',').forEach(v => $input.filter(`[value="${v}"]`).prop('checked', true));
                                } else if ($input.is('select') && $input.prop('multiple')) {
                                    //noinspection JSValidateTypes
                                    $input.children('option').prop('selected', false);
                                    //noinspection JSValidateTypes
                                    val.split(',').forEach(v => $input.children(`option[value="${v}"]`).prop('selected', true));
                                } else {
                                    $input.val(val);
                                }
                            }
                            if (opt.onApply) opt.onApply(values); //余った values を渡す
                        }),
                        $('<td style="padding: 0 4px;"></td>').text(tsv.replace(/\t[\s\S]*$/, '')).attr('title', tsv),
                        $('<td><input type="button" value="Delete"></td>').click(() => {
                            if (!confirm(`Delete?\n\n${tsv.replace(/\n/g, ' ').replace(/\t/g, "\n")}`)) return;
                            $tr.remove();
                            ChEx.storage.saveLocal(opt.storageKey, [], function (templates) {
                                let idx = templates.indexOf(tsv);
                                if (idx === -1) return ChEx.error('No tsv in the template. tsv: ' + tsv);
                                templates.splice(idx, 1);
                            });
                        }),
                    )
                );
            };
            ChEx.storage.loadLocal(opt.storageKey, [], templates => {
                for (let tsv of templates) {
                    __addRow(tsv);
                }
            });
            return $root;
        }
    });
    //noinspection JSUnresolvedFunction
    opt.init($(`<input type="button" value="${opt.title}">`).click(() => dialog.open()));
};

/** 下位のDOMが変更されたら */
ChEx.onChangeDom__timeoutId = 0;
ChEx.onChangeDom = function ($root, callback) {
    $root.on("DOMNodeInserted DOMSubtreeModified", function () {
        if (ChEx.onChangeDom__timeoutId) return true; //動いていたらやらない
        ChEx.onChangeDom__timeoutId = setTimeout(function () {
            try {
                callback($root);
            } finally {
                ChEx.onChangeDom__timeoutId = 0;
            }
            return true;
        }, 100);
    });
};

/** トグルでコールバックを実行する */
ChEx.__toggle = {};
ChEx.toggle = function(key, a, b) {
    ChEx.__toggle[key] = !ChEx.__toggle[key];
    if (ChEx.__toggle[key]) {
        a(true);
    } else if (b) {
        b();
    } else {
        a(false);
    }
};

/** X軸の自動スクロール */
ChEx.scrollX = function ($dom, calcX) {
    $dom.each(function () {
        let $each = $(this);
        //noinspection JSValidateTypes
        $each.stop(true, true).animate({ scrollLeft: calcX($each.scrollLeft()) }, 200);
    });
};

/** Y軸の自動スクロール */
ChEx.scrollY = function ($dom, calcY) {
    $dom.each(function () {
        let $each = $(this);
        //noinspection JSValidateTypes
        $each.stop(true, true).animate({ scrollTop: calcY($each.scrollTop()) }, 200);
    });
};

/** ショートカットキーを追加 */
ChEx.__keydown_KEYS = {
    BS: 8,
    '<': 188,
    '>': 190,
    '?': 191,
    '/': 191,
};
ChEx.__keydown_handlers = null;
ChEx.__keydown_helps = null;
ChEx.keydown = function (key, label, callback) {
    //初回のみ行う
    if (!ChEx.__keydown_handlers) {
        ChEx.__keydown_handlers = {};
        ChEx.__keydown_helps = [];
        //イベント設置
        $(document).keydown(function (e) {
            if ($('textarea,input').is(':focus')) return;
            let code = e.which;
            let handler = ChEx.__keydown_handlers[code];
            if (handler) {
                handler(e);
            }
            //console.log(`${code}:${String.fromCharCode(code)}`);
        });
    }
    //設定
    ChEx.__keydown_handlers[ChEx.__keydown_KEYS[key] || key.charCodeAt(0)] = callback;
    if (label) {
        ChEx.__keydown_helps.push({ key, label });
    }
};
ChEx.keydownHelp = function (key, parentPosition) {
    ChEx.keydown(key || 'H', '', function () {
        const $body = $('body');
        ChEx.toggle('keydown-help', () => {
            let p = parentPosition || $body.position();
            $body.append(
                $(`<pre id='chex-keydown-help' style="position: fixed; left: ${p.left + 20}px; top: ${p.top + 20}px; padding: 10px; background-color: white; border: 3px solid black; z-index: ${Number.MAX_SAFE_INTEGER};"></pre>`).append(
                    ChEx.__keydown_helps.map(h => `<b>${ChEx.h(h.key)}</b> : ${ChEx.h(h.label)}<br/>`)
                )
            );
        }, () => {
            $('#chex-keydown-help').remove();
        });
    });
};

/** 最小実装のダイアログ(jquery-uiは大きすぎるので) */
ChEx.__dialog_opened = false;
/**
 * @param opt.makeBody - ダイアログの中身を作るコールバック。戻り値で中身を返す
 * @param opt.css
 * @param opt.title
 * @param opt.onOpen
 * @param opt.onClose
 */
ChEx.dialog = function (opt) {
    if (ChEx.__dialog_opened) return;
    ChEx.__dialog_opened = true;
    let $dialog, $back, $message;
    const dialog = {
        open: () => {
            $('body').append(
                $dialog = $('<div></div>').css(Object.assign({
                    position: 'absolute',
                    height: 'auto',
                    width: '600px',
                    top: 0,
                    left: 0,
                    zIndex: 2147483647,
                    borderRadius: '3px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    color: '#333',
                    fontFamily: 'Arial,Helvetica,sans-serif',
                    fontSize: '1em',
                    overflow: 'hidden',
                    padding: '.2em',
                    outline: 0,
                }, opt.css)).append(
                    (opt.title ? $('<div></div>').text(opt.title).css({
                        padding: '.4em 1em',
                        borderRadius: '3px',
                        border: '1px solid #ddd',
                        background: '#e9e9e9',
                        color: '#333',
                        fontWeight: 'bold',
                    }) : null),
                    $('<div></div>').css({
                        padding: '.5em 1em',
                        color: '#333',
                    }).append(
                        $message = opt.makeBody(),
                        $('<div class="chex-dialog-buttons" style="margin-top: 10px;"></div>')
                    )
                ),
                $back = $('<div></div>').css({
                    zIndex: 2147483646,
                    background: '#aaa',
                    opacity: '.3',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                })
            );
            if (opt.onOpen) opt.onOpen();
            $message.scrollTop(0); //スクロールが出る場合、ボタン(末尾)にフォーカスが行ってしまうので、これで先頭に戻す
            let $window = $(window);
            let ww = $window.width();
            let dw = $dialog.width();
            //noinspection JSValidateTypes
            $dialog.css({
                left: (ww - dw) / 2,
                top: $window.scrollTop() + 20 //Math.max(20, (wh - dh) / 2),
            });
            $(document).on('keydown.chex-dialog', function (e) {
                if (e.which === 27) dialog.close();
            });
            dialog.addButton('Cancel', () => dialog.close());
        },
        close: () => {
            $dialog.remove();
            $back.remove();
            $(document).off('.chex-dialog');
            if (opt.onClose) opt.onClose();
            ChEx.__dialog_opened = false;
        },
        addButton: (label, onClick, bgColor) => {
            $dialog.find('.chex-dialog-buttons').append(
                $('<button></button>').text(label).click(onClick).css({
                    border: '1px solid #c5c5c5',
                    borderRadius: '3px',
                    padding: '.4em 1em',
                    color: '#454545',
                    background: bgColor || '#f6f6f6',
                    fontSize: '1em',
                    cursor: 'pointer',
                    marginRight: '10px',
                })
            );
        },
    };
    return dialog;
};

/**
 * 通知
 */
ChEx.notify = function (storageKey, list) {
    ChEx.storage.loadLocal(storageKey, {}, data => {
        let already = data['alreadyReadNotify'] || '';
        list = list.sort((a, b) => a.ymd > b.ymd);
        if (already) {
            //既読は除去
            list = list.filter(item => already < item.ymd);
        }
        if (list.length) {
            let later = data['alreadyReadNotifyLater'] || '';
            if (later && (new Date()).getTime() < later) return;
            //表示
            $('body').append(
                $('<div id="chex-notify" style="position: fixed; left: 0; top: 0; padding: 0; width: 100vw; background-color: lightblue; z-index: 9999; box-shadow: 4px 4px 4px rgba(0,0,0,0.2);"></div>').append(
                    `<div style="padding: 10px; background-color: darkblue; color: white;">${ChEx.h(ChEx.__info.pluginName)}</div>`,
                    list.map(item => `<div style="margin: 20px; font-size: medium;"><div style="color: gray;">${item.ymd}</div><ul><li>${item.htmls.join('<li>')}</ul></div>`),
                    $('<div style="display: flex; justify-content: center; align-items: center; margin: 30px"></div>').append(
                        $('<input type="button" value="Close (あとで再通知)" style="font-size: larger; padding: 10px;">').click(() => {
                            $('#chex-notify').hide();
                            ChEx.storage.saveLocal(storageKey, {}, data => {
                                data['alreadyReadNotifyLater'] = (new Date()).getTime() + 10 * 60 * 1000; //10分後
                            });
                        }),
                        $('<input type="button" value="Close (完了)" style="margin-left: 60px; font-size: larger; padding: 10px; background-color: darkblue; color: white;">').click(() => {
                            $('#chex-notify').hide();
                            ChEx.storage.saveLocal(storageKey, {}, data => {
                                data['alreadyReadNotify'] = list[list.length - 1].ymd;
                            });
                        }),
                        `<div style="margin-left: 60px; font-size: larger;">連絡先: ${ChEx.inquiryLink()}</div>`
                    )
                )
            );
        }
    });
};

/**
 * 文字入力により行が絞り込まれていく
 * @param {function} opt.init - 入力内容を表示するエリア($input)を配置するコールバック。$input => {} の形。
 * @param {jQuery} opt.$foundRows - 検索結果で表示/非表示をする行
 */
ChEx.keyDownSearch = function (opt) {
    let $input = $('<span style="margin-left: 10px; font-weight: bold; font-size: medium;"></span>');
    opt.init($input);
    //noinspection JSUnresolvedFunction
    $('body').keydown(function (e) {
        let input = $input.text();
        if (e.which === 8) { //BS
            input = input.substr(0, input.length - 1); //末尾1文字撤去
        } else {
            let char = String.fromCharCode(e.which);
            if (char.match(/[A-Z0-9]/)) input += char; //特定の文字のみ許す
        }
        $input.text(input);
        opt.$foundRows.show();
        if (input) {
            opt.$foundRows.each(function () {
                let $row = $(this);
                if ($row.text().toUpperCase().indexOf(input) === -1) $row.hide();
            });
        }
    });
};

ChEx.copyToClipboard = function (str) {
    // copy 用に textareaを作る
    let $text = $('<textarea></textarea>').css({
        position: 'absolute',
        left: '-100%',
    }).appendTo('body').val(str).select();
    //textArea.select();
    document.execCommand("copy");
    $text.remove();
};
ChEx.getFromClipboard = function () {
    // copy 用に textareaを作る
    let $text = $('<textarea></textarea>').css({
        position: 'absolute',
        left: '-100%',
    }).appendTo('body').select();
    //textArea.select();
    document.execCommand("paste");
    let str = $text.val();
    $text.remove();
    return str;
};

ChEx.uniq = function (ary) {
    let exists = new Set();
    let results = [];
    for (let a of ary) {
        if (!exists.has(a)) {
            exists.add(a);
            results.push(a);
        }
    }
    return results;
};

/**
 * @param {string} opt.selector - 日付が入ってる欄を指すselector
 * @param {string} opt.format - (省略可)日付の書式
 * @param {bool} opt.color - (省略可)色付けするならtrue
 * @param {int} opt.now - (省略可)現在のtime値
 */
ChEx.dateColor = function (opt) {
    let $dts = $(opt.selector);
    //日付欄ごとにループ
    $dts.each((i, dt) => {
        let $dt = $(dt);
        let date = new Date($dt.text());
        //日付をフォーマットして入れ直す
        $dt.text(ChEx.dateFormat(date, opt.format || 'Y-M-D H:I:S'));
        //現在との差分を計算
        if (opt.color) {
            let dateNum = date.getTime();
            if (dateNum <= opt.now) { //期限過ぎたらだんだん赤黒く
                let num = Math.max(32, 255 - parseInt((opt.now - dateNum) / 1000 / 3600 / 24 * 32));
                $dt.css('background', `rgb(${num}, 0, 0)`);
            } else { //期限がせまったら黄色く
                let num = Math.min(255, parseInt((dateNum - opt.now) / 1000 / 3600 / 24 * 32));
                $dt.css('background', `rgb(255, 255, ${num})`);
            }
        }
    });
};

/**
 * @param {string} opt.selector
 * @param {function} opt.getValue
 */
ChEx.sortDom = function (opt) {
    let $rows = $(opt.selector);
    $rows.sort((a, b) => opt.getValue($(a)) > opt.getValue($(b)));
    $rows.parent().append($rows);
};

ChEx.clickableLink = function (label) {
    return $('<a href="javascript:void(0)"></a>').text(label);
};