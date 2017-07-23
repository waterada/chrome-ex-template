const presentation = function () {
    const $body = $('body');
    $body.append(`<style>
            /* 選択エリアを黄色に */
            ::selection { background: yellow; color: black; }
            .chex-line-num::selection, .chex-line-num > .hljs-number::selection { background: inherit; color: inherit; }
    
            /* カーソル大きく */
            * { cursor: url(https://waterada.github.io/chrome-ex-qiita/big-cursor.png), auto; }
            
            /* すべて太字 */
            pre > code { font-family: Consolas; }
        </style>`);

    //行番号
    $body.find('code').each(function () {
        let $code = $(this);
        let html = $code.html();
        let i = 1;
        html = html.trim().replace(/^/gm, () => `<span class="chex-line-num">${ChEx.padding(i++, 3)}| </span>`);
        $code.html(html);
    });
};
