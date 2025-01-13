export function columnWidthStyle(cellWidthInPixels: number, minWidth?: number, maxWidth?: number): string {
    let style = 'width: inherit; min-width: ';
    if (!minWidth) {
        style += `${cellWidthInPixels}px; `;
    } else {
        style += `${minWidth}px; `;
    }

    style += `max-width: ${maxWidth ? maxWidth + 'px; ' : 'none'}; `;

    return style;
}

export function clipString(input: string, n: number = 150): string {
    if (input.length > n) {
        return input.slice(0, n - 3) + '...';
    }
    return input;
}