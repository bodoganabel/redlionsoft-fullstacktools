export function formatDateToTime(date: Date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';

    // Convert to 12-hour format
    hours = hours % 12;
    // Convert 0 to 12 for midnight and noon
    hours = hours ? hours : 12;

    // Pad the minutes with a zero if less than 10
    const minutesString: string = minutes < 10 ? "0" + minutes.toString() : minutes.toString();

    return hours + ':' + minutesString + ' ' + ampm;
}


export function convertMinutesToHoursMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    const hoursPart = hours < 10 ? `0${hours}` : `${hours}`;
    const minutesPart = remainingMinutes < 10 ? `0${remainingMinutes}` : `${remainingMinutes}`;

    return `${hoursPart}:${minutesPart}`;
}

export interface IPriceFormatterOptions {
    preSign: string;
    postSign: string;
    groupDigitsSeparator: string;
    fractionDigits: number;
    fractionSeparator: string;
}

export function formatPrice(price: number, options: Partial<IPriceFormatterOptions> = {}): string {

    const defaultOptions: IPriceFormatterOptions = {
        preSign: '',
        postSign: '',
        groupDigitsSeparator: ',',
        fractionDigits: 2,
        fractionSeparator: '.',
    };

    const combinedOptions = {...defaultOptions,...options}

    const { preSign, postSign, groupDigitsSeparator, fractionDigits, fractionSeparator } = combinedOptions;

    // Split the price into integer and fraction parts
    const [integerPart, fractionPart] = price.toFixed(fractionDigits).split('.');

    // Add grouping to the integer part
    const groupedIntegerPart = integerPart?.replace(/\B(?=(\d{3})+(?!\d))/g, groupDigitsSeparator) || NaN;

    // Combine the grouped integer part and the fraction part
    const formattedPrice = `${groupedIntegerPart}${fractionSeparator}${fractionPart}`;

    // Add preSign and postSign
    return `${preSign}${formattedPrice}${postSign}`;
}
