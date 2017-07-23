$(function () {
    $('.ope-storage-object,.ope-storage-array').each(function () {
        let $div = $(this);
        let STORAGE_KEY = $div.attr('data-storage');
        let IS_ARRAY_TYPE = $div.is('.ope-storage-array');
        let TITLE = $div.attr('data-title');
        let COL_RATE = $div.attr('data-col-rate');
        let isJson = location.href.match(/json=(1|true)/);
        $div.css({ margin: '2px', flex: COL_RATE, marginBottom: '20px' });
        $div.append(
            `<div style="height: 30px; display: flex; align-items: flex-end;">${TITLE || STORAGE_KEY}</div>`,
            `<textarea style="width: 100%; height: calc(100% - 40px);"></textarea>`
        );
        let $textarea = $div.find('textarea');
        if (isJson) {
            ChEx.storage.loadLocal(STORAGE_KEY, null, data => {
                if (data !== null) {
                    let text = JSON.stringify(data);
                    $textarea.val(text);
                }
            });
        } else if (IS_ARRAY_TYPE) {
            ChEx.storage.loadLocal(STORAGE_KEY, [], data => {
                if (!$.isArray(data)) throw new Error(`${STORAGE_KEY} が ope-storage-array で参照されましたが、これは配列ではありません。`);
                data = data.map(v => v.replace(/\n/g, '\\n'));
                let text = data.join("\n");
                $textarea.val(text);
            });
        } else {
            ChEx.storage.loadLocal(STORAGE_KEY, {}, data => {
                if ($.isArray(data)) throw new Error(`${STORAGE_KEY} が ope-storage-array で参照されていませんが、これは配列です。`);
                let text = Object.keys(data).sort().map(key => `${key}: ${data[key]}`.replace(/\n/g, '\\n')).join("\n");
                $textarea.val(text);
            });
        }
        //noinspection JSUnresolvedFunction
        $div.find('textarea').change(function () {
            if (!confirm('データが変更されました。保存しますか？')) {
                location.reload(); //元に戻す
                return;
            }
            if (isJson) {
                let data = $textarea.val();
                if (data) {
                    data = JSON.parse(data);
                    ChEx.storage.saveLocalDirectly(STORAGE_KEY, data, () => location.reload());
                } else {
                    ChEx.storage.removeLocal(STORAGE_KEY, () => location.reload());
                }
            } else if (IS_ARRAY_TYPE) {
                let data = $textarea.val().trim().split("\n").map(v => v.trim().replace(/\\n/g, "\n"));
                ChEx.storage.saveLocalDirectly(STORAGE_KEY, data, () => location.reload());
            } else {
                let data = {};
                $textarea.val().replace(/^([^:]+):\s*(.*?)\s*$/gm, (hit, key, val) => {
                    data[key] = val.replace(/\\n/g, "\n");
                });
                ChEx.storage.saveLocalDirectly(STORAGE_KEY, data, () => location.reload());
            }
        });
    });
});
