/// <reference path="../typings/codePush.d.ts" />

"use strict";

declare var cordova: Cordova;

import LocalPackage = require("./localPackage");
import Package = require("./package");
import NativeAppInfo = require("./nativeAppInfo");
import CodePushUtil = require("./codePushUtil");
import Sdk = require("./sdk");

/**
 * Defines a remote package, which represents an update package available for download.
 */
class RemotePackage extends Package implements IRemotePackage {

    private currentFileTransfer: FileTransfer;

    /**
     * The URL at which the package is available for download.
     */
    public downloadUrl: string;
    
    /**
     * Downloads the package update from the CodePush service.
     * 
     * @param downloadSuccess Called with one parameter, the downloaded package information, once the download completed successfully.
     * @param downloadError Optional callback invoked in case of an error.
     * @param downloadProgress Optional callback invoked during the download process. It is called several times with one DownloadProgress parameter.
     */
    public download(downloadProgress?: SuccessCallback<DownloadProgress>): Promise<ILocalPackage> {
        try {
            CodePushUtil.logMessage("Downloading update");
            if (!this.downloadUrl) {
                CodePushUtil.throwError(new Error("The remote package does not contain a download URL."));
            } else {
                this.currentFileTransfer = new FileTransfer();

                return new Promise<ILocalPackage>((resolve, reject) => {
                    var downloadSuccess = (fileEntry: FileEntry) => {
                        this.currentFileTransfer = null;

                        fileEntry.file(async (file: File) => {
                            const installFailed = await NativeAppInfo.isFailedUpdate(this.packageHash)
                            var localPackage = new LocalPackage();
                            localPackage.deploymentKey = this.deploymentKey;
                            localPackage.description = this.description;
                            localPackage.label = this.label;
                            localPackage.appVersion = this.appVersion;
                            localPackage.isMandatory = this.isMandatory;
                            localPackage.packageHash = this.packageHash;
                            localPackage.isFirstRun = false;
                            localPackage.failedInstall = installFailed;
                            localPackage.localPath = fileEntry.toInternalURL();

                            CodePushUtil.logMessage("Package download success: " + JSON.stringify(localPackage));
                            resolve(localPackage);
                            Sdk.reportStatusDownload(localPackage, localPackage.deploymentKey);
                        }, (fileError: FileError) => {
                            CodePushUtil.invokeErrorCallback(new Error("Could not access local package. Error code: " + fileError.code), reject);
                        });
                    };

                    var downloadError = (error: FileTransferError) => {
                        this.currentFileTransfer = null;
                        CodePushUtil.invokeErrorCallback(new Error(error.body), reject);
                    };

                    this.currentFileTransfer.onprogress = (progressEvent: ProgressEvent) => {
                        if (downloadProgress) {
                            var dp: DownloadProgress = { receivedBytes: progressEvent.loaded, totalBytes: progressEvent.total };
                            downloadProgress(dp);
                        }
                    };

                    this.currentFileTransfer.download(this.downloadUrl, cordova.file.dataDirectory + LocalPackage.DownloadDir + "/" + LocalPackage.PackageUpdateFileName, downloadSuccess, downloadError, true);
                })
            }
        } catch (e) {
            CodePushUtil.throwError(new Error("An error occured while downloading the package. " + (e && e.message) ? e.message : ""));
        }
    }
    
    /**
     * Aborts the current download session, previously started with download().
     */
    public async abortDownload(): Promise<void> {
        if (this.currentFileTransfer) {
            this.currentFileTransfer.abort();
        }
    }
}

export = RemotePackage;
