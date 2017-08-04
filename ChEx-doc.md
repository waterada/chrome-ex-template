ChEx.js
=============

まだ途中です。少しずつ書き足していきます。


## 1. 特定のURLやDomがある場合のみ拡張の処理を行う

### 1-1. ChEx.matchLink()

- URLがマッチした場合にのみ処理を行う。
- 正規表現よりも直感的に書けるのでメンテしやすい。

```js
// 商品登録ページのみ
ChEx.matchLink('/projects/*/items/add', function() {
    //拡張の処理
});

// 商品詳細ページのみ
ChEx.matchLink('/projects/*/items/(*)/detail', function(itemId) {
    //拡張の処理
});
```

- ちなみに同等のことを正規表現でかくとこうなる

```js
//正規表現だと読みづらい
if (location.href.match(/\/projects\/.*?\/items\/add/)) {
    //拡張の処理
}

let matches = location.href.match(/\/projects\/.*\/items\/(.*?)\/detail/);
if (matches) {
    let itemId = matches[1]
    //拡張の処理
}
```

### 1-2. ChEx.waitDom()

- Domが出現するまで待ってから処理を行う。
- Domが現れるのにタイムラグがある場合に使う。

```js
// form .target を最大 10 秒探して、見つかれば処理を行う。見つからなければエラーにする。
ChEx.waitDom('form .target', '対象のDom', 10, function($target) {
    // $target には取得することができた Dom (jQuery) が入ってる。
    // 第２引数の文言はエラーメッセージ用。Dom が見つからない場合、Dom から意図がつかめなくなり得るので、かならず日本語でも残しておくべき。
});
```

### 1-3. ChEx.onChangeDom()

- 下位のDOMが変更されたら処理を行う。
- 何らかのアクションの結果で出現するDomに対して処理を行いたい場合に使う。

```js
ChEx.onChangeDom($('.aaa'), function() {
    // 更新が発生した場合に実行される
});
```

## 2. Dom取得。ただしエラー検出しやすく

※Domの構造は変わるもの。変わった場合に修正しやすくしておく必要がある。
そこで下記はヒットしなくなった場合にエラーで止まるようにしており、
ヒットしない状況でも何を指そうとしていたのかが解るようにしている。

### 2-1. ChEx.findOne()

- きっかり１個ヒットしない場合にエラー出す。
- selector だけだと動かなくなった際に何が欲しかったのかわからなくなるので label も書くこと

```js
let $itemNum = ChEx.findOne('#aaa .bbb', '商品番号を保持するカラム');
```

### 2-2. ChEx.findOneThen()

- findOne(selector) 後、`${selector} ${subSelector}` で再検索する。
- きっかり１個あることはチェックしたいが、その子のDomはとくに制約ない場合につかう。

```js
let $itemNum = ChEx.findOneThen('#aaa > form', '> .bbb', '商品番号を保持するカラム');
```

## 3. フォーマット系

### 3-1. ChEx.padding(値, 長さ, 補完文字, 小数桁)

```js
ChEx.padding(1234567)               // "1,234,567"
ChEx.padding(1, 3)                  // "  1"
ChEx.padding(1, -3)                 // "1  "
ChEx.padding("a", 3)                // "  a"
ChEx.padding("a", -3)               // "a  "
ChEx.padding(1, 3, '0')             // "001"
ChEx.padding(0.12345, 3, '0', 2)    // "000.12"
```

### 3-2. ChEx.dateFormat()

```js
ChEx.dateFormat(new Date(), 'Y-M-D H:I:S.MS') // 2017-07-16 15:36:00.000
```

## 4. 応用

### 4-1. ChEx.rewritableComments

特定の場所を書き換えられるようにするもの。

