export const REGEX_VALID_EMAIL =
  /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
export const REGEX_VALID_PHONE_INTERNATIONAL = /^\+\s*(\d\s*){6,14}$/;

export const VALIDATOR_IS_EMAIL =
  (message = "Invalid email") =>
  (value: string) => {
    if (REGEX_VALID_EMAIL.test(value) === false) return message;
  };

export const VALIDATOR_IS_PHONE_INTERNATIONAL =
  (message = "Invalid phone", required = true) =>
  (value: string) => {
    if (required === false && value === "") return;
    if (REGEX_VALID_PHONE_INTERNATIONAL.test(value) === false) return message;
  };

export const VALIDATOR_MINLENGTH =
  (minCharacters: number, message = "Not enough characters") =>
  (value: string) => {
    if (value.length < minCharacters) return message;
  };

export const VALIDATOR_MAXLENGTH =
  (maxCharacters: number, message = "Too many characters") =>
  (value: string) => {
    if (value.length > maxCharacters) return message;
  };

export const VALIDATOR_REQUIRE_STRING =
  (message = "Required field") =>
  (value: string) => {
    if (value === "") return message;
  };

export const VALIDATOR_IS_FLOAT =
  (message = "Not a valid number") =>
  (value: string) => {
    if (isNaN(parseFloat(value)) || !isFinite(+value)) return message;
  };

export const VALIDATOR_MIN_VALUE =
  (minValue: number, message = "Too low") =>
  (value: string) => {
    const valueFloat = parseFloat(value);
    if (valueFloat < minValue) return message;
  };

export const VALIDATOR_MAX_VALUE =
  (maxValue: number, message = "Too high") =>
  (value: string) => {
    const valueFloat = parseFloat(value);
    if (valueFloat > maxValue) return message;
  };

export const VALIDATOR_REQUIRE_NUMBER_FLOAT =
  (message = "Required field") =>
  (value: string) => {
    if (isNaN(parseFloat(value))) return message;
  };

export const VALIDATOR_REQUIRE_NUMBER_DECIMAL =
  (message = "Required field") =>
  (value: string) => {
    if (isNaN(parseInt(value, 10))) return message;
  };
