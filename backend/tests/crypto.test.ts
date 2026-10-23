import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../src/lib/crypto.js";

describe("IPTV Credentials Encryption (AES-256-GCM)", () => {
  it("should encrypt and decrypt IPTV username correctly", () => {
    const original = "iptv_strong_user_992";
    const encrypted = encrypt(original);

    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(":"); // format iv:authTag:ciphertext

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should encrypt and decrypt IPTV password with special characters", () => {
    const original = "P@ssw0rd!#%&*()_-+=[]{}";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  it("should produce different ciphertexts for the same plaintext due to random IV", () => {
    const original = "mySecretPassword";
    const enc1 = encrypt(original);
    const enc2 = encrypt(original);

    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(original);
    expect(decrypt(enc2)).toBe(original);
  });

  it("should throw an error when decrypting tampered ciphertext", () => {
    const original = "superSecret";
    const encrypted = encrypt(original);
    const parts = encrypted.split(":");

    // Tamper with the ciphertext
    const tamperedCipher = parts[2].substring(0, parts[2].length - 2) + "00";
    const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedCipher}`;

    expect(() => decrypt(tamperedPayload)).toThrow();
  });

  it("should throw an error when encrypted format is invalid", () => {
    expect(() => decrypt("invalid-payload-without-colons")).toThrow();
  });
});
