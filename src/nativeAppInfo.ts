import { CodePush as NativeCodePush } from "./nativeCodePushPlugin";

const DefaultServerUrl: string = "https://codepush.appcenter.ms/";

/**
 * Provides information about the native app.
 */
export class NativeAppInfo {

    /**
     * Gets the application build timestamp.
     */
    public static async getApplicationBuildTime(): Promise<string> {
        try {
            const result = await NativeCodePush.getNativeBuildTime();
            return result.value;
        } catch (e) {
            throw new Error("Could not get application timestamp.");
        }
    }

    /**
     * Gets the application version.
     */
    public static async getApplicationVersion(): Promise<string> {
        try {
            const result = await NativeCodePush.getAppVersion();
            return result.value;
        } catch (e) {
            throw new Error("Could not get application version.");
        }
    }

    /**
     * Gets a hash of the `public` folder contents compiled in the app store binary.
     */
    public static async getBinaryHash(): Promise<string> {
        try {
            const result = await NativeCodePush.getBinaryHash();
            return result.value;
        } catch (e) {
            throw new Error("Could not get binary hash.");
        }
    }

    /**
     * Gets the server URL from config.xml by calling into the native platform.
     */
    public static async getServerURL(): Promise<string> {
        try {
            const result = await NativeCodePush.getServerURL();
            return result.value;
        } catch (e) {
            return DefaultServerUrl;
        }
    }

    /**
     * Gets the deployment key from config.xml by calling into the native platform.
     */
    public static async getDeploymentKey(): Promise<string> {
        try {
            const result = await NativeCodePush.getDeploymentKey();
            return result.value;
        } catch (e) {
            throw new Error("Deployment key not found.");
        }
    }

    /**
     * Checks if a package update was previously attempted but failed for a given package hash.
     * Every reverted update is stored such that the application developer has the option to ignore
     * updates that previously failed. This way, an infinite update loop can be prevented in case of a bad update package.
     */
    public static async isFailedUpdate(packageHash: string): Promise<boolean> {
        try {
            const result = await NativeCodePush.isFailedUpdate({packageHash});
            return result.value;
        } catch (e) {
            /* In case of an error, return false. */
            return false;
        }
    }

    /**
     * Checks if this is the first application run of a package after it has been applied.
     * The didUpdateCallback callback can be used for migrating data from the old app version to the new one.
     *
     * @param packageHash The hash value of the package.
     * @returns Whether it is the first run after an update.
     */
    public static async isFirstRun(packageHash: string): Promise<boolean> {
        try {
            const result = await NativeCodePush.isFirstRun({packageHash});
            return result.value;
        } catch (e) {
            /* In case of an error, return false. */
            return false;
        }
    }

    /**
     * Checks with the native side if there is a pending update.
     */
    public static async isPendingUpdate(): Promise<boolean> {
        try {
            const result = await NativeCodePush.isPendingUpdate();
            return result.value;
        } catch (e) {
            /* In case of an error, return false. */
            return false;
        }
    }
}
