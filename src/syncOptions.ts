import { SyncStatus } from "./syncStatus";
import type { ErrorCallback, SuccessCallback } from "./callbackUtil";
import type { InstallOptions } from "./installOptions";

/**
 * Defines the sync operation options.
 */
export interface SyncOptions extends InstallOptions {
    /**
     * Optional boolean flag. If set, previous updates which were rolled back will be ignored. Defaults to true.
     */
    ignoreFailedUpdates?: boolean;

    /**
     * Used to enable, disable or customize the user interaction during sync.
     * If set to false, user interaction will be disabled. If set to true, the user will be alerted or asked to confirm new updates, based on whether the update is mandatory.
     * To customize the user dialog, this option can be set to a custom UpdateDialogOptions instance.
     */
    updateDialog?: boolean | UpdateDialogOptions;

    /**
     * Overrides the config.xml deployment key when checking for updates.
     */
    deploymentKey?: string;

    /**
     * A callback to call when the SyncStatus changes.
     */
    onSyncStatusChanged?: SuccessCallback<SyncStatus>;

    /**
     * A callback to call when the SyncStatus changes.
     */
    onSyncError?: ErrorCallback;
}

/**
 * Defines the configuration options for the alert or confirmation dialog
 */
export interface UpdateDialogOptions {
    /**
     * If a mandatory update is available and this option is set, the message will be displayed to the user in an alert dialog before downloading and installing the update.
     * The user will not be able to cancel the operation, since the update is mandatory.
     */
    mandatoryUpdateMessage?: string;

    /**
     * If an optional update is available and this option is set, the message will be displayed to the user in a confirmation dialog.
     * If the user confirms the update, it will be downloaded and installed. Otherwise, the update update is not downloaded.
     */
    optionalUpdateMessage?: string;

    /**
     * The title of the dialog box used for interacting with the user in case of a mandatory or optional update.
     * This title will only be used if at least one of mandatoryUpdateMessage or optionalUpdateMessage options are set.
     */
    updateTitle?: string;

    /**
     * The label of the confirmation button in case of an optional update.
     */
    optionalInstallButtonLabel?: string;

    /**
     * The label of the cancel button in case of an optional update.
     */
    optionalIgnoreButtonLabel?: string;

    /**
     * The label of the continue button in case of a mandatory update.
     */
    mandatoryContinueButtonLabel?: string;

    /**
     * Flag indicating if the update description provided by the CodePush server should be displayed in the dialog box appended to the update message.
     */
    appendReleaseDescription?: boolean;

    /**
     * Optional prefix to add to the release description.
     */
    descriptionPrefix?: string;
}
