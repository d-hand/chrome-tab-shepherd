class OrderedTabIdsProvider {
    static get() {
        return !!localStorage[ORDERD_TABS_IDS_STORAGE_KEY] ? JSON.parse(localStorage[ORDERD_TABS_IDS_STORAGE_KEY]) : [];
    }
    
    static save(tabIds) {
        localStorage[ORDERD_TABS_IDS_STORAGE_KEY] = JSON.stringify(tabIds);
    }

    static clear()
    {
        localStorage.removeItem(ORDERD_TABS_IDS_STORAGE_KEY);
    }
}

const ORDERD_TABS_IDS_STORAGE_KEY = "TabsShepherdLocalStorageKey_OrderedTabIds";