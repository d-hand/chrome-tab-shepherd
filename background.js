class TabShepherd {
    constructor() {
        this.__tabs = [];

        chrome.browserAction.onClicked.addListener(this.__onBrowserActionClicked.bind(this))        
        chrome.tabs.onCreated.addListener(this.__onTabCreated.bind(this))        
        chrome.tabs.onActivated.addListener(this.__onTabActivated.bind(this))
        chrome.tabs.onUpdated.addListener(this.__onTabUpdated.bind(this))
        chrome.tabs.onDetached.addListener(this.__onTabDetached.bind(this))        
        chrome.tabs.onAttached.addListener(this.__onTabAttached.bind(this))        
        chrome.tabs.onRemoved.addListener(this.__onTabRemoved.bind(this))        
        chrome.runtime.onMessage.addListener(this.__onMessage.bind(this))
    }

    getTabs(callback) {
        chrome.windows.getCurrent(window => {
            chrome.tabs.query({currentWindow: true}, actualTabs => {
                this.__actualize(actualTabs)
                var tabs = this.__tabs
                    .filter(tab => tab.windowId === window.id)
                    .sort((tab1, tab2) => tab2.timestamp - tab1.timestamp)

                callback(tabs)
            })
        })
    }    

    __onBrowserActionClicked() {
        chrome.tabs.create({url: chrome.extension.getURL('pasture.html')});    
    }

    __onTabCreated(tab) {
        this.__addFromTab(tab)
    }

    __onTabActivated({tabId, windowId}){
        this.__makeScreenShot(tabId, windowId, screenShotDataUrl => {
            this.__update(tabId, {screenShotDataUrl})
        })
    }

    __onTabUpdated(tabId, changeInfo, {windowId, url, title, favIconUrl}) {
        if (changeInfo.status === 'complete') {
            this.__makeScreenShot(tabId, windowId, screenShotDataUrl => {
                this.__update(tabId, {url, title, favIconUrl, screenShotDataUrl})
            })
        }
    }

    __onTabDetached(tabId) {
        this.__update(tabId, {windowId: null})
    }

    __onTabAttached(tabId, {newWindowId}) {
        this.__update(tabId, {windowId: newWindowId})
    }

    __onTabRemoved(tabId) {
        this.__remove(tabId)
    }

    __onMessage(message, sender, sendResponse) {
        if (message.selectedTabId) {
            chrome.tabs.update(message.selectedTabId, {active: true, highlighted: true});
        }
    }

    __makeScreenShot(tabId, windowId, callback) {
        chrome.tabs.get(tabId, tab => {
            if (tab.active && tab.url && !tab.url.includes("chrome://")) {
                chrome.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 100 }, callback)
                return;
            }
    
            callback(undefined);
        });
    }

    __addFromTab(tab) {
        this.__tabs.push({
            id: tab.id,
            windowId: tab.windowId,
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            timestamp: Date.now()
        });    
    }

    __update(tabId, {windowId, url, title, favIconUrl, screenShotDataUrl}) {
        var tab = this.__tabs.find(x => x.id === tabId)
        if (tab) {
            tab.windowId = windowId === undefined ? tab.windowId : windowId
            tab.title = title === undefined ? tab.title : title
            tab.url = url === undefined ? tab.url : url
            tab.favIconUrl = favIconUrl === undefined ? tab.favIconUrl : favIconUrl
            tab.screenShotDataUrl = screenShotDataUrl === undefined ? tab.screenShotDataUrl : screenShotDataUrl
            tab.timestamp = Date.now()
        }
    }

    __remove(tabId) {
        this.__tabs = this.__tabs.filter(x => x.id !== tabId);
    }

    __actualize(actualTabs) {
        for (const actualTab of actualTabs) {
            const tab = this.__tabs.find(x => x.id === actualTab.id)

            if (!tab) {
                this.__addFromTab(actualTab)
                continue
            }
                
            if (tab.url !== actualTab.url) {
                this.__update(tab.id, {...actualTab, screenShotDataUrl: null})
                continue
            }                
        }

        this.__tabs = this.__tabs.filter(tab => !!actualTabs.find(actualTab => tab.id === actualTab.id))
    }
}

var tabShepherd = new TabShepherd();