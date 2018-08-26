class OrderedTabIdsProvider {
    static get __storageKey() {
        return "TabsShepherdLocalStorageKey_OrderedTabIds";
    }

    static get() {
        return !!localStorage[OrderedTabIdsProvider.__storageKey] ? JSON.parse(localStorage[OrderedTabIdsProvider.__storageKey]) : [];
    }
    
    static save(tabIds) {
        localStorage[OrderedTabIdsProvider.__storageKey] = JSON.stringify(tabIds);
    }
}