/// <reference path="../typings/codePush.d.ts" />

import { FilesystemDirectory, Plugins } from "@capacitor/core";
import LocalPackage = require("./localPackage");
import Package = require("./package");
import NativeAppInfo = require("./nativeAppInfo");
import CodePushUtil = require("./codePushUtil");
import Sdk = require("./sdk");

const { Filesystem, FileTransfer } = Plugins;

/**
 * Defines a remote package, which represents an update package available for download.
 */
class RemotePackage extends Package implements IRemotePackage {

    /**
     * The URL at which the package is available for download.
     */
    public downloadUrl: string;
    
    /**
     * Downloads the package update from the CodePush service.
     * TODO: implement download progress
     * 
     * @param downloadSuccess Called with one parameter, the downloaded package information, once the download completed successfully.
     * @param downloadError Optional callback invoked in case of an error.
     * @param downloadProgress Optional callback invoked during the download process. It is called several times with one DownloadProgress parameter.
     */
    public async download(downloadProgress?: SuccessCallback<DownloadProgress>): Promise<ILocalPackage> {
        CodePushUtil.logMessage("Downloading update");
        if (!this.downloadUrl) {
            CodePushUtil.throwError(new Error("The remote package does not contain a download URL."));
            return;
        }

        const dataDirectory = await Filesystem.getUri({directory: FilesystemDirectory.Data, path: ""});
        const file = dataDirectory.uri + "/" + LocalPackage.DownloadDir + "/" + LocalPackage.PackageUpdateFileName;

        try {
            await FileTransfer.download({source: this.downloadUrl, target: file});
        } catch (e) {
            CodePushUtil.throwError(new Error("An error occured while downloading the package. " + (e && e.message) ? e.message : ""));
            return;
        }

        const installFailed = await NativeAppInfo.isFailedUpdate(this.packageHash);
        const localPackage = new LocalPackage();
        localPackage.deploymentKey = this.deploymentKey;
        localPackage.description = this.description;
        localPackage.label = this.label;
        localPackage.appVersion = this.appVersion;
        localPackage.isMandatory = this.isMandatory;
        localPackage.packageHash = this.packageHash;
        localPackage.isFirstRun = false;
        localPackage.failedInstall = installFailed;
        localPackage.localPath = file;

        CodePushUtil.logMessage("Package download success: " + JSON.stringify(localPackage));
        Sdk.reportStatusDownload(localPackage, localPackage.deploymentKey);

        return localPackage;
    }
    
    /**
     * Aborts the current download session, previously started with download().
     */
    public async abortDownload(): Promise<void> {
        // TODO: implement download abort
        throw new Error("Not implemented");
    }
}

export = RemotePackage;
