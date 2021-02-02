import type { NativeCodePushPlugin } from "./nativeCodePushPlugin";

declare module "@capacitor/core" {
  interface PluginRegistry {
    CodePush: NativeCodePushPlugin;
  }
}
