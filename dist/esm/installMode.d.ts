/**
 * Defines the available install modes for updates.
 */
export declare enum InstallMode {
    /**
     * The update will be applied to the running application immediately. The application will be reloaded with the new content immediately.
     */
    IMMEDIATE = 0,
    /**
     * The update is downloaded but not installed immediately. The new content will be available the next time the application is started.
     */
    ON_NEXT_RESTART = 1,
    /**
     * The udpate is downloaded but not installed immediately. The new content will be available the next time the application is resumed or restarted, whichever event happends first.
     */
    ON_NEXT_RESUME = 2
}
