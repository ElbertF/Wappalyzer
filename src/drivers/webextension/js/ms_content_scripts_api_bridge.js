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
class EdgeContentBridge {
    constructor() {
        this.extension = typeof browser.extension !== "undefined" ? new EdgeChromeExtensionBridge() : undefined;
        this.i18n = typeof browser.i18n !== "undefined" ? new EdgeI18nBridge() : undefined;
        this.runtime = typeof browser.runtime !== "undefined" ? new EdgeChromeRuntimeBridge() : undefined;
        this.storage = typeof browser.storage !== "undefined" ? new EdgeChromeStorageBridge() : undefined;
    }
}
var myBrowser = browser;
var chrome = new EdgeContentBridge();
