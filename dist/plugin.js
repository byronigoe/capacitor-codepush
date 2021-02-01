(function (core) {
    'use strict';

    /**
     * Defines the available install modes for updates.
     */
    var InstallMode;
    (function (InstallMode) {
        /**
         * The update will be applied to the running application immediately. The application will be reloaded with the new content immediately.
         */
        InstallMode[InstallMode["IMMEDIATE"] = 0] = "IMMEDIATE";
        /**
         * The update is downloaded but not installed immediately. The new content will be available the next time the application is started.
         */
        InstallMode[InstallMode["ON_NEXT_RESTART"] = 1] = "ON_NEXT_RESTART";
        /**
         * The udpate is downloaded but not installed immediately. The new content will be available the next time the application is resumed or restarted, whichever event happends first.
         */
        InstallMode[InstallMode["ON_NEXT_RESUME"] = 2] = "ON_NEXT_RESUME";
    })(InstallMode || (InstallMode = {}));

    (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    core.Plugins.CodePush;

    (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    core.Plugins.CodePush;

    (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    /**
     * Defines the possible result and intermediate statuses of the window.codePush.sync operation.
     * The result statuses are final, mutually exclusive statuses of the sync operation. The operation will end with only one of the possible result statuses.
     * The intermediate statuses are not final, one or more of them can happen before sync ends, based on the options you use and user interaction.
     *
     * NOTE: Adding new statuses or changing old statuses requires an update to CodePush.sync(), which must know which callbacks are results and which are not!
     *       Also, don't forget to change the TestMessage module in ServerUtils!
     *       AND THE codePush.d.ts (typings) file!!!
     */
    var SyncStatus;
    (function (SyncStatus) {
        /**
         * Result status - the application is up to date.
         */
        SyncStatus[SyncStatus["UP_TO_DATE"] = 0] = "UP_TO_DATE";
        /**
         * Result status - an update is available, it has been downloaded, unzipped and copied to the deployment folder.
         * After the completion of the callback invoked with SyncStatus.UPDATE_INSTALLED, the application will be reloaded with the updated code and resources.
         */
        SyncStatus[SyncStatus["UPDATE_INSTALLED"] = 1] = "UPDATE_INSTALLED";
        /**
         * Result status - an optional update is available, but the user declined to install it. The update was not downloaded.
         */
        SyncStatus[SyncStatus["UPDATE_IGNORED"] = 2] = "UPDATE_IGNORED";
        /**
         * Result status - an error happened during the sync operation. This might be an error while communicating with the server, downloading or unziping the update.
         * The console logs should contain more information about what happened. No update has been applied in this case.
         */
        SyncStatus[SyncStatus["ERROR"] = 3] = "ERROR";
        /**
         * Result status - there is an ongoing sync in progress, so this attempt to sync has been aborted.
         */
        SyncStatus[SyncStatus["IN_PROGRESS"] = 4] = "IN_PROGRESS";
        /**
         * Intermediate status - the plugin is about to check for updates.
         */
        SyncStatus[SyncStatus["CHECKING_FOR_UPDATE"] = 5] = "CHECKING_FOR_UPDATE";
        /**
         * Intermediate status - a user dialog is about to be displayed. This status will be reported only if user interaction is enabled.
         */
        SyncStatus[SyncStatus["AWAITING_USER_ACTION"] = 6] = "AWAITING_USER_ACTION";
        /**
         * Intermediate status - the update packages is about to be downloaded.
         */
        SyncStatus[SyncStatus["DOWNLOADING_PACKAGE"] = 7] = "DOWNLOADING_PACKAGE";
        /**
         * Intermediate status - the update package is about to be installed.
         */
        SyncStatus[SyncStatus["INSTALLING_UPDATE"] = 8] = "INSTALLING_UPDATE";
    })(SyncStatus || (SyncStatus = {}));

    (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    core.Plugins.CodePush;
    /**
     * Defines the application statuses reported from the native layer.
     * !!! This enum is defined in native code as well, please make changes accordingly. !!!
     */
    var ReportStatus;
    (function (ReportStatus) {
        ReportStatus[ReportStatus["STORE_VERSION"] = 0] = "STORE_VERSION";
        ReportStatus[ReportStatus["UPDATE_CONFIRMED"] = 1] = "UPDATE_CONFIRMED";
        ReportStatus[ReportStatus["UPDATE_ROLLED_BACK"] = 2] = "UPDATE_ROLLED_BACK";
    })(ReportStatus || (ReportStatus = {}));

}(capacitorExports));
//# sourceMappingURL=plugin.js.map
