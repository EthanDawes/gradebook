export default defineBackground(() => {
  browser.action.onClicked.addListener(function () {
    browser.tabs.create({
      url: browser.extension.getURL("options.html"),
      selected: true,
    });
  });
});
