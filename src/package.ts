import { SuccessCallback } from "./callbackUtil";
import { InstallMode } from "./installMode";
import { InstallOptions } from "./installOptions";

/**
 * Defines a package. All fields are non-nullable, except when retrieving the currently running package on the first run of the app,
 * in which case only the appVersion is compulsory.
 *
 * !! THIS TYPE IS READ FROM NATIVE CODE AS WELL. ANY CHANGES TO THIS INTERFACE NEEDS TO BE UPDATED IN NATIVE CODE !!
 */
export interface IPackage {
    deploymentKey: string;
    description: string;
    label: string;
    appVersion: string;
    isMandatory: boolean;
    packageHash: string;
    packageSize: number;
    failedInstall: boolean;
}

/**
 * Defines the format of the DownloadProgress object, used to send periodical update notifications on the progress of the update download.
 */
export interface DownloadProgress {
    totalBytes: number;
    receivedBytes: number;
}

/**
 * Defines a remote package, which represents an update package available for download.
 */
export interface IRemotePackage extends IPackage {
    /**
     * The URL at which the package is available for download.
     */
    downloadUrl: string;

    /**
     * Downloads the package update from the CodePush service.
     *
     * @param downloadProgress Optional callback invoked during the download process. It is called several times with one DownloadProgress parameter.
     * @returns the downloaded package information, once the download completed successfully.
     */
    download(downloadProgress?: SuccessCallback<DownloadProgress>): Promise<ILocalPackage>;

    /**
     * Aborts the current download session, previously started with download().
     */
    abortDownload(): Promise<void>;
}

/**
 * Defines a local package.
 *
 * !! THIS TYPE IS READ FROM NATIVE CODE AS WELL. ANY CHANGES TO THIS INTERFACE NEEDS TO BE UPDATED IN NATIVE CODE !!
 */
export interface ILocalPackage extends IPackage {
    /**
     * The local storage path where this package is located.
     */
    localPath: string;

    /**
     * Indicates if the current application run is the first one after the package was applied.
     */
    isFirstRun: boolean;

    /**
     * Applies this package to the application. The application will be reloaded with this package and on every application launch this package will be loaded.
     * On the first run after the update, the application will wait for a codePush.notifyApplicationReady() call. Once this call is made, the install operation is considered a success.
     * Otherwise, the install operation will be marked as failed, and the application is reverted to its previous version on the next run.
     *
     * @param installOptions Optional parameter used for customizing the installation behavior.
     * @returns the install mode.
     */
    install(installOptions?: InstallOptions): Promise<InstallMode>;
}

/**
 * Defines the JSON format of the current package information file.
 * This file is stored in the local storage of the device and persists between store updates and code-push updates.
 *
 * !! THIS FILE IS READ FROM NATIVE CODE AS WELL. ANY CHANGES TO THIS INTERFACE NEEDS TO BE UPDATED IN NATIVE CODE !!
 */
export interface IPackageInfoMetadata extends ILocalPackage {
    nativeBuildTime: string;
}

/**
 * Base class for CodePush packages.
 */
export class Package implements IPackage {
    deploymentKey: string;
    description: string;
    label: string;
    appVersion: string;
    isMandatory: boolean;
    packageHash: string;
    packageSize: number;
    failedInstall: boolean;
}
