package mx.portaltransporte.security;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import org.springframework.stereotype.Service;

@Service
public class CryptoService {
    private final SecretKey aesKey; private final SecretKey lookupKey; private final SecureRandom random = new SecureRandom();
    public CryptoService(CryptoProperties properties) {
        try { aesKey = new SecretKeySpec(Base64.getDecoder().decode(properties.encryptionKey()), "AES"); lookupKey = new SecretKeySpec(Base64.getDecoder().decode(properties.lookupKey()), "HmacSHA256"); }
        catch (Exception exception) { throw new IllegalStateException("Missing or invalid cryptographic configuration", exception); }
    }
    public Ciphertext encrypt(String plain) {
        try { byte[] nonce = new byte[12]; random.nextBytes(nonce); Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(128, nonce)); return new Ciphertext(cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8)), nonce); }
        catch (GeneralSecurityException exception) { throw new IllegalStateException("Unable to encrypt data", exception); }
    }
    public String sha256(String value) { try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); } catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); } }
    public String lookup(String value) { try { Mac mac = Mac.getInstance("HmacSHA256"); mac.init(lookupKey); return HexFormat.of().formatHex(mac.doFinal(value.trim().toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8))); } catch (GeneralSecurityException exception) { throw new IllegalStateException(exception); } }
    // Descifra un valor AES-GCM. Actor: sistema al listar. Tecnica: mismo nonce guardado por registro.
    public String decrypt(byte[] value, byte[] nonce) { try { Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(128, nonce)); return new String(cipher.doFinal(value), StandardCharsets.UTF_8); } catch (GeneralSecurityException exception) { throw new IllegalStateException("Unable to decrypt data", exception); } }
    public record Ciphertext(byte[] value, byte[] nonce) { }
}
