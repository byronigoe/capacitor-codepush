
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
const { Device } = core_1.Plugins;
class Sdk {
    static getAcquisitionManager(callback, userDeploymentKey, contentType) {
        var resolveManager = () => {
            if (userDeploymentKey !== Sdk.DefaultConfiguration.deploymentKey || contentType) {
                var customConfiguration = {
                    deploymentKey: userDeploymentKey || Sdk.DefaultConfiguration.deploymentKey,
                    serverUrl: Sdk.DefaultConfiguration.serverUrl,
                    ignoreAppVersion: Sdk.DefaultConfiguration.ignoreAppVersion,
                    appVersion: Sdk.DefaultConfiguration.appVersion,
                    clientUniqueId: Sdk.DefaultConfiguration.clientUniqueId
                };
                var requester = new HttpRequester(contentType);
                var customAcquisitionManager = new AcquisitionManager(requester, customConfiguration);
                callback(null, customAcquisitionManager);
            }
            else if (Sdk.DefaultConfiguration.deploymentKey) {
                callback(null, Sdk.DefaultAcquisitionManager);
            }
            else {
                callback(new Error("No deployment key provided, please provide a default one in your config.xml or specify one in the call to checkForUpdate() or sync()."), null);
            }
        };
        if (Sdk.DefaultAcquisitionManager) {
            resolveManager();
        }
        else {
            NativeAppInfo.getServerURL((serverError, serverURL) => {
                NativeAppInfo.getDeploymentKey((depolymentKeyError, deploymentKey) => {
                    NativeAppInfo.getApplicationVersion(async (appVersionError, appVersion) => {
                        if (!appVersion) {
                            callback(new Error("Could not get the app version. Please check your config.xml file."), null);
                        }
                        else if (!serverURL) {
                            callback(new Error("Could not get the CodePush configuration. Please check your config.xml file."), null);
                        }
                        else {
                            const device = await Device.getInfo();
                            Sdk.DefaultConfiguration = {
                                deploymentKey: deploymentKey,
                                serverUrl: serverURL,
                                ignoreAppVersion: false,
                                appVersion: appVersion,
                                clientUniqueId: device.uuid
                            };
                            if (deploymentKey) {
                                Sdk.DefaultAcquisitionManager = new AcquisitionManager(new HttpRequester(), Sdk.DefaultConfiguration);
                            }
                            resolveManager();
                        }
                    });
                });
            });
        }
    }
    static reportStatusDeploy(pkg, status, currentDeploymentKey, previousLabelOrAppVersion, previousDeploymentKey, callback) {
        try {
            Sdk.getAcquisitionManager((error, acquisitionManager) => {
                if (error) {
                    callback && callback(error, null);
                }
                else {
                    acquisitionManager.reportStatusDeploy(pkg, status, previousLabelOrAppVersion, previousDeploymentKey, callback);
                }
            }, currentDeploymentKey, "application/json");
        }
        catch (e) {
            callback && callback(e, null);
        }
    }
    static reportStatusDownload(pkg, deploymentKey, callback) {
        try {
            Sdk.getAcquisitionManager((error, acquisitionManager) => {
                if (error) {
                    callback && callback(error, null);
                }
                else {
                    acquisitionManager.reportStatusDownload(pkg, callback);
                }
            }, deploymentKey, "application/json");
        }
        catch (e) {
            callback && callback(new Error("An error occured while reporting the download status. " + e), null);
        }
    }
}
module.exports = Sdk;
