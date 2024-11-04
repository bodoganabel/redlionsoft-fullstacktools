import { isProduction } from '../../../common/index'

export class LOCALDB {
    static get(key: string, defaultValue: any) {

        if (typeof window !== "undefined") {
            const data = window.localStorage.getItem(key);
            if (data) {
                try {
                    return JSON.parse(data);
                } catch (error) {
                    if (!isProduction()) {

                        console.log(`Error parsing ${key} from local storage:`, error);
                    }
                }
            }
            return defaultValue;
        }
    }

    static set(key: string, value: any) {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
    }
}