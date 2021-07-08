var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CodePush as NativeCodePush } from "./nativeCodePushPlugin";
const DefaultServerUrl = "https://codepush.appcenter.ms/";
/**
 * Provides information about the native app.
 */
export class NativeAppInfo {
    /**
     * Gets the application build timestamp.
     */
    static getApplicationBuildTime() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield NativeCodePush.getNativeBuildTime();
                return result.value;
            }
            catch (e) {
                throw new Error("Could not get application timestamp.");
            }
        });
    }
    /**
     * Gets the application version.
     */
    static getApplicationVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield NativeCodePush.getAppVersion();
                return result.value;
            }
            catch (e) {
                throw new Error("Could not get application version.");
            }
        });
    }
    /**
     * Gets a hash of the `public` folder contents compiled in the app store binary.
     */
    static getBinaryHash() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield NativeCodePush.getBinaryHash();
                return result.value;
            }
            catch (e) {
                throw new Error("Could not get binary hash.");
            }
        });
    }
    /**
     * Gets the server URL from config.xml by calling into the native platform.
     */
    static getServerURL() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield NativeCodePush.getServerURL();
                return result.value;
            }
            catch (e) {
                return DefaultServerUrl;
            }
        });
    }
    /**
     * Gets the deployment key from config.xml by calling into the native platform.
     */
    static getDeploymentKey() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield NativeCodePush.getDeploymentKey();
                return result.value;
            }
            catch (e) {
                throw new Error("Deployment key not found.");
            }
        });
    }
    /**
     * Checks if a package update was previously attempted but failed for a given package hash.
     * Every reverted update is stored such that the application developer has the option to ignore
     * updates that previously failed. This way, an infinite update loop can be prevented in case of a bad update package.
     */
    static isFailedUpdate(packageHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield NativeCodePush.isFailedUpdate({ packageHash });
                return result.value;
            }
            catch (e) {
                /* In case of an error, return false. */
                return false;
            }
        });
    }
    /**
     * Checks if this is the first application run of a package after it has been applied.
     * The didUpdateCallback callback can be used for migrating data from the old app version to the new one.
     *
     * @param packageHash The hash value of the package.
     * @returns Whether it is the first run after an update.
     */
    static isFirstRun(packageHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield NativeCodePush.isFirstRun({ packageHash });
                return result.value;
            }
            catch (e) {
                /* In case of an error, return false. */
                return false;
            }
        });
    }
    /**
     * Checks with the native side if there is a pending update.
     */
    static isPendingUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield NativeCodePush.isPendingUpdate();
                return result.value;
            }
            catch (e) {
                /* In case of an error, return false. */
                return false;
            }
        });
    }
}
//# sourceMappingURL=nativeAppInfo.js.map