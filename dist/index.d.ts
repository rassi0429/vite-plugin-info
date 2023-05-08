import { Plugin } from 'vite';

interface UserOption {
    /**
     * Git repo root path
     */
    root?: string;
    /**
     * Github repo url
     */
    github?: string;
    /**
     * Custom virtual module prefix
     *
     * @default '~build'
     */
    prefix?: string;
    /**
     * Pass some meta data to Vite app
     *
     * Notice: meta data will be serialized to JSON format
     */
    meta?: Record<string | number | symbol, any>;
}
declare function createInfoPlugin(option?: UserOption): Plugin;

export { UserOption, createInfoPlugin as default };
