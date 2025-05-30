export default defineBackground(() => {
  browser.action.onClicked.addListener(function () {
    browser.tabs.create({
      url: browser.runtime.getURL("options.html"),
      selected: true,
    });
  });
});
