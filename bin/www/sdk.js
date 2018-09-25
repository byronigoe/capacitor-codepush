
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
const NativeAppInfo = require("./nativeAppInfo");
const HttpRequester = require("./httpRequester");
const core_1 = require("@capacitor/core");
const acquisition_sdk_1 = require("code-push/script/acquisition-sdk");
const { Device } = core_1.Plugins;
class Sdk {
    static async getAcquisitionManager(userDeploymentKey, contentType) {
        const resolveManager = () => {
            if (userDeploymentKey !== Sdk.DefaultConfiguration.deploymentKey || contentType) {
                var customConfiguration = {
                    deploymentKey: userDeploymentKey || Sdk.DefaultConfiguration.deploymentKey,
                    serverUrl: Sdk.DefaultConfiguration.serverUrl,
                    ignoreAppVersion: Sdk.DefaultConfiguration.ignoreAppVersion,
                    appVersion: Sdk.DefaultConfiguration.appVersion,
                    clientUniqueId: Sdk.DefaultConfiguration.clientUniqueId
                };
                var requester = new HttpRequester(contentType);
                var customAcquisitionManager = new acquisition_sdk_1.AcquisitionManager(requester, customConfiguration);
                return Promise.resolve(customAcquisitionManager);
            }
            else if (Sdk.DefaultConfiguration.deploymentKey) {
                return Promise.resolve(Sdk.DefaultAcquisitionManager);
            }
            else {
                return Promise.reject(new Error("No deployment key provided, please provide a default one in your config.xml or specify one in the call to checkForUpdate() or sync()."));
            }
        };
        if (Sdk.DefaultAcquisitionManager) {
            return resolveManager();
        }
        else {
            let serverUrl = null;
            try {
                serverUrl = await NativeAppInfo.getServerURL();
            }
            catch (e) {
                throw new Error("Could not get the CodePush configuration. Please check your config.xml file.");
            }
            let appVersion = null;
            try {
                appVersion = await NativeAppInfo.getApplicationVersion();
            }
            catch (e) {
                throw new Error("Could not get the app version. Please check your config.xml file.");
            }
            let deploymentKey = null;
            try {
                deploymentKey = await NativeAppInfo.getDeploymentKey();
            }
            catch (e) { }
            const device = await Device.getInfo();
            Sdk.DefaultConfiguration = {
                deploymentKey,
                serverUrl,
                ignoreAppVersion: false,
                appVersion,
                clientUniqueId: device.uuid
            };
            if (deploymentKey) {
                Sdk.DefaultAcquisitionManager = new acquisition_sdk_1.AcquisitionManager(new HttpRequester(), Sdk.DefaultConfiguration);
            }
            return resolveManager();
        }
    }
    static async reportStatusDeploy(pkg, status, currentDeploymentKey, previousLabelOrAppVersion, previousDeploymentKey, callback) {
        try {
            const acquisitionManager = await Sdk.getAcquisitionManager(currentDeploymentKey, "application/json");
            acquisitionManager.reportStatusDeploy(pkg, status, previousLabelOrAppVersion, previousDeploymentKey, callback);
        }
        catch (e) {
            callback && callback(e, null);
        }
    }
    static async reportStatusDownload(pkg, deploymentKey, callback) {
        try {
            const acquisitionManager = await Sdk.getAcquisitionManager(deploymentKey, "application/json");
            acquisitionManager.reportStatusDownload(pkg, callback);
        }
        catch (e) {
            callback && callback(new Error("An error occured while reporting the download status. " + e), null);
        }
    }
}
module.exports = Sdk;
