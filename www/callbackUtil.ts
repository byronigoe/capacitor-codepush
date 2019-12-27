export interface Callback<T> { (error: Error, parameter: T): void; }
export interface SuccessCallback<T> { (result?: T): void; }
export interface ErrorCallback { (error?: Error): void; }
