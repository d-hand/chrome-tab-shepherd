chrome.tabs.onCreated.addListener(tab => update(tab.id));
chrome.tabs.onUpdated.addListener(tabId => update(tabId));
chrome.tabs.onActivated.addListener(activeInfo => update(activeInfo.tabId));
chrome.tabs.onRemoved.addListener(tabId => remove(tabId));

chrome.windows.onRemoved.addListener(() => cleanupIfNeeded());

function update(tabId) {
    tabIds = [tabId, ...OrderedTabIdsProvider.get().filter(x => x !== tabId)];
    OrderedTabIdsProvider.save(tabIds);
}

function remove(tabId) {
    var tabIds = OrderedTabIdsProvider.get().filter(x => x !== tabId);
    OrderedTabIdsProvider.save(tabIds);
}

function cleanupIfNeeded()
{
    chrome.windows.getAll({}, windows => {
        if (windows.length <= 1){
            OrderedTabIdsProvider.save([]);
        }
    });
}

