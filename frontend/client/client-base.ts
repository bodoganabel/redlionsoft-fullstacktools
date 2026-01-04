export class RedlionsoftClientBase {
    constructor(private config: {apiBaseFolderPath: string},
    ) { }
    /* Figures out the endpoint's url automatically. Pass import.meta.url to the arguments */
    automaticApiUrl(importMetaUrl: string): string {
        const fileUrl = new URL(importMetaUrl);
        const pathname = fileUrl.pathname;
        const withoutPrefix = pathname.replace(this.config.apiBaseFolderPath, '');
        const finalPath = withoutPrefix.replace('/client.ts', '');
        return finalPath;
    }

}