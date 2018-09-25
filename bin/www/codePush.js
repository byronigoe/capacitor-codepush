
 /******************************************************************************************** 
 	 THIS FILE HAS BEEN COMPILED FROM TYPESCRIPT SOURCES. 
 	 PLEASE DO NOT MODIFY THIS FILE DIRECTLY AS YOU WILL LOSE YOUR CHANGES WHEN RECOMPILING. 
 	 INSTEAD, EDIT THE TYPESCRIPT SOURCES UNDER THE WWW FOLDER, AND THEN RUN GULP. 
 	 FOR MORE INFORMATION, PLEASE SEE CONTRIBUTING.md. 
 *********************************************************************************************/ 


"use strict";
const core_1 = require("@capacitor/core");
const installMode_1 = require("./installMode");
const LocalPackage = require("./localPackage");
const RemotePackage = require("./remotePackage");
const CodePushUtil = require("./codePushUtil");
const NativeAppInfo = require("./nativeAppInfo");
const Sdk = require("./sdk");
const SyncStatus = require("./syncStatus");
const { Modals } = core_1.Plugins;
const NativeCodePush = core_1.Plugins.CodePush;
class CodePush {
    notifyApplicationReady() {
        return NativeCodePush.notifyApplicationReady();
    }
    restartApplication() {
        return NativeCodePush.restartApplication();
    }
    reportStatus(status, label, appVersion, deploymentKey, previousLabelOrAppVersion, previousDeploymentKey) {
        if (((!label && appVersion === previousLabelOrAppVersion) || label === previousLabelOrAppVersion)
            && deploymentKey === previousDeploymentKey) {
            return;
        }
        var createPackageForReporting = (label, appVersion) => {
            return {
                label, appVersion, deploymentKey,
                description: null, isMandatory: false,
                packageHash: null, packageSize: null,
                failedInstall: false
            };
        };
        var reportDone = (error) => {
            var reportArgs = {
                status,
                label,
                appVersion,
                deploymentKey,
                previousLabelOrAppVersion,
                previousDeploymentKey
            };
            if (error) {
                CodePushUtil.logError(`An error occurred while reporting status: ${JSON.stringify(reportArgs)}`, error);
                NativeCodePush.reportFailed({ statusReport: reportArgs });
            }
            else {
                CodePushUtil.logMessage(`Reported status: ${JSON.stringify(reportArgs)}`);
                NativeCodePush.reportSucceeded({ statusReport: reportArgs });
            }
        };
        switch (status) {
            case ReportStatus.STORE_VERSION:
                Sdk.reportStatusDeploy(null, AcquisitionStatus.DeploymentSucceeded, deploymentKey, previousLabelOrAppVersion, previousDeploymentKey, reportDone);
                break;
            case ReportStatus.UPDATE_CONFIRMED:
                Sdk.reportStatusDeploy(createPackageForReporting(label, appVersion), AcquisitionStatus.DeploymentSucceeded, deploymentKey, previousLabelOrAppVersion, previousDeploymentKey, reportDone);
                break;
            case ReportStatus.UPDATE_ROLLED_BACK:
                Sdk.reportStatusDeploy(createPackageForReporting(label, appVersion), AcquisitionStatus.DeploymentFailed, deploymentKey, previousLabelOrAppVersion, previousDeploymentKey, reportDone);
                break;
        }
    }
    async getCurrentPackage() {
        const pendingUpdate = await NativeAppInfo.isPendingUpdate();
        var packageInfoFile = pendingUpdate ? LocalPackage.OldPackageInfoFile : LocalPackage.PackageInfoFile;
        return new Promise((resolve, reject) => {
            LocalPackage.getPackageInfoOrNull(packageInfoFile, resolve, reject);
        });
    }
    async getPendingPackage() {
        const pendingUpdate = await NativeAppInfo.isPendingUpdate();
        if (!pendingUpdate)
            return null;
        return new Promise((resolve, reject) => {
            LocalPackage.getPackageInfoOrNull(LocalPackage.PackageInfoFile, resolve, reject);
        });
    }
    checkForUpdate(querySuccess, queryError, deploymentKey) {
        try {
            var callback = async (error, remotePackageOrUpdateNotification) => {
                if (error) {
                    CodePushUtil.invokeErrorCallback(error, queryError);
                }
                else {
                    var appUpToDate = () => {
                        CodePushUtil.logMessage("App is up to date.");
                        querySuccess && querySuccess(null);
                    };
                    if (remotePackageOrUpdateNotification) {
                        if (remotePackageOrUpdateNotification.updateAppVersion) {
                            CodePushUtil.logMessage("An update is available, but it is targeting a newer binary version than you are currently running.");
                            appUpToDate();
                        }
                        else {
                            var remotePackage = remotePackageOrUpdateNotification;
                            const installFailed = await NativeAppInfo.isFailedUpdate(remotePackage.packageHash);
                            var result = new RemotePackage();
                            result.appVersion = remotePackage.appVersion;
                            result.deploymentKey = deploymentKey;
                            result.description = remotePackage.description;
                            result.downloadUrl = remotePackage.downloadUrl;
                            result.isMandatory = remotePackage.isMandatory;
                            result.label = remotePackage.label;
                            result.packageHash = remotePackage.packageHash;
                            result.packageSize = remotePackage.packageSize;
                            result.failedInstall = installFailed;
                            CodePushUtil.logMessage("An update is available. " + JSON.stringify(result));
                            querySuccess && querySuccess(result);
                        }
                    }
                    else {
                        appUpToDate();
                    }
                }
            };
            var queryUpdate = async () => {
                try {
                    const acquisitionManager = await Sdk.getAcquisitionManager(deploymentKey);
                    LocalPackage.getCurrentOrDefaultPackage().then(async (localPackage) => {
                        try {
                            const currentBinaryVersion = await NativeAppInfo.getApplicationVersion();
                            localPackage.appVersion = currentBinaryVersion;
                        }
                        catch (e) { }
                        CodePushUtil.logMessage("Checking for update.");
                        acquisitionManager.queryUpdateWithCurrentPackage(localPackage, callback);
                    }, (error) => {
                        CodePushUtil.invokeErrorCallback(error, queryError);
                    });
                }
                catch (e) {
                    CodePushUtil.invokeErrorCallback(e, queryError);
                }
            };
            if (deploymentKey) {
                queryUpdate();
            }
            else {
                NativeAppInfo.getDeploymentKey().then(defaultDeploymentKey => {
                    deploymentKey = defaultDeploymentKey;
                    queryUpdate();
                }, deploymentKeyError => {
                    CodePushUtil.invokeErrorCallback(deploymentKeyError, queryError);
                });
            }
        }
        catch (e) {
            CodePushUtil.invokeErrorCallback(new Error("An error occurred while querying for updates." + CodePushUtil.getErrorMessage(e)), queryError);
        }
    }
    async sync(syncOptions, downloadProgress) {
        if (CodePush.SyncInProgress) {
            CodePushUtil.logMessage("Sync already in progress.");
            return SyncStatus.IN_PROGRESS;
        }
        return new Promise((resolve, reject) => {
            var syncCallbackAndUpdateSyncInProgress = (err, result) => {
                switch (result) {
                    case SyncStatus.ERROR:
                    case SyncStatus.IN_PROGRESS:
                    case SyncStatus.UP_TO_DATE:
                    case SyncStatus.UPDATE_IGNORED:
                    case SyncStatus.UPDATE_INSTALLED:
                        CodePush.SyncInProgress = false;
                    default:
                        break;
                }
                if (err) {
                    reject(err);
                }
                resolve(result);
            };
            CodePush.SyncInProgress = true;
            this.syncInternal(syncCallbackAndUpdateSyncInProgress, syncOptions, downloadProgress);
        });
    }
    syncInternal(syncCallback, syncOptions, downloadProgress) {
        if (!syncOptions) {
            syncOptions = this.getDefaultSyncOptions();
        }
        else {
            var defaultDialogOptions = this.getDefaultUpdateDialogOptions();
            if (syncOptions.updateDialog) {
                if (typeof syncOptions.updateDialog !== typeof ({})) {
                    syncOptions.updateDialog = defaultDialogOptions;
                }
                else {
                    CodePushUtil.copyUnassignedMembers(defaultDialogOptions, syncOptions.updateDialog);
                }
            }
            var defaultOptions = this.getDefaultSyncOptions();
            CodePushUtil.copyUnassignedMembers(defaultOptions, syncOptions);
        }
        this.notifyApplicationReady();
        var onError = (error) => {
            CodePushUtil.logError("An error occurred during sync.", error);
            syncCallback && syncCallback(error, SyncStatus.ERROR);
        };
        var onInstallSuccess = (appliedWhen) => {
            switch (appliedWhen) {
                case installMode_1.default.ON_NEXT_RESTART:
                    CodePushUtil.logMessage("Update is installed and will be run on the next app restart.");
                    break;
                case installMode_1.default.ON_NEXT_RESUME:
                    if (syncOptions.minimumBackgroundDuration > 0) {
                        CodePushUtil.logMessage(`Update is installed and will be run after the app has been in the background for at least ${syncOptions.minimumBackgroundDuration} seconds.`);
                    }
                    else {
                        CodePushUtil.logMessage("Update is installed and will be run when the app next resumes.");
                    }
                    break;
            }
            syncCallback && syncCallback(null, SyncStatus.UPDATE_INSTALLED);
        };
        var onDownloadSuccess = (localPackage) => {
            syncCallback && syncCallback(null, SyncStatus.INSTALLING_UPDATE);
            localPackage.install(syncOptions).then(onInstallSuccess, onError);
        };
        var downloadAndInstallUpdate = (remotePackage) => {
            syncCallback && syncCallback(null, SyncStatus.DOWNLOADING_PACKAGE);
            remotePackage.download(downloadProgress).then(onDownloadSuccess, onError);
        };
        var onUpdate = async (remotePackage) => {
            var updateShouldBeIgnored = remotePackage && (remotePackage.failedInstall && syncOptions.ignoreFailedUpdates);
            if (!remotePackage || updateShouldBeIgnored) {
                if (updateShouldBeIgnored) {
                    CodePushUtil.logMessage("An update is available, but it is being ignored due to have been previously rolled back.");
                }
                syncCallback && syncCallback(null, SyncStatus.UP_TO_DATE);
            }
            else {
                var dlgOpts = syncOptions.updateDialog;
                if (dlgOpts) {
                    CodePushUtil.logMessage("Awaiting user action.");
                    syncCallback && syncCallback(null, SyncStatus.AWAITING_USER_ACTION);
                }
                if (remotePackage.isMandatory && syncOptions.updateDialog) {
                    var message = dlgOpts.appendReleaseDescription ?
                        dlgOpts.mandatoryUpdateMessage + dlgOpts.descriptionPrefix + remotePackage.description
                        : dlgOpts.mandatoryUpdateMessage;
                    await Modals.alert({
                        message,
                        title: dlgOpts.updateTitle,
                        buttonTitle: dlgOpts.mandatoryContinueButtonLabel
                    });
                    downloadAndInstallUpdate(remotePackage);
                }
                else if (!remotePackage.isMandatory && syncOptions.updateDialog) {
                    var message = dlgOpts.appendReleaseDescription ?
                        dlgOpts.optionalUpdateMessage + dlgOpts.descriptionPrefix + remotePackage.description
                        : dlgOpts.optionalUpdateMessage;
                    const confirmResult = await Modals.confirm({
                        message,
                        title: dlgOpts.updateTitle,
                        okButtonTitle: dlgOpts.optionalInstallButtonLabel,
                        cancelButtonTitle: dlgOpts.optionalIgnoreButtonLabel
                    });
                    if (confirmResult.value) {
                        downloadAndInstallUpdate(remotePackage);
                    }
                    else {
                        CodePushUtil.logMessage("User cancelled the update.");
                        syncCallback && syncCallback(null, SyncStatus.UPDATE_IGNORED);
                    }
                }
                else {
                    downloadAndInstallUpdate(remotePackage);
                }
            }
        };
        syncCallback && syncCallback(null, SyncStatus.CHECKING_FOR_UPDATE);
        this.checkForUpdate(onUpdate, onError, syncOptions.deploymentKey);
    }
    getDefaultSyncOptions() {
        if (!CodePush.DefaultSyncOptions) {
            CodePush.DefaultSyncOptions = {
                ignoreFailedUpdates: true,
                installMode: installMode_1.default.ON_NEXT_RESTART,
                minimumBackgroundDuration: 0,
                mandatoryInstallMode: installMode_1.default.IMMEDIATE,
                updateDialog: false,
                deploymentKey: undefined
            };
        }
        return CodePush.DefaultSyncOptions;
    }
    getDefaultUpdateDialogOptions() {
        if (!CodePush.DefaultUpdateDialogOptions) {
            CodePush.DefaultUpdateDialogOptions = {
                updateTitle: "Update available",
                mandatoryUpdateMessage: "An update is available that must be installed.",
                mandatoryContinueButtonLabel: "Continue",
                optionalUpdateMessage: "An update is available. Would you like to install it?",
                optionalInstallButtonLabel: "Install",
                optionalIgnoreButtonLabel: "Ignore",
                appendReleaseDescription: false,
                descriptionPrefix: " Description: "
            };
        }
        return CodePush.DefaultUpdateDialogOptions;
    }
}
var ReportStatus;
(function (ReportStatus) {
    ReportStatus[ReportStatus["STORE_VERSION"] = 0] = "STORE_VERSION";
    ReportStatus[ReportStatus["UPDATE_CONFIRMED"] = 1] = "UPDATE_CONFIRMED";
    ReportStatus[ReportStatus["UPDATE_ROLLED_BACK"] = 2] = "UPDATE_ROLLED_BACK";
})(ReportStatus || (ReportStatus = {}));
var instance = new CodePush();
module.exports = instance;
