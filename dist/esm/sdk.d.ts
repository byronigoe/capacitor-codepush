import { AcquisitionManager } from "code-push/script/acquisition-sdk";
import { Callback } from "./callbackUtil";
import { IPackage } from "./package";
/**
 * Interacts with the CodePush Acquisition SDK.
 */
export declare class Sdk {
    private static DefaultAcquisitionManager;
    private static DefaultConfiguration;
    /**
     * Reads the CodePush configuration and creates an AcquisitionManager instance using it.
     */
    static getAcquisitionManager(userDeploymentKey?: string, contentType?: string): Promise<AcquisitionManager>;
    /**
     * Reports the deployment status to the CodePush server.
     */
    static reportStatusDeploy(pkg?: IPackage, status?: string, currentDeploymentKey?: string, previousLabelOrAppVersion?: string, previousDeploymentKey?: string, callback?: Callback<void>): Promise<void>;
    /**
     * Reports the download status to the CodePush server.
     */
    static reportStatusDownload(pkg: IPackage, deploymentKey?: string, callback?: Callback<void>): Promise<void>;
}
