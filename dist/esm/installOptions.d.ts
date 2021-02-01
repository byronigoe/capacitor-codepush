import { InstallMode } from "./installMode";
/**
 * Defines the install operation options.
 */
export interface InstallOptions {
    /**
     * Used to specify the InstallMode used for the install operation. This is optional and defaults to InstallMode.ON_NEXT_RESTART.
     */
    installMode?: InstallMode;
    /**
     * If installMode === ON_NEXT_RESUME, the minimum amount of time (in seconds) which needs to pass with the app in the background before an update install occurs when the app is resumed.
     */
    minimumBackgroundDuration?: number;
    /**
     * Used to specify the InstallMode used for the install operation if the update is mandatory. This is optional and defaults to InstallMode.IMMEDIATE.
     */
    mandatoryInstallMode?: InstallMode;
}
