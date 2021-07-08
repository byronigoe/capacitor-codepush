/**
 * Provides information about the native app.
 */
export declare class NativeAppInfo {
    /**
     * Gets the application build timestamp.
     */
    static getApplicationBuildTime(): Promise<string>;
    /**
     * Gets the application version.
     */
    static getApplicationVersion(): Promise<string>;
    /**
     * Gets a hash of the `public` folder contents compiled in the app store binary.
     */
    static getBinaryHash(): Promise<string>;
    /**
     * Gets the server URL from config.xml by calling into the native platform.
     */
    static getServerURL(): Promise<string>;
    /**
     * Gets the deployment key from config.xml by calling into the native platform.
     */
    static getDeploymentKey(): Promise<string>;
    /**
     * Checks if a package update was previously attempted but failed for a given package hash.
     * Every reverted update is stored such that the application developer has the option to ignore
     * updates that previously failed. This way, an infinite update loop can be prevented in case of a bad update package.
     */
    static isFailedUpdate(packageHash: string): Promise<boolean>;
    /**
     * Checks if this is the first application run of a package after it has been applied.
     * The didUpdateCallback callback can be used for migrating data from the old app version to the new one.
     *
     * @param packageHash The hash value of the package.
     * @returns Whether it is the first run after an update.
     */
    static isFirstRun(packageHash: string): Promise<boolean>;
    /**
     * Checks with the native side if there is a pending update.
     */
    static isPendingUpdate(): Promise<boolean>;
}
