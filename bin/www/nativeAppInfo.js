
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
const DefaultServerUrl = "https://codepush.azurewebsites.net/";
class NativeAppInfo {
    static getApplicationBuildTime(callback) {
        var timestampSuccess = (timestamp) => { callback(null, timestamp); };
        var timestampError = () => { callback(new Error("Could not get application timestamp."), null); };
        cordova.exec(timestampSuccess, timestampError, "CodePush", "getNativeBuildTime", []);
    }
    static getApplicationVersion(callback) {
        var versionSuccess = (version) => { callback(null, version); };
        var versionError = () => { callback(new Error("Could not get application version."), null); };
        cordova.exec(versionSuccess, versionError, "CodePush", "getAppVersion", []);
    }
    static getBinaryHash(callback) {
        var binaryHashSuccess = (binaryHash) => { callback(null, binaryHash); };
        var binaryHashError = () => { callback(new Error("Could not get binary hash."), null); };
        cordova.exec(binaryHashSuccess, binaryHashError, "CodePush", "getBinaryHash", []);
    }
    static getServerURL(serverCallback) {
        var serverSuccess = (serverURL) => { serverCallback(null, serverURL); };
        var serverError = () => { serverCallback(null, DefaultServerUrl); };
        cordova.exec(serverSuccess, serverError, "CodePush", "getServerURL", []);
    }
    static getDeploymentKey(deploymentKeyCallback) {
        var deploymentSuccess = (deploymentKey) => { deploymentKeyCallback(null, deploymentKey); };
        var deploymentError = () => { deploymentKeyCallback(new Error("Deployment key not found."), null); };
        cordova.exec(deploymentSuccess, deploymentError, "CodePush", "getDeploymentKey", []);
    }
    static isFailedUpdate(packageHash, checkCallback) {
        var win = (failed) => {
            checkCallback && checkCallback(!!failed);
        };
        var fail = (e) => {
            win(0);
        };
        cordova.exec(win, fail, "CodePush", "isFailedUpdate", [packageHash]);
    }
    static isFirstRun(packageHash, firstRunCallback) {
        var win = (firstRun) => {
            firstRunCallback(!!firstRun);
        };
        var fail = () => {
            firstRunCallback(false);
        };
        cordova.exec(win, fail, "CodePush", "isFirstRun", [packageHash]);
    }
    static isPendingUpdate(callback) {
        var win = (firstRun) => {
            callback(!!firstRun);
        };
        var fail = () => {
            callback(false);
        };
        cordova.exec(win, fail, "CodePush", "isPendingUpdate", []);
    }
}
module.exports = NativeAppInfo;
