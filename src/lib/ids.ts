import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
export const newId = customAlphabet(alphabet, 16);
/** Short, unambiguous code for sharing plans with friends. */
export const newShareCode = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 6);
export const shortId = customAlphabet(alphabet, 8);
