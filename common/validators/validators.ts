export const REGEX_VALID_EMAIL = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
export const REGEX_VALID_PHONE_INTERNATIONAL = /^\+\s*(\d\s*){6,14}$/;

export const VALIDATOR_IS_EMAIL = (message = 'Invalid email') => (value: string) => { if (REGEX_VALID_EMAIL.test(value) === false) return message; }

export const VALIDATOR_IS_PHONE_INTERNATIONAL = (message = 'Invalid phone') => (value: string) => { if (REGEX_VALID_PHONE_INTERNATIONAL.test(value) === false) return message; }

export const VALIDATOR_MINLENGTH = (minCharacters: number,message = 'Not enough characters') => (value: string) => { if (value.length < minCharacters) return message;}

export const VALIDATOR_REQUIRE_STRING = (message = "Required field") => (value: string, ) => {
    if (value === '') return message;
}