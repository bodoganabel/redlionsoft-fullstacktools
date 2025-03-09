import { writable } from 'svelte/store';

export enum ScreenSize {
    MOBILE = 'mobile',    // < 640px
    TABLET = 'tablet',    // 640px - 1023px
    MEDIUM = 'medium',    // 1024px - 1279px
    LARGE = 'large'       // >= 1280px
}

interface ResponsiveState {
    width: number;
    height: number;
    screenSize: ScreenSize;
    isMobile: boolean;
    isLargerThanMobile: boolean;
    isLargerThanTablet: boolean;
    isMedium: boolean;
    isLarge: boolean;
}

interface Breakpoints {
    MOBILE: number;
    TABLET: number;
    MEDIUM: number;
}

let BREAKPOINTS: Breakpoints = {
    MOBILE: 640,
    TABLET: 1024,
    MEDIUM: 1280
};

function createConfigurableResponsiveStore() {
    const defaultState: ResponsiveState = {
        width: 0,
        height: 0,
        screenSize: ScreenSize.MOBILE,
        isMobile: true,
        isLargerThanMobile: false,
        isLargerThanTablet: false,
        isMedium: false,
        isLarge: false
    };

    const { subscribe, set } = writable<ResponsiveState>(defaultState);

    function updateDimensions() {
        if (typeof window === 'undefined') return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        let screenSize: ScreenSize;
        if (width < BREAKPOINTS.MOBILE) {
            screenSize = ScreenSize.MOBILE;
        } else if (width < BREAKPOINTS.TABLET) {
            screenSize = ScreenSize.TABLET;
        } else if (width < BREAKPOINTS.MEDIUM) {
            screenSize = ScreenSize.MEDIUM;
        } else {
            screenSize = ScreenSize.LARGE;
        }

        set({
            width,
            height,
            screenSize,
            isMobile: width < BREAKPOINTS.MOBILE,
            isLargerThanMobile: width >= BREAKPOINTS.MOBILE,
            isLargerThanTablet: width >= BREAKPOINTS.TABLET,
            isMedium: width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.MEDIUM,
            isLarge: width >= BREAKPOINTS.MEDIUM
        });
    }

    if (typeof window !== 'undefined') {
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
    }

    return {
        subscribe,
        destroy: () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', updateDimensions);
            }
        },
        configure: (breakpoints: Partial<Breakpoints>) => {
            BREAKPOINTS = { ...BREAKPOINTS, ...breakpoints };
            updateDimensions();
        }
    };
}

export const responsive = createConfigurableResponsiveStore();
