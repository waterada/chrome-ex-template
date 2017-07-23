//----------------------
$(function () {
    //問い合わせリンク
    $('#chex-inquiry').html(ChEx.inquiryLink());
    //通知リセット
    $('#chex-notify-reset').click(function () {
        ChEx.storage.saveLocal('ExpenseSheetPage.global', {}, data => {
            delete data['alreadyReadNotify'];
            delete data['alreadyReadNotifyLater'];
        }, () => location.reload());
    });
});