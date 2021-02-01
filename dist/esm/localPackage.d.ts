import { Callback, ErrorCallback, SuccessCallback } from "./callbackUtil";
import { InstallMode } from "./installMode";
import { InstallOptions } from "./installOptions";
import { ILocalPackage, IPackageInfoMetadata, Package } from "./package";
/**
 * Defines a local package.
 *
 * !! THIS TYPE IS READ FROM NATIVE CODE AS WELL. ANY CHANGES TO THIS INTERFACE NEEDS TO BE UPDATED IN NATIVE CODE !!
 */
export declare class LocalPackage extends Package implements ILocalPackage {
    static RootDir: string;
    static DownloadDir: string;
    private static DownloadUnzipDir;
    private static DeployDir;
    private static VersionsDir;
    static PackageUpdateFileName: string;
    static PackageInfoFile: string;
    static OldPackageInfoFile: string;
    private static DiffManifestFile;
    private static DefaultInstallOptions;
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
     */
    install(installOptions?: InstallOptions): Promise<InstallMode>;
    private verifyPackage;
    private getPublicKey;
    private getSignatureFromUpdate;
    private verifyHash;
    private verifySignature;
    private finishInstall;
    private static handleDeployment;
    private writeNewPackageMetadata;
    private static handleCleanDeployment;
    private static copyCurrentPackage;
    private static handleDiffDeployment;
    /**
    * Writes the given local package information to the current package information file.
    * @param packageInfoMetadata The object to serialize.
    * @param callback In case of an error, this function will be called with the error as the fist parameter.
    */
    static writeCurrentPackageInformation(packageInfoMetadata: IPackageInfoMetadata, callback: Callback<void>): void;
    /**
     * Backs up the current package information to the old package information file.
     * This file is used for recovery in case of an update going wrong.
     * @param callback In case of an error, this function will be called with the error as the fist parameter.
     */
    static backupPackageInformationFile(): Promise<void>;
    /**
     * Get the previous package information.
     *
     * @param packageSuccess Callback invoked with the old package information.
     * @param packageError Optional callback invoked in case of an error.
     */
    static getOldPackage(packageSuccess: SuccessCallback<LocalPackage>, packageError?: ErrorCallback): void;
    /**
     * Reads package information from a given file.
     *
     * @param packageFile The package file name.
     * @param packageSuccess Callback invoked with the package information.
     * @param packageError Optional callback invoked in case of an error.
     */
    static getPackage(packageFile: string, packageSuccess: SuccessCallback<LocalPackage>, packageError?: ErrorCallback): Promise<void>;
    private static getLocalPackageFromMetadata;
    static getCurrentOrDefaultPackage(): Promise<LocalPackage>;
    static getOldOrDefaultPackage(): Promise<LocalPackage>;
    static getPackageInfoOrDefault(packageFile: string): Promise<LocalPackage>;
    static getPackageInfoOrNull(packageFile: string, packageSuccess: SuccessCallback<LocalPackage>, packageError?: ErrorCallback): void;
    /**
     * Returns the default options for the CodePush install operation.
     * If the options are not defined yet, the static DefaultInstallOptions member will be instantiated.
     */
    private static getDefaultInstallOptions;
}
