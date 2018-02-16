if (!Range.prototype["intersectsNode"]) {
    Range.prototype["intersectsNode"] = function (node) {
        let range = document.createRange();
        range.selectNode(node);
        return 0 > this.compareBoundaryPoints(Range.END_TO_START, range)
            && 0 < this.compareBoundaryPoints(Range.START_TO_END, range);
    };
}
var getExtensionProtocol = function () {
    if (typeof browser == "undefined") {
        if (typeof chrome !== "undefined")
            return "chrome-extension://";
    }
    else {
        return "ms-browser-extension://";
    }
};
class FakeEvent {
    addListener(callback) { }
    addRules(rules, callback) { }
    getRules(ruleIdentifiers, callback) { }
    hasListener(callback) { return false; }
    hasListeners() { return false; }
    removeRules(ruleIdentifiers, callback) { }
    removeListener(callback) { }
}
class EdgeBridgeHelper {
    constructor() {
        this.fakeEvent = new FakeEvent();
    }
    toAbsolutePath(relativePath) {
        if (relativePath.indexOf("ms-browser-extension://") == 0) {
            return relativePath.replace(myBrowser.runtime.getURL(""), "");
        }
        else if (relativePath.indexOf("/") != 0) {
            var absolutePath = "";
            var documentPath = document.location.pathname;
            absolutePath = documentPath.substring(0, documentPath.lastIndexOf("/") + 1);
            absolutePath += relativePath;
            return absolutePath;
        }
        return relativePath;
    }
}
var bridgeHelper = new EdgeBridgeHelper();
class EdgeBridgeDebugLog {
    constructor() {
        this.CatchOnException = true;
        this.VerboseLogging = true;
        this.FailedCalls = {};
        this.SuccededCalls = {};
        this.DeprecatedCalls = {};
        this.BridgedCalls = {};
        this.UnavailableApis = {};
        this.EdgeIssues = {};
    }
    log(message) {
        try {
            if (this.VerboseLogging) {
                console.log(message);
            }
        }
        catch (e) {
        }
    }
    info(message) {
        try {
            if (this.VerboseLogging) {
                console.info(message);
            }
        }
        catch (e) {
        }
    }
    warn(message) {
        try {
            if (this.VerboseLogging) {
                console.warn(message);
            }
        }
        catch (e) {
        }
    }
    error(message) {
        try {
            if (this.VerboseLogging) {
                console.error(message);
            }
        }
        catch (e) {
        }
    }
    DoActionAndLog(action, name, deprecatedTo, bridgedTo) {
        var result;
        try {
            result = action();
            this.AddToCalledDictionary(this.SuccededCalls, name);
            if (typeof deprecatedTo !== "undefined" && typeof deprecatedTo !== "null") {
                this.warn("API Call Deprecated - Name: " + name + ", Please use " + deprecatedTo + " instead!");
                this.AddToCalledDictionary(this.DeprecatedCalls, name);
            }
            if (typeof bridgedTo !== "undefined" && typeof bridgedTo !== "null") {
                this.info("API Call '" + name + "' has been bridged to another Edge API: " + bridgedTo);
                this.AddToCalledDictionary(this.BridgedCalls, name);
            }
            return result;
        }
        catch (ex) {
            this.AddToCalledDictionary(this.FailedCalls, name);
            if (this.CatchOnException)
                this.error("API Call Failed: " + name + " - " + ex);
            else
                throw ex;
        }
    }
    LogEdgeIssue(name, message) {
        this.warn(message);
        this.AddToCalledDictionary(this.EdgeIssues, name);
    }
    LogUnavailbleApi(name, deprecatedTo) {
        this.warn("API Call '" + name + "' is not supported in Edge");
        this.AddToCalledDictionary(this.UnavailableApis, name);
        if (typeof deprecatedTo !== "undefined" && typeof deprecatedTo !== "null") {
            this.warn("API Call Deprecated - Name: " + name + ", Please use " + deprecatedTo + " instead!");
            this.AddToCalledDictionary(this.DeprecatedCalls, name);
        }
    }
    AddToCalledDictionary(dictionary, name) {
        if (typeof dictionary[name] !== "undefined") {
            dictionary[name]++;
        }
        else {
            dictionary[name] = 1;
        }
    }
}
var bridgeLog = new EdgeBridgeDebugLog();
class EdgeChromeAppBridge {
    getDetails() {
        return bridgeLog.DoActionAndLog(() => {
            return EdgeChromeRuntimeBridge.prototype.getManifest();
        }, "app.getManifest", undefined, "runtime.getManifest");
    }
    get isInstalled() { return bridgeLog.DoActionAndLog(() => { throw "app.isInstalled is not available in Edge"; }, "app.isInstalled"); }
    getIsInstalled() { return bridgeLog.DoActionAndLog(() => { throw "app.getIsInstalled is not available in the Edge"; }, "app.getIsInstalled"); }
    installState() { return bridgeLog.DoActionAndLog(() => { throw "app.installState is not available in Edge"; }, "app.installState"); }
    runningState() { return bridgeLog.DoActionAndLog(() => { throw "app.runningState is not available in Edge"; }, "app.runningState"); }
}
class EdgeBrowserActionBridge {
    get onClicked() { return bridgeLog.DoActionAndLog(() => { return myBrowser.browserAction.onClicked; }, "browserAction.onClicked"); }
    disable(tabId) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.disable(tabId);
        }, "browserAction.disable");
    }
    enable(tabId) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof tabId !== "undefined" && typeof tabId !== "null") {
                myBrowser.browserAction.enable(tabId);
            }
            else {
                myBrowser.browserAction.enable();
            }
        }, "browserAction.Enable");
    }
    getBadgeBackgroundColor(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.getBadgeBackgroundColor(details, callback);
        }, "browserAction.getBadgeBackgroundColor");
    }
    getBadgeText(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.getBadgeText(details, callback);
        }, "browserAction.getBadgeText");
    }
    setBadgeBackgroundColor(details) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.setBadgeBackgroundColor(details);
        }, "browserAction.setBadgeBackgroundColor");
    }
    setBadgeText(details) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.setBadgeText(details);
        }, "browserAction.setBadgeText");
    }
    setIcon(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof details.path !== "undefined") {
                if (typeof details.path === "object") {
                    for (var key in details.path) {
                        if (details.path.hasOwnProperty(key)) {
                            details.path[key] = bridgeHelper.toAbsolutePath(details.path[key]);
                        }
                    }
                }
                else {
                    details.path = bridgeHelper.toAbsolutePath(details.path);
                }
            }
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.browserAction.setIcon(details, callback);
            }
            else {
                myBrowser.browserAction.setIcon(details);
            }
        }, "browserAction.setIcon", undefined, "browserAction.setIcon with absolute path");
    }
    setPopup(details) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.browserAction.setPopup(details);
        }, "browserAction.setPopup");
    }
}
class EdgeChromeBrowserActionBridge extends EdgeBrowserActionBridge {
    getPopup(details, callback) {
        bridgeLog.LogUnavailbleApi("browserAction.getPopup");
    }
    getTitle(details, callback) {
        bridgeLog.LogUnavailbleApi("browserAction.getTitle");
    }
    setTitle(details) {
        bridgeLog.LogUnavailbleApi("browserAction.setTitle");
    }
}
class EdgeContextMenusBridge {
    get ACTION_MENU_TOP_LEVEL_LIMIT() { return bridgeLog.DoActionAndLog(() => { return myBrowser.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT; }, "contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT"); }
    get onClicked() { return bridgeLog.DoActionAndLog(() => { return myBrowser.contextMenus.onClicked; }, "contextMenus.onClicked"); }
    create(createProperties, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.contextMenus.create(createProperties, callback);
            }
            else {
                myBrowser.contextMenus.create(createProperties);
            }
        }, "contextMenus.create");
    }
    remove(menuItemId, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.contextMenus.remove(menuItemId, callback);
            }
            else {
                myBrowser.contextMenus.remove(menuItemId);
            }
        }, "contextMenus.remove");
    }
    removeAll(callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.contextMenus.removeAll(callback);
            }
            else {
                myBrowser.contextMenus.removeAll();
            }
        }, "contextMenus.removeAll");
    }
    update(id, updateProperties, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.contextMenus.update(id, updateProperties, callback);
            }
            else {
                myBrowser.contextMenus.update(id, updateProperties);
            }
        }, "contextMenus.update");
    }
}
class EdgeCookiesBridge {
    get(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.cookies.get(details, callback);
        }, "cookies.get");
    }
    getAll(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.cookies.getAll(details, callback);
        }, "cookies.getAll");
    }
    remove(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.cookies.remove(details, callback);
            }
            else {
                myBrowser.cookies.remove(details);
            }
        }, "cookies.remove");
    }
    set(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.cookies.set(details, callback);
            }
            else {
                myBrowser.cookies.set(details);
            }
        }, "cookies.set");
    }
}
class EdgeChromeCookiesBridge extends EdgeCookiesBridge {
    get onChanged() { bridgeLog.LogUnavailbleApi("cookies.onChanged"); return bridgeHelper.fakeEvent; }
}
class EdgeExtensionBridge {
    getBackgroundPage() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.extension.getBackgroundPage();
        }, "extension.getBackgroundPage");
    }
    getURL(path) {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.extension.getURL(path);
        }, "extension.getURL");
    }
    getViews(fetchProperties) {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.extension.getViews(fetchProperties);
        }, "extension.getViews");
    }
}
class EdgeChromeExtensionBridge extends EdgeExtensionBridge {
    get onConnect() { return bridgeLog.DoActionAndLog(() => { return EdgeRuntimeBridge.prototype.onConnect; }, "extension.onConnect", "runtime.onConnect", "runtime.onConnect"); }
    get onMessage() { return bridgeLog.DoActionAndLog(() => { return myBrowser.runtime.onMessage; }, "extension.onMessage", "runtime.onMessage", "runtime.onMessage"); }
    get onRequest() { return bridgeLog.DoActionAndLog(() => { return myBrowser.runtime.onMessage; }, "extension.onRequest", "runtime.onMessage", "runtime.onMessage"); }
    get onRequestExternal() { return bridgeLog.DoActionAndLog(() => { return myBrowser.runtime.onMessageExternal; }, "extension.onRequestExternal", "runtime.onMessageExternal", "runtime.onMessageExternal"); }
    get inIncognitoContext() { return bridgeLog.DoActionAndLog(() => { return myBrowser.extension["inPrivateContext"]; }, "extension.inIncognitoContext", undefined, "extension.inPrivateContext"); }
    get lastError() { return bridgeLog.DoActionAndLog(() => { return myBrowser.runtime.lastError; }, "extension.lastError", undefined, "runtime.lastError"); }
    connect(extensionId, connectInfo) {
        return bridgeLog.DoActionAndLog(() => {
            return EdgeRuntimeBridge.prototype.connect(extensionId, connectInfo);
        }, "extension.connect", "runtime.connect", "runtime.connect");
    }
    sendMessage(message, responseCallback) {
        return bridgeLog.DoActionAndLog(() => {
            return EdgeRuntimeBridge.prototype.sendMessage(message, responseCallback, undefined, undefined);
        }, "extension.sendMessage", "runtime.sendMessage", "runtime.sendMessage");
    }
    sendRequest(extensionId, message, options, responseCallback) {
        return bridgeLog.DoActionAndLog(() => {
            return EdgeRuntimeBridge.prototype.sendMessage(extensionId, message, options, responseCallback);
        }, "extension.sendRequest", "runtime.sendMessage", "runtime.sendMessage");
    }
    isAllowedFileSchemeAccess(callback) {
        bridgeLog.LogUnavailbleApi("extension.isAllowedFileSchemeAccess");
    }
    isAllowedIncognitoAccess(callback) {
        bridgeLog.LogUnavailbleApi("extension.isAllowedIncognitoAccess");
    }
    setUpdateUrlData(data) {
        bridgeLog.LogUnavailbleApi("extension.setUpdateUrlData");
    }
}
class EdgeHistoryBridge {
    get onVisited() { bridgeLog.LogUnavailbleApi("history.onVisited"); return bridgeHelper.fakeEvent; }
    get onVisitRemoved() { bridgeLog.LogUnavailbleApi("history.onVisitRemoved"); return bridgeHelper.fakeEvent; }
    addUrl(details, callback) {
        bridgeLog.LogUnavailbleApi("history.addUrl");
    }
    deleteAll(callback) {
        bridgeLog.LogUnavailbleApi("history.deleteAll");
    }
    deleteRange(range, callback) {
        bridgeLog.LogUnavailbleApi("history.deleteRange");
    }
    deleteUrl(details, callback) {
        bridgeLog.LogUnavailbleApi("history.deleteUrl");
    }
    getVisits(details, callback) {
        bridgeLog.LogUnavailbleApi("history.getVisits");
    }
    search(query, callback) {
        bridgeLog.LogUnavailbleApi("history.search");
    }
}
class EdgeI18nBridge {
    getAcceptLanguages(callback) {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.i18n.getAcceptLanguages(callback);
        }, "i18n.getAcceptLanguages");
    }
    getMessage(messageName, substitutions) {
        return bridgeLog.DoActionAndLog(() => {
            if (messageName.indexOf("@@extension_id") > -1) {
                return myBrowser.runtime.id;
            }
            if (typeof substitutions !== "undefined" && typeof substitutions !== "null") {
                return myBrowser.i18n.getMessage(messageName, substitutions);
            }
            else {
                return myBrowser.i18n.getMessage(messageName);
            }
        }, "i18n.getMessage");
    }
    getUILanguage() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.i18n.getUILanguage();
        }, "i18n.getUILanguage");
    }
}
class EdgeNotificationBridge {
    get onButtonClicked() { bridgeLog.LogUnavailbleApi("notifications.onButtonClicked"); return bridgeHelper.fakeEvent; }
    get onClicked() { bridgeLog.LogUnavailbleApi("notifications.onClicked"); return bridgeHelper.fakeEvent; }
    get onClosed() { bridgeLog.LogUnavailbleApi("notifications.onClosed"); return bridgeHelper.fakeEvent; }
    get onPermissionLevelChanged() { bridgeLog.LogUnavailbleApi("notifications.onPermissionLevelChanged"); return bridgeHelper.fakeEvent; }
    get onShowSettings() { bridgeLog.LogUnavailbleApi("notifications.onShowSettings"); return bridgeHelper.fakeEvent; }
    clear(notificationId, callback) {
        bridgeLog.LogUnavailbleApi("notifications.clear");
    }
    create(notificationId, options, callback) {
        bridgeLog.LogUnavailbleApi("notifications.create");
    }
    getAll(callback) {
        bridgeLog.LogUnavailbleApi("notifications.getAll");
    }
    getPermissionLevel(callback) {
        bridgeLog.LogUnavailbleApi("notifications.getPermissionLevel");
    }
    update(notificationId, options, callback) {
        bridgeLog.LogUnavailbleApi("notifications.update");
    }
}
class EdgePageActionBridge {
    get onClicked() { return bridgeLog.DoActionAndLog(() => { return myBrowser.pageAction.onClicked; }, "pageAction.onClicked"); }
    getPopup(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.getPopup(details, callback);
        }, "pageAction.getPopup");
    }
    getTitle(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.getTitle(details, callback);
        }, "pageAction.getTitle");
    }
    hide(tabId) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.hide(tabId);
        }, "pageAction.hide");
    }
    setTitle(details) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.setTitle(details);
        }, "pageAction.setTitle");
    }
    setIcon(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.pageAction.setIcon(details, callback);
            }
            else {
                myBrowser.pageAction.setIcon(details, callback);
            }
        }, "pageAction.setIcon");
    }
    setPopup(details) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.setPopup(details);
        }, "pageAction.setPopup");
    }
    show(tabId) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.pageAction.show(tabId);
        }, "pageAction.show");
    }
}
class EdgePermissionsBridge {
    get onAdded() { bridgeLog.LogUnavailbleApi("permissions.onAdded"); return bridgeHelper.fakeEvent; }
    get onRemoved() { bridgeLog.LogUnavailbleApi("permissions.onRemoved"); return bridgeHelper.fakeEvent; }
    contains(permissions, callback) {
        bridgeLog.LogUnavailbleApi("permissions.contains");
    }
    getAll(callback) {
        bridgeLog.LogUnavailbleApi("permissions.getAll");
    }
    remove(permissions, callback) {
        bridgeLog.LogUnavailbleApi("permissions.remove");
    }
    request(permissions, callback) {
        bridgeLog.LogUnavailbleApi("permissions.request");
    }
}
class EdgeRuntimeBridge {
    get id() { return bridgeLog.DoActionAndLog(() => { return myBrowser.runtime.id; }, "runtime.id"); }
    get lastError() { return bridgeLog.DoActionAndLog(() => { return myBrowser.runtime.lastError; }, "runtime.lastError"); }
    get onConnect() { return bridgeLog.DoActionAndLog(() => { return myBrowser.runtime.onConnect; }, "runtime.onConnect"); }
    get onInstalled() { return bridgeLog.DoActionAndLog(() => { return myBrowser.runtime.onInstalled; }, "runtime.onInstalled"); }
    get onMessage() { return bridgeLog.DoActionAndLog(() => { return myBrowser.runtime.onMessage; }, "runtime.onMessage"); }
    get onMessageExternal() { return bridgeLog.DoActionAndLog(() => { return myBrowser.runtime.onMessageExternal; }, "runtime.onMessageExternal"); }
    connect(extensionId, connectInfo) {
        return bridgeLog.DoActionAndLog(() => {
            if (typeof connectInfo !== "undefined" && typeof connectInfo !== "null") {
                return myBrowser.runtime.connect(extensionId, connectInfo);
            }
            else {
                return myBrowser.runtime.connect(extensionId);
            }
        }, "runtime.connect");
    }
    getBackgroundPage(callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.runtime.getBackgroundPage(callback);
        }, "runtime.getBackgroundPage");
    }
    getManifest() {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.getManifest();
        }, "runtime.getManifest");
    }
    getURL(path) {
        return bridgeLog.DoActionAndLog(() => {
            return myBrowser.runtime.getURL(path);
        }, "runtime.getURL");
    }
    sendMessage(extensionId, message, options, responseCallback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof responseCallback !== "undefined" && typeof responseCallback !== "null") {
                myBrowser.runtime.sendMessage(extensionId, message, options, responseCallback);
            }
            else if (typeof options !== "undefined" && typeof options !== "null") {
                myBrowser.runtime.sendMessage(extensionId, message, options);
            }
            else if (typeof message !== "undefined" && typeof message !== "null") {
                myBrowser.runtime.sendMessage(extensionId, message);
            }
            else {
                myBrowser.runtime.sendMessage(undefined, extensionId);
            }
        }, "runtime.sendMessage");
    }
}
class EdgeChromeRuntimeBridge extends EdgeRuntimeBridge {
    get onConnectExternal() { bridgeLog.LogUnavailbleApi("runtime.onConnectExternal"); return bridgeHelper.fakeEvent; }
    get onRestartRequired() { bridgeLog.LogUnavailbleApi("runtime.onRestartRequired"); return bridgeHelper.fakeEvent; }
    get onStartup() { bridgeLog.LogUnavailbleApi("runtime.onStartup"); return bridgeHelper.fakeEvent; }
    get onSuspend() { bridgeLog.LogUnavailbleApi("runtime.onSuspend"); return bridgeHelper.fakeEvent; }
    get onSuspendCanceled() { bridgeLog.LogUnavailbleApi("runtime.onSuspendCanceled"); return bridgeHelper.fakeEvent; }
    get onUpdateAvailable() { bridgeLog.LogUnavailbleApi("runtime.onUpdateAvailable"); return bridgeHelper.fakeEvent; }
    openOptionsPage(callback) {
        bridgeLog.DoActionAndLog(() => {
            var optionsPage = myBrowser.runtime.getManifest()["options_page"];
            var optionsPageUrl = myBrowser.runtime.getURL(optionsPage);
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.create({ url: optionsPageUrl }, callback);
            }
            else {
                myBrowser.tabs.create({ url: optionsPageUrl });
            }
        }, "runtime.openOptionsPage", undefined, "tabs.create({ url: optionsPageUrl })");
    }
    connectNative(application) {
        bridgeLog.LogUnavailbleApi("runtime.connectNative");
        return null;
    }
    getPackageDirectoryEntry(callback) {
        bridgeLog.LogUnavailbleApi("runtime.getPackageDirectoryEntry");
    }
    getPlatformInfo(callback) {
        bridgeLog.LogUnavailbleApi("runtime.getPlatformInfo");
    }
    reload() {
        bridgeLog.LogUnavailbleApi("runtime.reload");
    }
    requestUpdateCheck(callback) {
        bridgeLog.LogUnavailbleApi("runtime.requestUpdateCheck");
    }
    restart() {
        bridgeLog.LogUnavailbleApi("runtime.restart");
    }
    setUninstallURL(url, callback) {
        bridgeLog.LogUnavailbleApi("runtime.setUninstallURL");
    }
    sendNativeMessage(application, message, responseCallback) {
        bridgeLog.LogUnavailbleApi("runtime.sendNativeMessage");
    }
}
class EdgeStorageBridge {
    get local() { return bridgeLog.DoActionAndLog(() => { return myBrowser.storage.local; }, "storage.local"); }
    get onChanged() { return bridgeLog.DoActionAndLog(() => { return myBrowser.storage.onChanged; }, "storage.onChanged"); }
}
class EdgeChromeStorageBridge extends EdgeStorageBridge {
    get managed() { return bridgeLog.DoActionAndLog(() => { return myBrowser.storage.local; }, "storage.managed", undefined, "storage.local"); }
    get sync() { return bridgeLog.DoActionAndLog(() => { return myBrowser.storage.local; }, "storage.sync", undefined, "storage.local"); }
}
class EdgeTabsBridge {
    get onActivated() { return bridgeLog.DoActionAndLog(() => { return myBrowser.tabs.onActivated; }, "tabs.onActivated"); }
    get onCreated() { return bridgeLog.DoActionAndLog(() => { return myBrowser.tabs.onCreated; }, "tabs.onCreated"); }
    get onRemoved() { return bridgeLog.DoActionAndLog(() => { return myBrowser.tabs.onRemoved; }, "tabs.onRemoved"); }
    get onReplaced() { return bridgeLog.DoActionAndLog(() => { return myBrowser.tabs.onReplaced; }, "tabs.onReplaced"); }
    get onUpdated() { return bridgeLog.DoActionAndLog(() => { return myBrowser.tabs.onUpdated; }, "tabs.onUpdated"); }
    create(createProperties, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.create(createProperties, callback);
            }
            else {
                myBrowser.tabs.create(createProperties);
            }
        }, "tabs.create");
    }
    detectLanguage(tabId, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.tabs.detectLanguage(tabId, callback);
        }, "tabs.detectLanguage");
    }
    executeScript(tabId, details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.executeScript(tabId, details, callback);
            }
            else {
                myBrowser.tabs.executeScript(tabId, details);
            }
        }, "tabs.executeScript");
    }
    get(tabId, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.tabs.get(tabId, callback);
        }, "tabs.get");
    }
    getCurrent(callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.tabs.getCurrent(callback);
        }, "tabs.getCurrent");
    }
    insertCSS(tabId, details, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.insertCSS(tabId, details, callback);
            }
            else {
                myBrowser.tabs.insertCSS(tabId, details);
            }
        }, "tabs.insertCSS");
    }
    query(queryInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.tabs.query(queryInfo, callback);
        }, "tabs.query");
    }
    remove(tabId, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.remove(tabId, callback);
            }
            else {
                myBrowser.tabs.remove(tabId);
            }
        }, "tabs.remove");
    }
    sendMessage(tabId, message, responseCallback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof responseCallback !== "undefined" && typeof responseCallback !== "null") {
                myBrowser.tabs.sendMessage(tabId, message, responseCallback);
            }
            else {
                myBrowser.tabs.sendMessage(tabId, message);
            }
        }, "tabs.sendMessage");
    }
    update(tabId, updateProperties, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.tabs.update(tabId, updateProperties, callback);
            }
            else {
                myBrowser.tabs.update(tabId, updateProperties);
            }
        }, "tabs.update");
    }
}
class EdgeChromeTabsBridge extends EdgeTabsBridge {
    get onAttached() { bridgeLog.LogUnavailbleApi("tabs.onAttached"); return bridgeHelper.fakeEvent; }
    get onDetached() { bridgeLog.LogUnavailbleApi("tabs.onDetached"); return bridgeHelper.fakeEvent; }
    get onHighlighted() { bridgeLog.LogUnavailbleApi("tabs.onHighlighted"); return bridgeHelper.fakeEvent; }
    get onMoved() { bridgeLog.LogUnavailbleApi("tabs.onMoved"); return bridgeHelper.fakeEvent; }
    get onSelectionChanged() {
        return bridgeLog.DoActionAndLog(() => {
            var fakeEvent = bridgeHelper.fakeEvent;
            fakeEvent.addListener = (callback) => {
                myBrowser.tabs.onActivated.addListener((activeInfo) => {
                    callback(activeInfo.tabId, { windowId: activeInfo.windowId });
                });
            };
            return fakeEvent;
        }, "tabs.onSelectionChanged", "tabs.onActivated", "tabs.onActivated");
    }
    duplicate(tabId, callback) {
        bridgeLog.DoActionAndLog(() => {
            this.get(tabId, function (tab) {
                if (typeof callback !== "undefined" && typeof callback !== "null") {
                    myBrowser.tabs.create({ url: tab.url }, callback);
                }
                else {
                    myBrowser.tabs.create({ url: tab.url });
                }
            });
        }, "tabs.duplicate", undefined, "tabs.create");
    }
    getAllInWindow(windowId, callback) {
        bridgeLog.DoActionAndLog(() => {
            this.query({ windowId: windowId }, callback);
        }, "tabs.getAllInWindow", "tabs.query", "tabs.query");
    }
    getSelected(windowId, callback) {
        bridgeLog.DoActionAndLog(() => {
            this.query({ active: true }, (tabs) => callback(tabs[0]));
        }, "tabs.getSelected", "tabs.query", "tabs.query");
    }
    sendRequest(tabId, request, responseCallback) {
        bridgeLog.DoActionAndLog(() => {
            this.sendMessage(tabId, request, responseCallback);
        }, "tabs.sendRequest", "tabs.sendMessage", "tabs.sendMessage");
    }
    captureVisibleTab(windowId, options, callback) {
        bridgeLog.LogUnavailbleApi("tabs.captureVisibleTab");
    }
    connect(tabId, connectInfo) {
        bridgeLog.LogUnavailbleApi("tabs.connect");
        return null;
    }
    highlight(highlightInfo, callback) {
        bridgeLog.LogUnavailbleApi("tabs.highlight");
    }
    move(tabId, moveProperties, callback) {
        bridgeLog.LogUnavailbleApi("tabs.move");
    }
    reload(tabId, reloadProperties, callback) {
        bridgeLog.LogUnavailbleApi("tabs.reload");
    }
}
class EdgeWebNavigationBridge {
    get onBeforeNavigate() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webNavigation.onBeforeNavigate; }, "webNavigation.onBeforeNavigate"); }
    get onCommitted() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webNavigation.onCommitted; }, "webNavigation.onCommitted"); }
    get onCompleted() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webNavigation.onCompleted; }, "webNavigation.onCompleted"); }
    get onCreatedNavigationTarget() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webNavigation.onCreatedNavigationTarget; }, "webNavigation.onCreatedNavigationTarget"); }
    get onDOMContentLoaded() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webNavigation.onDOMContentLoaded; }, "webNavigation.onDOMContentLoaded"); }
    get onErrorOccurred() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webNavigation.onErrorOccurred; }, "webNavigation.onErrorOccurred"); }
    get onHistoryStateUpdated() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webNavigation.onHistoryStateUpdated; }, "webNavigation.onHistoryStateUpdated"); }
    get onReferenceFragmentUpdated() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webNavigation.onReferenceFragmentUpdated; }, "webNavigation.onReferenceFragmentUpdated"); }
    get onTabReplaced() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webNavigation.onTabReplaced; }, "webNavigation.onTabReplaced"); }
    getAllFrames(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.webNavigation.getAllFrames(details, callback);
        }, "webNavigation.getAllFrames");
    }
    getFrame(details, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.webNavigation.getFrame(details, callback);
        }, "webNavigation.getFrame");
    }
}
class EdgeWebRequestBridge {
    get MAX_HANDLER_BEHAVIOR_CHANGED_CALLS_PER_10_MINUTES() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webRequest.MAX_HANDLER_BEHAVIOR_CHANGED_CALLS_PER_10_MINUTES; }, "webNavigation.MAX_HANDLER_BEHAVIOR_CHANGED_CALLS_PER_10_MINUTES"); }
    get onAuthRequired() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webRequest.onAuthRequired; }, "webNavigation.onAuthRequired"); }
    get onBeforeRedirect() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webRequest.onBeforeRedirect; }, "webNavigation.onBeforeRedirect"); }
    get onBeforeRequest() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webRequest.onBeforeRequest; }, "webNavigation.onBeforeRequest"); }
    get onBeforeSendHeaders() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webRequest.onBeforeSendHeaders; }, "webNavigation.onBeforeSendHeaders"); }
    get onCompleted() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webRequest.onCompleted; }, "webNavigation.onCompleted"); }
    get onErrorOccurred() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webRequest.onErrorOccurred; }, "webNavigation.onErrorOccurred"); }
    get onHeadersReceived() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webRequest.onHeadersReceived; }, "webNavigation.onHeadersReceived"); }
    get onResponseStarted() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webRequest.onResponseStarted; }, "webNavigation.onResponseStarted"); }
    get onSendHeaders() { return bridgeLog.DoActionAndLog(() => { return myBrowser.webRequest.onSendHeaders; }, "webNavigation.onSendHeaders"); }
    handlerBehaviorChanged(callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.webRequest.handlerBehaviorChanged(callback);
            }
            else {
                myBrowser.webRequest.handlerBehaviorChanged();
            }
        }, "webRequest.handlerBehaviorChanged");
    }
}
class EdgeWindowsBridge {
    get WINDOW_ID_CURRENT() { return bridgeLog.DoActionAndLog(() => { return myBrowser.windows.WINDOW_ID_CURRENT; }, "windows.WINDOW_ID_CURRENT"); }
    get WINDOW_ID_NONE() { return bridgeLog.DoActionAndLog(() => { return myBrowser.windows.WINDOW_ID_NONE; }, "windows.WINDOW_ID_NONE"); }
    get onCreated() { return bridgeLog.DoActionAndLog(() => { return myBrowser.windows.onCreated; }, "windows.onCreated"); }
    get onFocusChanged() { return bridgeLog.DoActionAndLog(() => { return myBrowser.windows.onFocusChanged; }, "windows.onFocusChanged"); }
    get onRemoved() { return bridgeLog.DoActionAndLog(() => { return myBrowser.windows.onRemoved; }, "windows.onRemoved"); }
    create(createData, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.windows.create(createData, callback);
            }
            else {
                myBrowser.windows.create(createData);
            }
        }, "windows.create");
    }
    get(windowId, getInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.windows.get(windowId, getInfo, callback);
        }, "windows.get");
    }
    getAll(getInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.windows.getAll(getInfo, callback);
        }, "windows.getAll");
    }
    getCurrent(getInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.windows.getCurrent(getInfo, callback);
        }, "windows.getCurrent");
    }
    getLastFocused(getInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            myBrowser.windows.getLastFocused(getInfo, callback);
        }, "windows.getLastFocused");
    }
    update(windowId, updateInfo, callback) {
        bridgeLog.DoActionAndLog(() => {
            if (typeof callback !== "undefined" && typeof callback !== "null") {
                myBrowser.windows.update(windowId, updateInfo, callback);
            }
            else {
                myBrowser.windows.update(windowId, updateInfo);
            }
        }, "windows.update");
    }
}
class EdgeChromeWindowsBridge extends EdgeWindowsBridge {
    remove(windowId, callback) {
        bridgeLog.LogUnavailbleApi("windows.remove");
    }
}
class EdgeBackgroundBridge {
    constructor() {
        this.app = new EdgeChromeAppBridge();
        this.browserAction = typeof browser.browserAction !== "undefined" ? new EdgeChromeBrowserActionBridge() : undefined;
        this.contextMenus = typeof browser.contextMenus !== "undefined" ? new EdgeContextMenusBridge() : undefined;
        this.cookies = typeof browser.cookies !== "undefined" ? new EdgeChromeCookiesBridge() : undefined;
        this.extension = typeof browser.extension !== "undefined" ? new EdgeChromeExtensionBridge() : undefined;
        this.history = typeof browser.history !== "undefined" ? new EdgeHistoryBridge() : undefined;
        this.i18n = typeof browser.i18n !== "undefined" ? new EdgeI18nBridge() : undefined;
        this.notifications = typeof browser.notifications !== "undefined" ? new EdgeNotificationBridge() : undefined;
        this.pageAction = typeof browser.pageAction !== "undefined" ? new EdgePageActionBridge() : undefined;
        this.permissions = typeof browser.permissions !== "undefined" ? new EdgePermissionsBridge() : undefined;
        this.runtime = typeof browser.runtime !== "undefined" ? new EdgeChromeRuntimeBridge() : undefined;
        this.storage = typeof browser.storage !== "undefined" ? new EdgeChromeStorageBridge() : undefined;
        this.tabs = typeof browser.tabs !== "undefined" ? new EdgeChromeTabsBridge() : undefined;
        this.webNavigation = typeof browser.webNavigation !== "undefined" ? new EdgeWebNavigationBridge() : undefined;
        this.webRequest = typeof browser.webRequest !== "undefined" ? new EdgeWebRequestBridge() : undefined;
        this.windows = typeof browser.windows !== "undefined" ? new EdgeChromeWindowsBridge() : undefined;
    }
}
var myBrowser = browser;
var chrome = new EdgeBackgroundBridge();
