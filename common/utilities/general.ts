export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function UuidSimple() {
    const time = new Date().getTime();
    return time.toString();
}